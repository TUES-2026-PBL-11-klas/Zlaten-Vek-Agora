export interface JudgeSummaryEntity {
  id: string;
  debateId: string;
  contradictions: string[];
  commonPoints: string[];
  compromises: string[];
  groupSummaries: Record<string, string>;
  createdAt: Date;
}
