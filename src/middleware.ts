import { RequestHandler } from "express";

export class Middleware {
  constructor(public readonly handler: RequestHandler) {}
}
