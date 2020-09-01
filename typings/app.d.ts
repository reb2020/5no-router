import Schema, { FiveNoSchema } from '@5no/schema'

export namespace FiveNoRouter {
  type ActionMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

  interface ResponseData {
    status: number;
    success: boolean;
    message: any;
  }

  interface Options {
    [method: string]: Array<Action>;
  }

  interface Action {
    path: string;
    method: ActionMethods;
    handler: (req: any, res: any) => void;
    schema: Schema | null;
    data: object;
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
    actions: Array<ControllerAction>;
  }
}
