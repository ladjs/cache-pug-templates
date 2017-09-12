const fs = require('fs');
const path = require('path');
const pug = require('pug');
const debug = require('debug')('pre-cache-pug-views');

// note that we use sync methods
// since pug itself uses sync
const cacheDirectory = dir => {
  // we could use async/await here
  // but we want to support node
  // versions >= 6.4.x and <= 7.10.1
  // since express users might be outdated
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) return cacheDirectory(filePath);
    if (path.extname(filePath) !== '.pug')
      return debug(`${filePath} did not have ".pug" extension`);
    debug(`caching ${filePath}`);
    pug.compileFile(filePath, { cache: true });
  });
};

const preCachePugViews = (app, views, fn) => {
  return function() {
    debug('pre-caching pug views');

    if (typeof views === 'function') {
      fn = views;
      views = undefined;
    }

    if (typeof fn !== 'function')
      fn = err => {
        if (err) console.error(err);
      };

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
      if (app.env !== 'production' && !app.context.state.cache) {
        debug('koa env was not production and app.context.state.cache not set');
        return fn();
      }
    } else {
      //
      // express/connect
      //
      debug('detected express/connect');

      // only continue if caching is enabled
      if (!app.enabled('view cache')) {
        debug('view cache was not enabled');
        return fn();
      }

      // only continue if pug is the view engine
      if (app.get('view engine') !== 'pug')
        throw new Error(
          `view engine was "${app.get(
            'view engine'
          )}" and needs to be set to "pug"`
        );

      // views is always defined (defaults to `/views`)
      views = typeof views === 'string' ? views : app.get('views');
    }

    // cache directory
    try {
      cacheDirectory(views);
      debug(`cached (${Object.keys(pug.cache).length}) files`);
      fn();
    } catch (err) {
      debug(err.message);
      fn(err);
    }
  };
};

module.exports = preCachePugViews;
