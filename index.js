/* eslint no-eval: 0 */
const fs = require('fs');
const path = require('path');
const pug = require('pug');
const debug = require('debug')('cache-pug-templates');
const async = require('async');
const revHash = require('rev-hash');

// <https://github.com/pugjs/pug/issues/3065>
Object.entries(pug.runtime).forEach((key, value) => {
  pug[key] = value;
});

// eslint-disable-next-line max-params
const writeCache = (client, filename, key, hash, str, fn) => {
  debug('compiling template with pug.compile and storing to redis');
  const tmpl = pug.compile(str, { filename });
  pug.cache[filename] = tmpl;
  async.parallel(
    [fn => client.set(key, hash, fn), fn => client.set(hash, `(${tmpl})`, fn)],
    fn
  );
};
const cacheFile = (client, filename, dir, fn) => {
  fs.readFile(filename, 'utf8', (err, str) => {
    if (err) return fn(err);

    const hash = revHash(str);

    debug(`hash for ${filename} was ${hash}`);

    const key = `views:${filename}`;

    // lookup the existing key for this file
    // e.g. [ 'foo.pug': '123456' ]
    client.get(key, (err, keyHash) => {
      if (err) return fn(err);

      debug(`${key} was found with ${keyHash}`);

      // now we need to lookup the data stored for this hash
      // [ '123456', 'compiled-pug-template-str' ]
      if (keyHash) {
        debug(`key hash equality is ${keyHash === hash}`);

        // if there was a key hash existing
        // then make sure that it matches
        // otherwise delete it and start over
        if (keyHash !== hash) {
          debug(`hash changed for ${filename} so we are recompiling`);
          writeCache(client, filename, key, hash, str, fn);
          return;
        }

        client.get(keyHash, (err, compiledStr) => {
          if (err) return fn(err);

          // the compiled template string did not exist
          // so delete key hash and start over
          if (!compiledStr) {
            debug(`key hash existed for ${filename} but its str was missing`);
            writeCache(client, filename, key, hash, str, fn);
            return;
          }

          // it did exist, so we need to use it
          debug(`re-using cache for ${filename} since it was unmodified`);
          pug.cache[filename] = eval(compiledStr);
          fn();
        });
        return;
      }
      writeCache(client, filename, key, hash, str, fn);
    });
  });
};

const cacheDirectory = (client, dir, fn) => {
  fs.readdir(dir, (err, files) => {
    if (err) return fn(err);
    async.each(
      files,
      (file, fn) => {
        const filename = path.join(dir, file);
        fs.stat(filename, (err, stat) => {
          if (err) return fn(err);

          if (stat.isDirectory()) return cacheDirectory(client, filename, fn);

          debug(`checking ${filename}`);

          if (path.extname(filename) !== '.pug') {
            debug(`${filename} did not have ".pug" extension`);
            return fn();
          }

          if (pug.cache[filename]) {
            debug(`${filename} was already cached in pug.cache`);
            return fn();
          }

          cacheFile(client, filename, dir, fn);
        });
      },
      fn
    );
  });
};

const preCachePugViews = (app, client, views, fn) => {
  if (typeof app === 'undefined')
    throw new Error(
      'app argument must be defined (e.g. koa or express instance)'
    );

  // support client as first argument
  let pure = false;
  if (app.constructor && app.constructor.name === 'RedisClient') {
    fn = views;
    views = client;
    client = app;
    pure = true;
  }

  if (typeof client !== 'object')
    throw new Error('redis client argument must be defined');

  if (typeof views === 'function') {
    fn = views;
    views = undefined;
  }

  if (typeof fn !== 'function')
    fn = err => {
      if (err) console.error(err);
    };

  debug('pre-caching pug views');

  //
  // detect if we're using koa or express/connect
  //

  // koa
  if (typeof app.context === 'object') {
    debug('detected koa');

    // ensure that views is defined and is a string
    if (typeof views !== 'string')
      throw new Error('`views` directory argument must be provided for koa');

    // only continue if `env` is production
    // or if `app.cacheViews = true` is set
    if (app.env !== 'production' && !app.cache) {
      debug('koa env was not production and app.cache not set');
      return fn(null, []);
    }
  } else if (!pure) {
    //
    // express/connect
    //
    debug('detected express/connect');

    // only continue if caching is enabled
    if (!app.enabled('view cache')) {
      debug('view cache was not enabled');
      return fn(null, []);
    }

    // only continue if pug is the view engine
    if (app.get('view engine') !== 'pug') {
      const errorMessage = `view engine was "${app.get(
        'view engine'
      )}" and needs to be set to "pug"`;
      debug(errorMessage);
      throw new Error(errorMessage);
    }

    // views is always defined (defaults to `/views`)
    views = typeof views === 'string' ? views : app.get('views');
  }

  // cache directory
  cacheDirectory(client, views, err => {
    if (err) {
      debug(err.message);
      return fn(err);
    }
    debug(`cached (${Object.keys(pug.cache).length}) files`);
    fn(null, Object.keys(pug.cache));
  });
};

module.exports = preCachePugViews;
