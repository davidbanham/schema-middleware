const tv4 = require('tv4');

const SCHEMA_MISSING = new Error('Route has no schema');

exports.createMiddleware = (schema) => (req, res, next) =>
    tv4.validate(req.body, schema) ? next() : next(tv4.error);

exports.markValidated = (req, res, next) => {
  req.schemaValidated = true;
  next();
};

exports.mount = (app, routeSchemas, options) => {
  Object.keys(routeSchemas).forEach(method => {
    const v = routeSchemas[method];
    Object.keys(v).forEach(route => {
      const schema = v[route];
      const mw = exports.createMiddleware(schema);
      app[method.toLowerCase()](route, mw);
      if (options && options.markValidated) {
        app[method.toLowerCase()](route, exports.markValidated);
      };
    });
  });
};

exports.parseLinks = (schema) => {
  const routeSchemas = {};
  for (link of schema.links) {
    if (!link.schema) continue;
    routeSchemas[link.method] ? null : routeSchemas[link.method] = {};
    routeSchemas[link.method][link.expressRoute || link.href] = link.schema;
  };
  return routeSchemas;
};
