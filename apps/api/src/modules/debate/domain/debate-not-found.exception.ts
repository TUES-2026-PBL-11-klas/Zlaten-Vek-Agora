import { HttpStatus } from "@nestjs/common";
import { AppException } from "../../../shared/exceptions";

export class DebateNotFoundException extends AppException {
  constructor(id: string) {
    super(`Debate ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
