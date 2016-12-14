const assert = require('assert');
const schema = require('./schema/user');
const refparser = require('json-schema-ref-parser');
const Middleware = require('../index');
const express = require('express');
const doubleagent = require('doubleagent');
const bodyParser = require('body-parser');

const app = express();
// FIXME this should be reloaded in a beforeEach to keep tests separate

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const doubleApp = doubleagent(app);

const valid = {
  id: '3640c173-5821-4112-b61c-77c8091c8346',
  name: 'Jim',
  email: 'jim@example.com'
};

const invalid = {
  email: 'jim@example.com'
};

describe('middleware', () => {
  let middleware;
  const routeSchemas = {};

  before(async () => {
    const old = process.cwd();
    process.chdir('./test/schema');
    const dereffed = await refparser.dereference(schema);
    process.chdir(old);

    for (link of schema.links) {
      if (!link.schema) continue;
      routeSchemas[link.method] ? null : routeSchemas[link.method] = {};
      routeSchemas[link.method][link.expressRoute || link.href] = link.schema;
    };

    middleware = Middleware.middleware(routeSchemas);
  });

  it('should validate a valid body', (done) => {
    middleware({
      body: valid,
      path: '/users',
      method: 'POST',
      baseUrl: '/users',
      route: {
        path: ''
      }
    }, null, done);
  });

  it('should reject an invalid body', (done) => {
    middleware({
      body: invalid,
      path: '/users',
      method: 'POST',
      baseUrl: '/users',
      route: {
        path: ''
      }
    }, null, err => {
      assert(err.message === 'Missing required property: name');
      done();
    });
  });

  it('should fail gracefully on an unschemaed route', (done) => {
    middleware({
      body: valid,
      path: '/nope',
      method: 'POST',
      baseUrl: '/nope',
      route: {
        path: ''
      }
    }, null, err => {
      assert(err.message === 'Route has no schema');
      done();
    });
  });

  it('should handle interpolated routes', (done) => {
    middleware({
      body: valid,
      path: '/users/3640c173-5821-4112-b61c-77c8091c8346',
      method: 'PUT',
      baseUrl: '/users/',
      route: {
        path: ':id'
      }
    }, null, done);
  });

  describe('mount', () => {
    before(() => {
      Middleware.mount(app, routeSchemas);
    });

    it('should ignore GETs', () => {
      return doubleApp.get('/users');
    });

    it('should validate a valid body', () => {
      return doubleApp.post('/users', valid);
    });

    it('should reject an invalid body', async () => {
      let thrown = false;

      const res = await doubleApp.post('/users', invalid);

      assert(res.status === 500);
      assert(res.text.indexOf('ValidationError') > -1);
    });
  });

  describe('markValidated', () => {
    before(() => {
      Middleware.mount(app, routeSchemas, {markValidated: true});
    });

    it('should mark req a validated if asked', async () => {
      app.post('/users', (req, res, next) => {
        assert(req.schemaValidated);
        res.send('ok');
      });
      await doubleApp.post('/users', valid);
    });
  });
});
