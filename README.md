# cache-pug-templates

[![build status](https://img.shields.io/travis/ladjs/cache-pug-templates.svg)](https://travis-ci.org/ladjs/cache-pug-templates)
[![code coverage](https://img.shields.io/codecov/c/github/ladjs/cache-pug-templates.svg)](https://codecov.io/gh/ladjs/cache-pug-templates)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/cache-pug-templates.svg)](<>)

> Cache [Pug][] templates for [Lad][]/[Koa][]/[Express][]/[Connect][] with [Redis][]


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Callback](#callback)
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

> Koa

```js
const cachePugTemplates = require('cache-pug-templates');
const Koa = require('koa');
const path = require('path');
const redis = require('redis');

const app = new Koa();
const redisClient = redis.createClient();

// optional (e.g. if you want to cache in non-production)
// app.context.state.cache = true;

// note that koa requires us to specify a
// path name for the views directory
const views = path.join(__dirname, 'views');

app.listen(3000, () => {
  cachePugTemplates(app, redisClient, views);
});
```

> Express

```js
const cachePugTemplates = require('cache-pug-templates');
const express = require('express');
const path = require('path');
const redis = require('redis');

const app = express();
const redisClient = redis.createClient();

// optional (by default express defaults to `./views`)
// app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'pug');

app.listen(3000, () => {
  cachePugTemplates(app, redisClient, views);
});
```


## Callback

You can also pass an optional callback function with arguments `err` and `cache`.

The argument `cached` is an Array of filenames that have been cached (from `Object.keys(pug.cache)`).

```js
// ...

app.listen(3000, () => {
  cachePugTemplates(app, redisClient, (err, cached) => {
    if (err) throw err;
    console.log(`successfully cached (${cached.length}) files`);
  });
});
```

Note that with Koa you'll need to pass the `views` argument as well:

```js
// ...

const views = path.join(__dirname, 'views');

app.listen(3000, () => {
  cachePugTemplates(app, redisClient, views, (err, cached) => {
    if (err) throw err;
    console.log(`successfully cached (${cached.length}) files`);
  });
});
```

By default this callback simply `console.error` the `err` (if any).


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

[redis]: https://redis.io/
