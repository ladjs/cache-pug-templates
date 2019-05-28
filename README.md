# cache-pug-templates

[![build status](https://img.shields.io/travis/ladjs/cache-pug-templates.svg)](https://travis-ci.org/ladjs/cache-pug-templates)
[![code coverage](https://img.shields.io/codecov/c/github/ladjs/cache-pug-templates.svg)](https://codecov.io/gh/ladjs/cache-pug-templates)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/cache-pug-templates.svg)](<>)

> Cache [Pug][] templates for [Lad][]/[Koa][]/[Express][]/[Connect][].


## Table of Contents

* [Install](#install)
* [Usage](#usage)
  * [Basic](#basic)
  * [Koa](#koa)
  * [Express](#express)
* [Options](#options)
* [Custom Callback](#custom-callback)
* [Debugging](#debugging)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install cache-pug-templates
```

[yarn][]:

```sh
yarn add cache-pug-templates
```


## Usage

### Basic

```js
const path = require('path');
const CachePugTemplates = require('cache-pug-templates');

const views = path.join(__dirname, 'views');

const cache = new CachePugTemplates({ views });
cache.start();
```

### Koa

```js
const path = require('path');
const Koa = require('koa');
const CachePugTemplates = require('cache-pug-templates');

const app = new Koa();

// optional (e.g. if you want to cache in non-production)
// app.cache = true;

// note that koa requires us to specify a
// path name for the views directory
const views = path.join(__dirname, 'views');

app.listen(3000, () => {
  const cache = new CachePugTemplates({ app, views });
  cache.start();
});
```

### Express

```js
const path = require('path');
const express = require('express');
const CachePugTemplates = require('cache-pug-templates');

const app = express();

// optional (by default express defaults to `./views`)
// app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'pug');

app.listen(3000, () => {
  const cache = new CachePugTemplates({ app, views });
  cache.start();
});
```


## Options

* `app` (Object) - an instance of Koa, Express, or Connect
* `views` (String or Array) - a file directory path (or an Array of file directory paths) (if you pass an Express app instance as the `app` option, this will be automatically populated to your applications `views` configuration option via `app.get('views')`)
* `logger` (Object) - a logger, defaults to `console` (we recommend using [Cabin][] for your logger)
* `callback` (Function) - defaults to `false` (no operation), but if a function is provided then it will be invoked with two arguments, `file` (String) and `template` (Function)
* `cache` (Boolean) - defaults to `true`, whether or not to cache templates automatically if `cache.start()` is called (useful if you are writing tests or have a custom approach using `callback` function)
* `concurrency` (Number) - number of concurrent files that can be cached per `interval` in parallel (defaults to `1`)
* `interval` (Number) - duration of time in (milliseconds) to limit concurrency for (e.g. `1 cached file every 1000ms` is the default), this value's default is `1000`


## Custom Callback

You can also pass an optional callback function with arguments `err` and `queuedFiles`.

The argument `queuedFiles` is an Array of filenames that have been queued to be cached.

```js
// ...

app.listen(3000, () => {
  const cache = new CachePugTemplates({ app });
  cache.start();
});
```

Note that with Koa you'll need to pass the `views` argument as well:

```js
// ...

const views = path.join(__dirname, 'views');

app.listen(3000, () => {
  const cache = new CachePugTemplates({ app, views });
  cache.start();
});
```

By default this callback simply throws the `err` (if any).


## Debugging

If you want to check what the cache state is at anytime:

```js
const pug = require('pug');

// ...

// get everything:
console.log('pug.cache', pug.cache);

// just get the file names:
console.log('pug cached files', Object.keys(pug.cache));
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/

[pug]: https://pugjs.org

[lad]: https://lad.js.org

[koa]: http://koajs.com

[express]: https://expressjs.com/

[connect]: https://github.com/senchalabs/connect

[cabin]: https://cabinjs.com
