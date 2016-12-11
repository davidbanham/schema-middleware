const tv4 = require('tv4');

module.exports = (routeSchemas) => {
 return (req, res, next) => {
   const target = routeSchemas[req.method][req.path];
   const valid = tv4.validate(req.body, target);
   return valid ? next() : next(tv4.error);
 };
};
