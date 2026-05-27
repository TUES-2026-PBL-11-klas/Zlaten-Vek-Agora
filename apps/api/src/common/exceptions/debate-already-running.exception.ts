import { HttpStatus } from "@nestjs/common";
import { AppException } from "../../shared/exceptions";

export class DebateAlreadyRunningException extends AppException {
  constructor(debateId: string) {
    super(`Debate '${debateId}' is already running`, HttpStatus.CONFLICT);
  }
}
