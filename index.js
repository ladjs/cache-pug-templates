const fs = require('fs');
const path = require('path');
const autoBind = require('auto-bind');
const pug = require('pug');
const debug = require('debug')('cache-pug-templates');
const _ = require('lodash');
const rateLimit = require('function-rate-limit');

// <https://github.com/pugjs/pug/issues/3065>
for (const [key, value] of Object.entries(pug.runtime)) {
  pug[key] = value;
}

class CachePugTemplates {
  constructor(config) {
    this.config = {
      app: false,
      views: false,
      logger: console,
      callback: false,
      cache: true,
      concurrency: 1,
      interval: 500,
      ...config
    };

    this.queuedFiles = [];

    // legacy support for `views` being a String
    if (_.isString(this.config.views)) this.config.views = [this.config.views];

    //
    // detect if we're using koa or express/connect
    //
    if (this.config.app) {
      // koa
      if (_.isObject(this.config.app.context)) {
        debug('detected koa');

        // ensure that views is defined and is a string
        if (_.isArray(this.config.views) && _.isEmpty(this.config.views))
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
        if (!_.isArray(this.config.views)) this.config.views = [];

        this.config.views.push(this.config.app.get('views'));
      }
    }

    this.config.views = _.uniq(this.config.views);

    debug(this.config);

    autoBind(this);

    this.rateLimitedCacheFile = rateLimit(
      this.config.concurrency,
      this.config.interval,
      this.cacheFile.bind(this)
    );
  }

  writeCache(filename) {
    debug(`compiling template located at ${filename}`);
    fs.readFile(filename, 'utf8', (err, str) => {
      if (err) return this.config.logger.error(err);
      const options = { cache: true, filename };
      if (pug.cache[filename])
        return this.config.logger.warn(
          `${filename} was already cached in pug.cache`
        );
      // <https://github.com/pugjs/pug/issues/2206>
      setImmediate(() => {
        const template = pug.compile(str, options);
        if (this.config.cache) {
          debug(`caching ${filename}`);
          try {
            pug.cache[filename] = template;
          } catch (err) {
            this.config.logger.error(err);
          }
        } else {
          debug(
            `not caching ${filename} since \`cache\` option was set to \`false\``
          );
        }

        if (_.isFunction(this.config.callback))
          this.config.callback(filename, template);
      });
    });
  }

  cacheFile(filename) {
    fs.stat(filename, (err, stat) => {
      if (err) return this.config.logger.error(err);

      if (stat.isDirectory()) {
        setImmediate(() => {
          this.cacheDirectory(filename);
        });
        return;
      }

      debug(`checking ${filename}`);

      if (path.extname(filename) !== '.pug') {
        debug(`${filename} did not have ".pug" extension`);
        return;
      }

      if (pug.cache[filename]) {
        debug(`${filename} was already cached in pug.cache`);
        return;
      }

      setImmediate(() => {
        this.writeCache(filename);
      });
    });
  }

  getFilename(dir) {
    return file => path.join(dir, file);
  }

  cacheDirectory(dir) {
    fs.readdir(dir, (err, files) => {
      if (err) return this.config.logger.error(err);
      for (let i = 0; i < files.length; i++) {
        setImmediate(() => {
          const filename = this.getFilename(dir)(files[i]);
          this.rateLimitedCacheFile(filename);
        });
      }
    });
  }

  start() {
    debug('pre-caching pug views');

    if (this.config.app) {
      // koa
      if (_.isObject(this.config.app.context)) {
        // only continue if `env` is production
        // or if `app.cacheViews = true` is set
        if (this.config.app.env !== 'production' && !this.config.app.cache) {
          debug('koa env was not production and app.cache not set');
          return;
        }
      } else if (!this.config.app.enabled('view cache')) {
        // only continue if caching is enabled
        debug('view cache was not enabled');
        return;
      }
    }

    // cache directories
    for (let i = 0; i < this.config.views.length; i++) {
      setImmediate(() => {
        this.cacheDirectory(this.config.views[i]);
      });
    }
  }
}

module.exports = CachePugTemplates;
