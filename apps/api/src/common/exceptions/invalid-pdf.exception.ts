import { AppException } from "./app.exception";

export class InvalidPdfException extends AppException {
  constructor(reason: string) {
    super(`Invalid PDF: ${reason}`, 400, "INVALID_PDF");
  }
}
