import { JudgeSummaryEntity } from "./judge-summary.entity";

export interface IJudgeSummaryRepository {
  save(data: Omit<JudgeSummaryEntity, "id" | "createdAt">): Promise<JudgeSummaryEntity>;
  findByDebate(debateId: string): Promise<JudgeSummaryEntity | null>;
  deleteByDebate(debateId: string): Promise<void>;
}

export const JUDGE_SUMMARY_REPOSITORY = Symbol("IJudgeSummaryRepository");
