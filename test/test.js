const path = require('path');
const test = require('ava');
const Koa = require('koa');
const express = require('express');

const preCachePugViews = require('../');

test.cb('koa', t => {
  const app = new Koa();

  // optional (e.g. if you want to cache in non-production)
  // app.context.state.cache = true;

  const views = path.join(__dirname, 'fixtures', 'views');

  app.listen(preCachePugViews(app, views, t.end));
});

test.cb('express', t => {
  const app = express();
  app.set('views', path.join(__dirname, 'fixtures', 'views'));
  app.set('view engine', 'pug');
  app.listen(preCachePugViews(app, t.end));
});
