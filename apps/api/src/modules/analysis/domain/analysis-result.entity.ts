export type GroupStance = "Supportive" | "Opposed" | "Mixed";

export interface AffectedGroup {
  id: string;
  name: string;
  estimatedPopulation: string;
  demographics: string;
  interests: string[];
  fears: string[];
  priorities: string[];
  stance: GroupStance;
  stanceReason: string;
}

export interface AnalysisResultEntity {
  id: string;
  debateId: string;
  affectedGroups: AffectedGroup[];
  keyChanges: string[];
  contentiousPoints: string[];
  createdAt: Date;
}
