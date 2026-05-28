import { HttpStatus } from "@nestjs/common";
import { AppException } from "../../shared/exceptions";

export class DebateNotStartableException extends AppException {
  constructor(debateId: string, currentStatus: string) {
    super(
      `Debate '${debateId}' cannot be started (current status: ${currentStatus})`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
