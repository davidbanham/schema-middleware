const assert = require('assert');
const schema = require('./schema/user');
const refparser = require('json-schema-ref-parser');
const Middleware = require('../index');

describe('middleware', () => {
  let middleware;

  const valid = {
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
      routeSchemas[link.method][link.href] = link.schema;
    };

    middleware = require('../index')(routeSchemas);
  });

  it('should validate a valid body', (done) => {
    middleware({
      body: valid,
      path: '/users',
      method: 'POST',
    }, null, done);
  });

  it('should reject an invalid body', (done) => {
    middleware({
      body: invalid,
      path: '/users',
      method: 'POST',
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
    }, null, err => {
      assert(err.message === 'Route has no schema');
      done();
    });
  });
});
