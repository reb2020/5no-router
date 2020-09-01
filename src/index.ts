import { FiveNoRouter } from '../typings/app'

import SchemaValidator from '@5no/schema'
import express, { Request, Response, NextFunction, Router } from 'express'
import bodyParser from 'body-parser'

// response / request
const response = ({ res, status = 200, success = true, message = {} }: {
  res: Response;
  status: number;
  success: boolean;
  message: any;
}) => res.status(status).send({
  status,
  success,
  message,
}).end()

const requestHandler = (action: FiveNoRouter.Action) => (req: Request, res: Response, next: NextFunction) => {
  const dataQuery = req?.query || {}
  const dataBody = req?.body || {}
  const dataParams = req?.params || {}
  req.action = { ...action, data: { ...dataBody, ...dataQuery, ...dataParams } }

  next()
}

const responseHandler = (req: Request, res: Response, next: NextFunction) => {
  res.action = {
    send: (status: number, success: boolean, message: any) => response({ res, status, success, message }),
    success: (message: any) => response({ res, status: 200, success: true, message }),
    created: (message: any) => response({ res, status: 201, success: true, message }),
    accepted: (message: any) => response({ res, status: 202, success: true, message }),
    failed: (message: any) => response({ res, status: 400, success: false, message }),
    methodNotAllowed: (message: any) => response({ res, status: 405, success: false, message }),
    notFound: (message: any) => response({ res, status: 404, success: false, message }),
    unauthorized: (message: any) => response({ res, status: 401, success: false, message }),
    forbidden: (message: any) => response({ res, status: 403, success: false, message }),
    serverError: (message: any) => response({ res, status: 500, success: false, message }),
    tooManyRequests: (message: any) => response({ res, status: 429, success: false, message }),
  }

  next()
}

// schema
const schema = async(req: Request, res: Response, next: NextFunction) => {
  if (!req.action.schema) {
    return next()
  }

  try {
    req.action.data = await req.action.schema.filter(req.action.data)
    await req.action.schema.validate(req.action.data)
    next()
  } catch (errors) {
    res.action.failed(errors)
  }
}

// headers
const header = (action: FiveNoRouter.Action) => (req: Request, res: Response, next: NextFunction) => {
  res.header('Content-Type', 'application/json')
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type')
  res.header('Vary', 'Origin')

  if (action.headers) {
    for (const headerName of Object.keys(action.headers)) {
      res.header(headerName, action.headers[headerName])
    }
  }

  next()
}

// method not allowed
const methodNotAllowed = (path: string, allowMethods: Array<FiveNoRouter.ActionMethods | 'OPTIONS'>) => (req: Request, res: Response) => {
  res.header('Content-Type', 'application/json')
  res.header('Allow', allowMethods.join(', '))
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type')
  res.header('Access-Control-Allow-Methods', allowMethods.join(', '))
  res.header('Vary', 'Origin')

  res.action.methodNotAllowed(`${req.method} Is Not Allowed`)
}

// options
const optionsHandler = (path: string, allowMethods: Array<FiveNoRouter.ActionMethods | 'OPTIONS'>, options: FiveNoRouter.Options) => (req: Request, res: Response) => {
  res.header('Content-Type', 'application/json')
  res.header('Allow', allowMethods.join(', '))
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type')
  res.header('Access-Control-Allow-Methods', allowMethods.join(', '))
  res.header('Vary', 'Origin')

  const reponse = []
  for (const method of Object.keys(options)) {
    for (const action of options[method]) {
      reponse.push({
        path: `${path}${(action.path !== '/' ? action.path : '')}`,
        method: action.method,
        schema: action.schema ? action.schema.json() : null,
      })
    }
  }

  res.action.success(reponse)
}

const add = (router: Router, action: FiveNoRouter.Action) => {
  const handlerData = [requestHandler(action), header(action), schema, action.handler]
  switch (action.method) {
    case 'GET':
      router.get(action.path, ...handlerData)
      break
    case 'POST':
      router.post(action.path, ...handlerData)
      break
    case 'PUT':
      router.put(action.path, ...handlerData)
      break
    case 'PATCH':
      router.patch(action.path, ...handlerData)
      break
    case 'DELETE':
      router.delete(action.path, ...handlerData)
      break
  }
}

export default (controller: FiveNoRouter.Controller): Router => {
  const router = express.Router()
  const app = express.Router()

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(responseHandler)

  const options: FiveNoRouter.Options = {}
  for (const controllerAction of controller.actions) {
    if (!options[controllerAction.method]) {
      options[controllerAction.method] = []
    }

    const controllerSchema = controllerAction.schema || null
    let schema = null

    if (controllerSchema) {
      schema = new SchemaValidator(controllerSchema)
    }

    const actionData = { ...controllerAction, schema: schema, data: {} }

    options[controllerAction.method].push(actionData)

    add(router, actionData)
  }

  const allowMethods = ['OPTIONS', ...Object.keys(options)] as Array<FiveNoRouter.ActionMethods | 'OPTIONS'>

  router.options('/', optionsHandler(controller.path, allowMethods, options))
  router.all('*', methodNotAllowed(controller.path, allowMethods))

  app.use(controller.path, router)

  return app
}
