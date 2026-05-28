import type { AnalysisResultDto } from "@agora/shared";
import { AnalysisResultEntity } from "./domain/analysis-result.entity";

export function toAnalysisResultDto(analysis: AnalysisResultEntity): AnalysisResultDto {
  return {
    affectedGroups: analysis.affectedGroups,
    keyChanges: analysis.keyChanges,
    contentiousPoints: analysis.contentiousPoints,
  };
}
