const tv4 = require('tv4');

exports.createMiddleware = (schema) => (req, res, next) => {
  const payload = (req.method === 'GET') ? req.query : req.body;
  return tv4.validate(payload, schema) ? next() : next(tv4.error);
}

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

exports.parseLinks = (routeSchemas, schema) => {
  for (link of schema.links) {
    if (!link.schema) continue;
    routeSchemas[link.method] ? null : routeSchemas[link.method] = {};
    routeSchemas[link.method][link.expressRoute || link.href] = link.schema;
  };
  return routeSchemas;
};

exports.mountSchemas = (app, schemas, options) => {
  const routeSchemas = schemas.reduce(exports.parseLinks, {});
  exports.mount(app, routeSchemas, options);
};
