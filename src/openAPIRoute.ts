import { OpenAPIV3_1 } from "openapi-types";

import { ResponseBody, OASBuilder, HTTPRequest, Switch, Route } from ".";

export class OpenAPIRoute {
  public readonly spec: ReturnType<OASBuilder["build"]>;

  constructor(
    public readonly path: string,
    info: OpenAPIV3_1.InfoObject,
    routeSwitch: Switch,
    responseSchemas: Record<string, ResponseBody>
  ) {
    this.spec = new OASBuilder(info, this.getHTTPRequestSchemas("/", routeSwitch), responseSchemas).build();
  }

  private getHTTPRequestSchemas(baseURL: string, routeSwitch: Switch): HTTPRequest<any, any, any>[] {
    const schemas: HTTPRequest<any, any, any>[] = [];
    routeSwitch.children.forEach((child) => {
      if (child instanceof Switch) {
        const result = this.getHTTPRequestSchemas(this.reolveBaseURL(baseURL, child.baseURL), child);
        result.forEach((r) => schemas.push(r));
      } else if (child instanceof Route) {
        schemas.push({
          ...child.requestSchema,
          path: this.reolveBaseURL(baseURL, child.requestSchema.path),
        });
      }
    });
    return schemas;
  }

  private reolveBaseURL(...urls: string[]): string {
    return urls.filter((url) => url !== "/").join("");
  }
}
