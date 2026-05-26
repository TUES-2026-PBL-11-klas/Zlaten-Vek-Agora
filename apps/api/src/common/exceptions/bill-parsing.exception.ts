import { AppException } from "./app.exception";

export class BillParsingException extends AppException {
  constructor(reason: string) {
    super(`Bill parsing failed: ${reason}`, 422, "BILL_PARSING_FAILED");
  }
}
