import { Request, Response } from 'express'
import { translate, setLanguage, initDefault, getTranslateDatabases, currentLanguage, defaultLanguage } from '@5no/i18n'

import Router from '../lib/index'
import * as App from './app'

export * from './app'

declare module 'express-serve-static-core' {
  interface Request {
    action: App.FiveNoRouter.Action;
    i18n: {
      __: typeof translate;
      setLanguage: typeof setLanguage;
      initDefault: typeof initDefault;
      getTranslateDatabases: typeof getTranslateDatabases;
      currentLanguage: typeof currentLanguage;
      defaultLanguage: typeof defaultLanguage;
    };
  }

  interface Response {
    action: {
      send: (status: number, success: boolean, message: any) => void;
      success: (message: any) => void;
      created: (message: any) => void;
      accepted: (message: any) => void;
      methodNotAllowed: (message: any) => void;
      failed: (message: any) => void;
      notFound: (message: any) => void;
      unauthorized: (message: any) => void;
      forbidden: (message: any) => void;
      serverError: (message: any) => void;
      tooManyRequests: (message: any) => void;
    };
  }
}

export default Router
