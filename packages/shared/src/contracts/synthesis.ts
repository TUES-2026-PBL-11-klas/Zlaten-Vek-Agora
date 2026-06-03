export interface ParticipantShiftDto {
  personaId: string;
  personaName: string;
  personaDemographic: string;
  personaColor: string;
  openedQuote: string;
  closedQuote: string;
  shiftPercent: number;
}

export interface SynthesisDto {
  debateId: string;
  title: string;
  createdAt: string;
  contradictions: string[];
  commonGround: string[];
  compromise: string[];
  participantShifts: ParticipantShiftDto[];
  closingStatement: string;
  failed: boolean;
}
