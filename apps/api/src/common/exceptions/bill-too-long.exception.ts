import { AppException } from "./app.exception";

export class BillTooLongException extends AppException {
  constructor(charCount: number) {
    super(
      `Bill text exceeds the 200,000 character limit (${charCount} chars)`,
      413,
      "BILL_TOO_LONG",
    );
  }
}
