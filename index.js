const tv4 = require('tv4');

const SCHEMA_MISSING = new Error('Route has no schema');

const METHODS = ['PUT', 'PATCH', 'POST'];

module.exports = (routeSchemas) => {
 return (req, res, next) => {
   if (METHODS.indexOf(req.method) < 0) return next();

   if (!routeSchemas[req.method]) return next(SCHEMA_MISSING);

   const path = req.baseUrl + req.route.path;

   const target = routeSchemas[req.method][path];

   if (!target) return next(SCHEMA_MISSING);

   const valid = tv4.validate(req.body, target);
   return valid ? next() : next(tv4.error);
 };
};
