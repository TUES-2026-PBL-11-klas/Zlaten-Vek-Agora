export interface ParticipantShift {
  personaId: string;
  openedQuote: string;
  closedQuote: string;
  shiftPercent: number;
}

export interface JudgeSummaryEntity {
  id: string;
  debateId: string;
  contradictions: string[];
  commonGround: string[];
  compromise: string[];
  participantShifts: ParticipantShift[];
  closingStatement: string;
  createdAt: Date;
}
