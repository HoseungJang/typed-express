import { Request, Response, RequestHandler } from "express";
import { ExtractParametersFromPath } from "request-typer";

import {
  ErrorResponse,
  Middleware,
  HTTPRequest,
  Method,
  Parameters,
  ResponseBody,
  ResolvePathParameters,
  Resolve,
  ResolveRequestBody,
  ResolveQueryParameters,
  HTTP,
  AllSchema,
  Validator,
  ValidationResult,
} from ".";

type RouteHandler<P extends Parameters, R extends ResponseBody> = (
  req: Request<ResolvePathParameters<P>, Resolve<R>, ResolveRequestBody<P>, ResolveQueryParameters<P>>,
  res: Response<Resolve<R>>
) => Promise<any>;

interface RouteOpions {
  middlewares?: Middleware[];
}

function validateWithParse(schema: AllSchema, value: any) {
  const result = Validator.validate(schema, value);
  if (!result.success) {
    try {
      const parsed = JSON.parse(value);
      return { result: Validator.validate(schema, parsed), value: parsed };
    } catch (error) {}
  }
  return { result, value };
}

export class Route {
  public static GET<PA extends string, PR extends ExtractParametersFromPath<PA> & Parameters, R extends ResponseBody>(
    path: PA,
    operationId: string,
    parameters: PR,
    responseBody: R,
    handler: RouteHandler<PR, R>,
    options: RouteOpions = {}
  ): Route {
    return new this("get", path, operationId, parameters, responseBody, handler, options);
  }

  public static POST<PA extends string, PR extends ExtractParametersFromPath<PA> & Parameters, R extends ResponseBody>(
    path: PA,
    operationId: string,
    parameters: PR,
    responseBody: R,
    handler: RouteHandler<PR, R>,
    options: RouteOpions = {}
  ): Route {
    return new this("post", path, operationId, parameters, responseBody, handler, options);
  }

  public static PUT<PA extends string, PR extends ExtractParametersFromPath<PA> & Parameters, R extends ResponseBody>(
    path: PA,
    operationId: string,
    parameters: PR,
    responseBody: R,
    handler: RouteHandler<PR, R>,
    options: RouteOpions = {}
  ): Route {
    return new this("put", path, operationId, parameters, responseBody, handler, options);
  }

  public static PATCH<PA extends string, PR extends ExtractParametersFromPath<PA> & Parameters, R extends ResponseBody>(
    path: PA,
    operationId: string,
    parameters: PR,
    responseBody: R,
    handler: RouteHandler<PR, R>,
    options: RouteOpions = {}
  ): Route {
    return new this("patch", path, operationId, parameters, responseBody, handler, options);
  }

  public static DELETE<
    PA extends string,
    PR extends ExtractParametersFromPath<PA> & Parameters,
    R extends ResponseBody
  >(
    path: PA,
    operationId: string,
    parameters: PR,
    responseBody: R,
    handler: RouteHandler<PR, R>,
    options: RouteOpions = {}
  ): Route {
    return new this("delete", path, operationId, parameters, responseBody, handler, options);
  }

  public readonly requestSchema: HTTPRequest<Method, any, Parameters, ResponseBody>;
  public readonly middlewares: Middleware[];
  public readonly handler: RequestHandler;

  private constructor(
    method: Method,
    path: string,
    operationId: string,
    parameters: Parameters,
    responseBody: ResponseBody,
    handler: RouteHandler<any, any>,
    options: RouteOpions = {}
  ) {
    this.requestSchema = (() => {
      switch (method) {
        case "get": {
          return HTTP.GET(operationId, path, parameters, responseBody) as any;
        }
        case "post": {
          return HTTP.POST(operationId, path, parameters, responseBody) as any;
        }
        case "put": {
          return HTTP.PUT(operationId, path, parameters, responseBody) as any;
        }
        case "patch": {
          return HTTP.PATCH(operationId, path, parameters, responseBody) as any;
        }
        case "delete": {
          return HTTP.DELETE(operationId, path, parameters, responseBody) as any;
        }
      }
    })();
    this.middlewares = options.middlewares ?? [];
    this.handler = this.createHandler(this.requestSchema, handler);
  }

  private createHandler<
    M extends Method,
    PA extends string,
    PR extends ExtractParametersFromPath<PA> & Parameters,
    R extends ResponseBody
  >(requestSchema: HTTPRequest<M, PA, PR, R>, handler: RouteHandler<PR, R>): RequestHandler {
    const { parameters } = requestSchema;

    const routerHandler: RequestHandler = async (req, res, next) => {
      const errors: string[] = [];
      Object.keys(parameters).forEach((key) => {
        const parameterSchema = parameters[key];

        let result: ValidationResult;
        switch (parameterSchema.type) {
          case "query": {
            const validation = validateWithParse(parameterSchema.schema, req.query[key] as string | undefined);
            result = validation.result;
            req.query[key] = validation.value;
            break;
          }
          case "path": {
            const validation = validateWithParse(parameterSchema.schema, req.params[key] as string | undefined);
            result = validation.result;
            req.params[key] = validation.value;
            break;
          }
          case "body": {
            result = Validator.validate(parameterSchema.schema, req.body[key]);
            break;
          }
        }

        if (!result.success) {
          errors.push(`parameter ${key}: ${result.error.description}`);
        }
      });

      if (errors.length > 0) {
        return next(new ErrorResponse(400, errors));
      }

      try {
        return await handler(req as any, res as any);
      } catch (error) {
        return next(error);
      }
    };

    return routerHandler;
  }
}
