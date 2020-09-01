# <a href='https://5no.io'><img src='https://5no.io/img/5no-small-logo.png' height='100' alt='5no Logo' aria-label='5no.io' /></a>Router

Express router with schema

[@5no/schema](https://www.npmjs.com/package/@5no/schema)

## Install

@5no/router requires Node version 8 or above.

```sh
npm install --save @5no/router
```

## Examples

```js

import Router from '@5no/router'

const schema = {
  id: {
    type: Number,
    defaultValue: null,
    required: true,
  },
}

app.use(Router({
  path: '/test',
  actions: [
    {
      path: '/:id',
      method: 'GET',
      schema: schema,
      handler: (req, res) => res.action.success(req.action.data.id),
    },
  ],
}))

/**
 * 
 *  url: /test
 *  method: OPTIONS
 *  response: 
 * 
 {
    "status": 200,
    "success": true,
    "message": [
        {
            "path": "/test/:id",
            "method": "GET",
            "schema": {
                "id": {
                    "type": "number",
                    "required": true,
                    "defaultValue": null
                }
            }
        }
    ]
}
 *   
 *   
 * 
 * /

/**
 * 
 *  url: /test/123
 *  method: GET
 *  response: 
 * 
 {
    "status": 200,
    "success": true,
    "message": 123
 }
 *   
 *   
 * 
 * /


```

## License

MIT Licensed, Copyright (c) 2020 Aleksandr Sokol