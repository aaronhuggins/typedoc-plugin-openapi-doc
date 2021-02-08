# typedoc-plugin-openapi-doc

A typedoc plugin for ingesting jsdoc @swagger or @openapi comments as documentation.

# Installation and use

Install via npm; requires a peer of TypeDoc 0.20.20 or above.

```shell
npm install --save-dev typedoc typedoc-plugin-openapi-doc
```

# TypeDoc options

The following options may be defined in a typedoc config. However, all of the options default to true and it is not required that they are provided.

```json
  "openapi-doc": {
    "hoistDescription": true,
    "yaml2Html": false,
    "renameTag": "MyNewTagName"
  }
```

# Why

The rendering of `@swagger` JSDoc tags was ugly to the point of being useless in TypeDoc, which meant ignoring these tags. Additionally, such a comment tag often included additional information that would have to be repeated when writing description documentation for TypeDoc to consume.

The result is this plugin, to reduce copypasta of descriptive information and to render OpenAPI metadata in a more human-readable way.

# Other tools which ingest @swagger/@openapi comments

- [Project to OpenAPI](https://github.com/ahuggins-nhs/project-to-openapi) uses `@swagger` comments.
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc) uses `@swagger` for its notation.
- [OpenAPI JSDoc](https://github.com/asznee7/openapi-jsdoc) uses `@openapi`.

# Code documentation

Found [here](https://ahuggins-nhs.github.io/typedoc-plugin-openapi-doc/).