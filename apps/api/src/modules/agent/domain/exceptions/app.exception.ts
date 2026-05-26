export class AppException extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 500,
    readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
