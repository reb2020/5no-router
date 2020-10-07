import { Request as ExpressRequest, Response as ExpressResponse } from 'express'
import Schema, { FiveNoSchema } from '@5no/schema'
import { translate, setLanguage, initDefault, getTranslateDatabases, currentLanguage, defaultLanguage } from '@5no/i18n'

export namespace FiveNoRouter {
  type ActionMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

  interface ResponseData {
    status: number;
    success: boolean;
    message: any;
  }

  interface ActionsGroupByPath {
    [path: string]: Array<Action>;
  }

  interface Action<T = any> {
    path: string;
    method: ActionMethods;
    handler: (req: any, res: any) => void;
    schema: Schema | null;
    data: T;
    headers?: {
      [name: string]: string;
    };
  }

  interface ControllerAction {
    path: string;
    method: ActionMethods;
    handler: (req: any, res: any) => void;
    schema?: FiveNoSchema.FieldsSchema | null;
    headers?: {
      [name: string]: string;
    };
  }

  interface Controller {
    path: string;
    limit?: string;
    actions: Array<ControllerAction>;
  }
}

export interface Request<T = any> extends ExpressRequest {
  action: FiveNoRouter.Action<T>;
  i18n: {
    __: typeof translate;
    setLanguage: typeof setLanguage;
    initDefault: typeof initDefault;
    getTranslateDatabases: typeof getTranslateDatabases;
    currentLanguage: typeof currentLanguage;
    defaultLanguage: typeof defaultLanguage;
  };
}

export interface Response extends ExpressResponse {
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
