const tv4 = require('tv4');

const SCHEMA_MISSING = new Error('Route has no schema');

module.exports = (routeSchemas) => {
 return (req, res, next) => {
   if (!routeSchemas[req.method]) return next(SCHEMA_MISSING);

   const target = routeSchemas[req.method][req.path];

   if (!target) return next(SCHEMA_MISSING);

   const valid = tv4.validate(req.body, target);
   return valid ? next() : next(tv4.error);
 };
};
