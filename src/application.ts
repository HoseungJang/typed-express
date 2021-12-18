import * as express from "express";

import { Switch } from ".";

export class Application {
  private app: express.Application;

  constructor(routeSwitch: Switch, initializer?: (app: express.Application) => void) {
    this.app = express();
    initializer?.(this.app);
    this.app.use("/", routeSwitch.router);
  }

  public get(): express.Application {
    return this.app;
  }
}
