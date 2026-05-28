import { HttpStatus } from "@nestjs/common";
import { AppException } from "../../../shared/exceptions";

export class JudgeNotReadyException extends AppException {
  constructor(debateId: string, completedRounds: number) {
    super(
      `Debate ${debateId} is not ready for synthesis (completed ${completedRounds} of 3 rounds)`,
      HttpStatus.CONFLICT,
    );
  }
}
