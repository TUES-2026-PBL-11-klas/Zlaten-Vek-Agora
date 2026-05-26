import { AppException } from "./app.exception";

export class DebateNotFoundException extends AppException {
  constructor(debateId: string) {
    super(`Debate '${debateId}' not found`, 404, "DEBATE_NOT_FOUND");
  }
}
