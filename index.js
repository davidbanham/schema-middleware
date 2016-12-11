const tv4 = require('tv4');

module.exports = (schema) => {
 return (req, res, next) => {
   const path = req.path;
   const target = schema.routeSchemas[path];
   const valid = tv4.validate(req.body, target;
   valid ? next() : tv4.error;
 };
};