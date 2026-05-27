import { AppException } from "./app.exception";

export class AnalysisFailedException extends AppException {
  constructor(reason: string) {
    super(`Bill analysis failed: ${reason}`, 422, "ANALYSIS_FAILED");
  }
}
