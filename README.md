# pre-cache-pug-views

[![Greenkeeper badge](https://badges.greenkeeper.io/ladjs/pre-cache-pug-views.svg)](https://greenkeeper.io/)

[![build status](https://img.shields.io/travis/ladjs/pre-cache-pug-views.svg)](https://travis-ci.org/ladjs/pre-cache-pug-views)
[![code coverage](https://img.shields.io/codecov/c/github/ladjs/pre-cache-pug-views.svg)](https://codecov.io/gh/ladjs/pre-cache-pug-views)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/pre-cache-pug-views.svg)](<>)

> Pre-cache [Pug][] templates/views for [Lad][], [Koa][], [Express][], and [Connect][]


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
npm install pre-cache-pug-views
```

[yarn][]:

```sh
yarn add pre-cache-pug-views
```


## Usage

> Koa

```js
const preCachePugViews = require('pre-cache-pug-views');
const Koa = require('koa');

const app = new Koa();

// optional (e.g. if you want to cache in non-production)
// app.context.state.cache = true;

// note that koa requires us to specify a
// path name for the views directory
const views = path.join(__dirname, 'views');

app.listen(3000, preCachePugViews(app, views));
```

> Express

```js
const preCachePugViews = require('pre-cache-pug-views');
const express = require('express');
const path = require('path');

const app = express();

// optional (by default express defaults to `./views`)
// app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'pug');

app.listen(3000, preCachePugViews(app));
```


## Callback

You can also pass an optional callback to override the existing `console.error`:

```js
// ...

app.listen(3000, preCachePugViews(app, err => {
  if (err) throw err;
  console.log('caching worked!');
});
```

Note that with Koa you'll need to pass the `views` argument as well:

```js
// ...

const views = path.join(__dirname, 'views');

app.listen(3000, preCachePugViews(app, views, err => {
  if (err) throw err;
  console.log('caching worked!');
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
