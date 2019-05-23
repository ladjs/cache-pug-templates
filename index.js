const fs = require('fs');
const path = require('path');
const pug = require('pug');
const debug = require('debug')('cache-pug-templates');
const async = require('async');

// <https://github.com/pugjs/pug/issues/3065>
Object.entries(pug.runtime).forEach((key, value) => {
  pug[key] = value;
});

class CachePugTemplates {
  constructor(config) {
    this.config = {
      app: false,
      views: false,
      concurrency: 1,
      ...config
    };

    this.queuedFiles = [];

    //
    // detect if we're using koa or express/connect
    //
    if (this.config.app) {
      // koa
      if (typeof this.config.app.context === 'object') {
        debug('detected koa');

        // ensure that views is defined and is a string
        if (typeof this.config.views !== 'string')
          throw new Error(
            '`views` directory argument must be provided for koa'
          );
      } else {
        //
        // express/connect
        //
        debug('detected express/connect');

        // only continue if pug is the view engine
        if (this.config.app.get('view engine') !== 'pug') {
          const errorMessage = `view engine was "${this.config.app.get(
            'view engine'
          )}" and needs to be set to "pug"`;
          throw new Error(errorMessage);
        }

        // views is always defined (defaults to `/views`)
        this.config.views =
          typeof this.config.views === 'string'
            ? this.config.views
            : this.config.app.get('views');
      }
    }

    this.writeCache = this.writeCache.bind(this);
    this.cacheDirectory = this.cacheDirectory.bind(this);
    this.start = this.start.bind(this);
    this.startQueue = this.startQueue.bind(this);
  }

  startQueue() {
    debug(
      `queued (${this.queuedFiles.length}) files and running (${
        this.config.concurrency
      }) at once`
    );
    async.eachLimit(
      this.queuedFiles,
      this.config.concurrency,
      (filename, fn) => {
        this.writeCache(filename, fn);
      },
      err => {
        if (err) console.error(err);
        debug('done with queue');
      }
    );
  }

  writeCache(filename, fn) {
    debug(`compiling template located at ${filename}`);
    fs.readFile(filename, 'utf8', (err, str) => {
      if (err) return fn(err);
      try {
        const options = { cache: true, basedir: this.config.basedir, filename };
        if (pug.cache[filename]) return fn();
        pug.cache[filename] = pug.compile(str, options);
        fn();
      } catch (err2) {
        fn(err2);
      }
    });
  }

  cacheDirectory(dir, fn) {
    fs.readdir(dir, (err, files) => {
      if (err) return fn(err);
      async.each(
        files,
        (file, fn) => {
          const filename = path.join(dir, file);
          fs.stat(filename, (err, stat) => {
            if (err) return fn(err);

            if (stat.isDirectory()) return this.cacheDirectory(filename, fn);

            debug(`checking ${filename}`);

            if (path.extname(filename) !== '.pug') {
              debug(`${filename} did not have ".pug" extension`);
              return fn();
            }

            if (pug.cache[filename]) {
              debug(`${filename} was already cached in pug.cache`);
              return fn();
            }

            this.queuedFiles.push(filename);
            fn();
          });
        },
        fn
      );
    });
  }

  start(
    fn = err => {
      if (err) throw err;
    }
  ) {
    debug('pre-caching pug views');

    if (this.config.app) {
      // koa
      if (typeof this.config.app.context === 'object') {
        // only continue if `env` is production
        // or if `app.cacheViews = true` is set
        if (this.config.app.env !== 'production' && !this.config.app.cache) {
          debug('koa env was not production and app.cache not set');
          return fn(null, []);
        }
      } else if (!this.config.app.enabled('view cache')) {
        // only continue if caching is enabled
        debug('view cache was not enabled');
        return fn(null, []);
      }
    }

    // cache directory
    this.cacheDirectory(this.config.views, err => {
      if (err) {
        debug(err.message);
        return fn(err);
      }

      fn(null, this.queuedFiles);
      this.startQueue();
    });
  }
}

module.exports = CachePugTemplates;
