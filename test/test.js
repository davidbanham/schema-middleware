const assert = require('assert');
const schema = require('./schema/user');
const refparser = require('json-schema-ref-parser');
const Middleware = require('../index');
const express = require('express');
const doubleagent = require('doubleagent');
const bodyParser = require('body-parser');


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
  let routeSchemas = {};

  before(async () => {
    const old = process.cwd();
    process.chdir('./test/schema');
    const dereffed = await refparser.dereference(schema);
    process.chdir(old);

    routeSchemas = Middleware.parseLinks({}, schema);

    middleware = Middleware.createMiddleware(routeSchemas.POST['/users']);
  });

  it('should validate a valid body', (done) => {
    middleware({
      body: valid,
    }, null, done);
  });

  it('should reject an invalid body', (done) => {
    middleware({
      body: invalid,
    }, null, err => {
      assert(err.message === 'Missing required property: name');
      done();
    });
  });


  describe('mount', () => {
    let app;
    let doubleApp;

    beforeEach(() => {
      app = express();

      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json());

      doubleApp = doubleagent(app);

    });
    describe('no options', () => {
      beforeEach(() => {
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
      beforeEach(() => {
        Middleware.mount(app, routeSchemas, {markValidated: true});
      });

      it('should mark req a validated if asked', async () => {
        let marked = false;
        app.post('/users', (req, res, next) => {
          console.log('schemaValidated is', req.schemaValidated);
          marked = req.schemaValidated;
          res.send('ok');
        });
        await doubleApp.post('/users', valid);
        assert(marked);
      });
    });
  });

  describe('mountSchemas', () => {
    let app;
    let doubleApp;

    beforeEach(() => {
      app = express();

      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json());

      doubleApp = doubleagent(app);
    });

    describe('no options', () => {
      beforeEach(() => {
        Middleware.mountSchemas(app, [schema], {});
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
  });

  describe('parseLinks', () => {
    it('should keep existing routes intact', () => {
      const one = {
        links: [{
          method: 'PUT',
          href: '/foo',
          schema: 'hai'
        }]
      };

      const two = {
        links: [{
          method: 'PUT',
          href: '/bar',
          schema: 'there'
        }]
      };

      const merged = [one, two].reduce(Middleware.parseLinks, {});

      assert.deepEqual(merged, {
        PUT: {
          '/foo': 'hai',
          '/bar': 'there'
        }
      });
    });
  });
});
