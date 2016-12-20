# Schema Middleware
This module takes a JSON Hyper-Schema and mounts into an express app to ensure that all incoming data is valid against the schema.

## Example

```javascript
const schemaMiddleware = require('schema-middleware');
const app = require('express')();
const refparser = require('json-schema-ref-parser');
const bodyParser = require('body-parser');
const schema = require('./schema/user');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

schemaMiddleware.mountSchemas(app, [schema]);
```

mountSchemas traverses the `.links` property of the schema. For every method and route with a schema it finds, it mounts a middleware that checks the incoming body or query against the schema.

If an invalid input is provided, it calls `next()` with the validation error.

## API

```
schemaMiddleware.mountSchemas(app, [schemas...], options)
```

Options are:

```
{
  markValidated: true
}
```

markValidated mounts another middleware that sets `req.schemaValidated` to true. This can be used to ensure that all routes are schema protected with something along the lines of:

```
if (!req.schemaValidated) throw new Error('Oh no we missed a route in our schema!');
```
