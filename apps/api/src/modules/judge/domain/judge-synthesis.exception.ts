import { HttpStatus } from "@nestjs/common";
import { AppException } from "../../../shared/exceptions";

export class JudgeSynthesisException extends AppException {
  constructor(reason: string) {
    super(`Judge synthesis failed: ${reason}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
