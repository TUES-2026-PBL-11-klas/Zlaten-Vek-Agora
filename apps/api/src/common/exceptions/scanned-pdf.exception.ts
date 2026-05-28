import { AppException } from "./app.exception";

export class ScannedPdfException extends AppException {
  constructor() {
    super(
      "PDF appears to be scanned or image-based. Please paste the bill text instead.",
      422,
      "SCANNED_PDF",
    );
  }
}
