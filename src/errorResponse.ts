export class ErrorResponse {
  constructor(public readonly statusCode: number, public readonly message: string | string[]) {}
}
