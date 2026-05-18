import { HttpException } from "@nestjs/common";

export abstract class AppException extends HttpException {
  protected constructor(message: string, status: number) {
    super({ statusCode: status, message, error: new.target.name }, status);
    this.name = new.target.name;
  }
}
