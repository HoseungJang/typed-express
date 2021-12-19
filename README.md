# typed-express
[![npm version](https://badge.fury.io/js/typed-express.svg)](https://badge.fury.io/js/typed-express)
[![npm download](https://badgen.net/npm/dt/typed-express)](https://badgen.net/npm/dt/typed-express)

Make express.js fully-typed and serve automatically generated OpenAPI Specification object.

![](/docs/path-params.png)
![](/docs/query-params.png)
![](/docs/request-body.png)
![](/docs/response-body.png)

## Features
- [Create Routes](#create-routes)
- [Fully-Typed Request Parameters And Response Body](#fully-typed-request-parameters-and-response-body)
- [Request Parameters Validation](#request-parameters-validation)
- [OpenAPI Route](#openapi-route)

## Create Routes
- use ```Switch``` and ```Route``` to create routes.
- use ```Parameter``` and ```Schema``` to define request parameter / response body schema.
- if you need, you can pass middlewares.

```typescript
export const PostRouter = new Switch("/posts", [
  Route.GET(
    "/{id}",
    "getPost",
    {
      id: Parameter.Path(Schema.String()),
    },
    Schema.Object({
      id: Schema.String(),
      title: Schema.String(),
      content: Schema.String(),
    }),
    async (req, res) => {
      /* ... */
    },
    { middlewares: [/* ... */] } // This is optional
  )
]);
```

## Fully-Typed Request Parameters And Response Body
request parameters and response body type are fully-typed.

## Request Parameters Validation
typed-express automatically validates request parameters.

for example, assume that you define router below,

```typescript
new Switch("/users", [
  Route.GET(
    "/{id}",
    "getUser",
    {
      id: Parameter.Path(Schema.Number()),
    },
    Schema.Object({
      id: Schema.String(),
      name: Schema.String(),
    }),
    async (req, res) => {
      /* ... */
    },
  ),
]);
```

and then you create an invalid request like ```GET /users/asdf```, you'll get 400 response with error message(s).

```
parameter [id]: should be number
```

## OpenAPI Route
you can create OpenAPI Specification and serve it by using ```OpenAPIRoute```.

```typescript
const AllRouter = new Switch("/", [
  PostRouter,
  CategoryRouter,
]);

const OpenAPI = new OpenAPIRoute(
  "/openapi",
  {
    title: "hoseungJangBlogAPI",
    version: "1.0.0",
  },
  AllRouter,
  Entities
);

export const RootRouter = new Switch("/", [
  OpenAPI,
  AllRouter,
]);
```

if user requests to ```/openapi``` in the code above, OpenAPIRoute returns automatically generated OpenAPI Specification object.
