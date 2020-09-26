import { FiveNoRouter } from '../typings/app'

import SchemaValidator from '@5no/schema'
import { setLanguage, translate, initDefault, getTranslateDatabases, currentLanguage, defaultLanguage } from '@5no/i18n'
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

// responseHandler
const responseHandler = (req: Request, res: Response, next: NextFunction) => {
  res.header('Content-Type', 'application/json')
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Language')
  res.header('Vary', 'Origin')

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

// i18nHandler
const i18nHandler = (req: Request, res: Response, next: NextFunction) => {
  req.i18n = {
    __: translate,
    initDefault: initDefault,
    setLanguage: setLanguage,
    getTranslateDatabases: getTranslateDatabases,
    currentLanguage: currentLanguage,
    defaultLanguage: defaultLanguage,
  }

  const lang = req.headers?.language || null

  if (lang) {
    req.i18n.setLanguage(lang)
  } else {
    req.i18n.initDefault()
  }

  req.i18n.currentLanguage = currentLanguage

  next()
}

// schemaHandler
const schemaHandler = async(req: Request, res: Response, next: NextFunction) => {
  if (!req.action.schema) {
    return next()
  }

  try {
    req.action.data = await req.action.schema.filter(req.action.data)
    await req.action.schema.validate(req.action.data)
    next()
  } catch (errors) {
    let typeOfErrors = null
    if (typeof errors === 'object' && errors !== null) {
      typeOfErrors = errors.constructor.name.toLowerCase()
    }
    if (typeOfErrors === 'error') {
      console.error(errors)
      res.action.serverError(errors.toString())
    } else {
      res.action.failed(errors)
    }
  }
}

// errorHandler
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  res.action.serverError(err.message)
  next(err)
}

// headerHandler
const headerHandler = (action: FiveNoRouter.Action) => (req: Request, res: Response, next: NextFunction) => {
  if (action.headers) {
    for (const headerName of Object.keys(action.headers)) {
      res.header(headerName, action.headers[headerName])
    }
  }

  next()
}

// methodNotAllowedHandler
const methodNotAllowedHandler = (allowMethods: Array<FiveNoRouter.ActionMethods | 'OPTIONS'>) => (req: Request, res: Response) => {
  res.header('Allow', allowMethods.join(', '))
  res.header('Access-Control-Allow-Methods', allowMethods.join(', '))
  res.header('Vary', 'Origin')

  res.action.methodNotAllowed(`${req.method} Is Not Allowed`)
}

// optionsHandler
const optionsHandler = (path: string, allowMethods: Array<FiveNoRouter.ActionMethods | 'OPTIONS'>, options: Array<FiveNoRouter.Action>) => (req: Request, res: Response) => {
  res.header('Allow', allowMethods.join(', '))
  res.header('Access-Control-Allow-Methods', allowMethods.join(', '))
  res.header('Vary', 'Origin')

  const method = req.headers['access-control-request-method'] || null
  const reponse = []

  for (const action of options.filter(x => x.method === method || !method)) {
    reponse.push({
      path: `${path}${(action.path !== '/' ? action.path : '')}`,
      method: action.method,
      schema: action.schema ? action.schema.json() : null,
    })
  }

  res.action.success(reponse)
}

const add = (router: Router, action: FiveNoRouter.Action) => {
  const handlerData = [requestHandler(action), headerHandler(action), i18nHandler, schemaHandler, action.handler]
  switch (action.method.toUpperCase()) {
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

  const actions: Array<FiveNoRouter.Action> = []
  for (const controllerAction of controller.actions) {
    const controllerSchema = controllerAction.schema || null
    let schema = null

    if (controllerSchema) {
      schema = new SchemaValidator(controllerSchema)
    }

    const actionData = { ...controllerAction, schema: schema, data: {} }

    actions.push(actionData)

    add(router, actionData)
  }

  const allowMethods = ['OPTIONS'] as Array<FiveNoRouter.ActionMethods | 'OPTIONS'>

  const actionsGroup = actions.reduce((acc, item) => {
    if (!acc[item.path]) {
      acc[item.path] = []
    }
    acc[item.path].push(item)

    if (allowMethods.indexOf(item.method) === -1) {
      allowMethods.push(item.method)
    }

    return acc
  }, {} as FiveNoRouter.ActionsGroupByPath)

  for (const path of Object.keys(actionsGroup)) {
    router.options(path, optionsHandler(controller.path, allowMethods, actionsGroup[path]))
  }

  router.options('*', optionsHandler(controller.path, allowMethods, actions))
  router.all('*', methodNotAllowedHandler(allowMethods))

  app.use(controller.path,
    responseHandler,
    bodyParser.json({ limit: controller?.limit ?? '10mb' }),
    bodyParser.urlencoded({ limit: controller?.limit ?? '10mb', extended: true }),
    router,
    errorHandler,
  )

  return app
}
