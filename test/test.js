const path = require('path');
const test = require('ava');
const Koa = require('koa');
const express = require('express');
const redis = require('redis');

const cachePugTemplates = require('../');

test.cb('email-templates', t => {
  const redisClient = redis.createClient();
  const views = path.join(__dirname, 'fixtures', 'views');
  cachePugTemplates(redisClient, views, (err, cached) => {
    t.ifError(err);
    t.is(cached.length, 3);
    t.end();
  });
});

test.cb('koa', t => {
  const app = new Koa();
  const redisClient = redis.createClient();

  // optional (e.g. if you want to cache in non-production)
  // app.cache = true;

  const views = path.join(__dirname, 'fixtures', 'views');

  app.listen(() => {
    cachePugTemplates(app, redisClient, views, (err, cached) => {
      t.ifError(err);
      t.is(cached.length, 3);
      t.end();
    });
  });
});

test.cb('express', t => {
  const app = express();
  const redisClient = redis.createClient();
  app.set('views', path.join(__dirname, 'fixtures', 'views'));
  app.set('view engine', 'pug');
  app.listen(() => {
    cachePugTemplates(app, redisClient, (err, cached) => {
      t.ifError(err);
      t.is(cached.length, 3);
      t.end();
    });
  });
});

test.cb('throws on unsupported view engine', t => {
  const app = express();
  const redisClient = redis.createClient();
  app.set('views', path.join(__dirname, 'fixtures', 'views'));
  app.set('view engine', 'ejs');
  app.set('view cache', true);
  app.listen(() => {
    const error = t.throws(() => {
      cachePugTemplates(app, redisClient, err => {
        throw err;
      });
    });

    t.is(error.message, `view engine was "ejs" and needs to be set to "pug"`);
    t.end();
  });
});
