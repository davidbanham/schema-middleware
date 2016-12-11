const assert = require('assert');
const schema = require('./schema/user');
const refparser = require('json-schema-ref-parser');
const Middleware = require('../index');

describe('middleware', () => {
  let middleware;

  const valid = {
    id: '3640c173-5821-4112-b61c-77c8091c8346',
    name: 'Jim',
    email: 'jim@example.com'
  };

  const invalid = {
    email: 'jim@example.com'
  };

  before(async () => {
    const routeSchemas = {};
    const old = process.cwd();
    process.chdir('./test/schema');
    const dereffed = await refparser.dereference(schema);
    process.chdir(old);

    for (link of schema.links) {
      if (!link.schema) continue;
      routeSchemas[link.method] ? null : routeSchemas[link.method] = {};
      routeSchemas[link.method][link.expressRoute || link.href] = link.schema;
    };

    middleware = require('../index')(routeSchemas);
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

  it('should ignore GETs', (done) => {
    middleware({
      path: '/users',
      method: 'GET',
      baseUrl: '/users',
      route: {
        path: ''
      }
    }, null, done);
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
});
