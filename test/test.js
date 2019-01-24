const path = require('path');
const test = require('ava');
const pug = require('pug');
const Koa = require('koa');
const express = require('express');

const CachePugTemplates = require('..');

test.cb('email-templates', t => {
  const views = path.join(__dirname, 'fixtures', 'views');
  const cache = new CachePugTemplates({
    views
  });
  cache.start(err => {
    t.falsy(err);
    setTimeout(() => {
      t.is(Object.keys(pug.cache).length, 3);
      t.end();
    }, 3000);
  });
});

test.cb('koa', t => {
  const app = new Koa();

  // optional (e.g. if you want to cache in non-production)
  // app.cache = true;

  const views = path.join(__dirname, 'fixtures', 'views');

  app.listen(() => {
    const cache = new CachePugTemplates({ app, views });
    cache.start(err => {
      t.falsy(err);
      setTimeout(() => {
        t.is(Object.keys(pug.cache).length, 3);
        t.end();
      }, 3000);
    });
  });
});

test.cb('express', t => {
  const app = express();
  app.set('views', path.join(__dirname, 'fixtures', 'views'));
  app.set('view engine', 'pug');
  app.listen(() => {
    const cache = new CachePugTemplates({ app });
    cache.start(err => {
      t.falsy(err);
      setTimeout(() => {
        t.is(Object.keys(pug.cache).length, 3);
        t.end();
      }, 3000);
    });
  });
});

test.cb('throws on unsupported view engine', t => {
  const app = express();
  app.set('views', path.join(__dirname, 'fixtures', 'views'));
  app.set('view engine', 'ejs');
  app.set('view cache', true);
  app.listen(() => {
    const error = t.throws(() => {
      const cache = new CachePugTemplates({ app });
      cache.start();
    });

    t.is(error.message, `view engine was "ejs" and needs to be set to "pug"`);
    t.end();
  });
});
