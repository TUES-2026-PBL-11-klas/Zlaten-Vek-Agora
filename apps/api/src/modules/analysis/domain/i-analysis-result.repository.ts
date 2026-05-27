import { AnalysisResultEntity } from "./analysis-result.entity";

export interface IAnalysisResultRepository {
  save(result: Omit<AnalysisResultEntity, "id" | "createdAt">): Promise<AnalysisResultEntity>;
  findByDebate(debateId: string): Promise<AnalysisResultEntity | null>;
  deleteByDebate(debateId: string): Promise<void>;
}

export const ANALYSIS_RESULT_REPOSITORY = Symbol("IAnalysisResultRepository");
