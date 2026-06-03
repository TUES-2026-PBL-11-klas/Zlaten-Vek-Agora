export interface AffectedGroupDto {
  id: string;
  name: string;
  personName: string;
  estimatedPopulation: string;
  demographics: string;
  interests: string[];
  fears: string[];
  priorities: string[];
  stance: string;
  stanceReason: string;
}

export interface AnalysisResultDto {
  affectedGroups: AffectedGroupDto[];
  keyChanges: string[];
  contentiousPoints: string[];
}

export interface PersonaDraftDto {
  id: string;
  name: string;
  role: string;
  demographic: string;
  interests: string[];
  fears: string[];
  priorities: string[];
  color: string;
  avatarUrl: string | null;
}
