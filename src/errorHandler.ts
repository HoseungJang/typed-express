import { ErrorRequestHandler } from "express";

export class ErrorHandler {
  constructor(public readonly handler: ErrorRequestHandler) {}
}
