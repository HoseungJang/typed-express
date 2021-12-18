import { Router } from "express";

import { Route } from "./route";
import { Middleware } from "./middleware";
import { ErrorHandler } from "./errorHandler";
import { OpenAPIRoute } from "./openAPIRoute";

export class Switch {
  public readonly router: Router = Router();

  constructor(
    public readonly baseURL: string,
    public readonly children: (Switch | Route | Middleware | ErrorHandler | OpenAPIRoute)[]
  ) {
    const router = Router();
    children.forEach((child) => {
      if (child instanceof Switch) {
        router.use(child.router);
      } else if (child instanceof Route) {
        router[child.requestSchema.method](
          child.requestSchema.path.replace(/\{([\S][^}]+)\}/g, ":$1"),
          ...child.middlewares.map(({ handler }) => handler),
          child.handler
        );
      } else if (child instanceof Middleware || child instanceof ErrorHandler) {
        router.use(child.handler);
      } else if (child instanceof OpenAPIRoute) {
        router.use(child.path, (_, res) => {
          return res.status(200).json(child.spec);
        });
      }
    });
    this.router.use(baseURL, router);
  }
}
