export interface RoundEntity {
  id: string;
  debateId: string;
  roundNumber: number;
  phase: string;
  startedAt: Date;
  endedAt: Date | null;
}
