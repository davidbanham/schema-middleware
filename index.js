const tv4 = require('tv4');

const SCHEMA_MISSING = new Error('Route has no schema');

exports.middleware = (routeSchemas) => {
  return (req, res, next) => {
    if (!routeSchemas[req.method]) return next(SCHEMA_MISSING);

    const path = req.baseUrl + req.route.path;

    const target = routeSchemas[req.method][path];

    if (!target) return next(SCHEMA_MISSING);

    return exports.single(target)(req, res, next);
  };
};

exports.single = (schema) => (req, res, next) =>
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
      const mw = exports.single(schema);
      app[method.toLowerCase()](route, mw);
      if (options && options.markValidated) {
        app[method.toLowerCase()](route, exports.markValidated);
      };
    });
  });
};
