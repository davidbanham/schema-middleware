const assert = require('assert');
const schema = require('./schema/user');
const refparser = require('json-schema-ref-parser');
const Middleware = require('../index');

describe('middleware', () => {
  let middleware;

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
    const body = {
      name: 'Jim',
      email: 'jim@example.com'
    };

    middleware({
      body,
      path: '/users',
      method: 'POST',
    }, null, done);
  });

  it('should reject an invalid body', (done) => {
    const body = {
      email: 'jim@example.com'
    };

    middleware({
      body,
      path: '/users',
      method: 'POST',
    }, null, err => {
      assert(err.message === 'Missing required property: name');
      done();
    });
  });
});
