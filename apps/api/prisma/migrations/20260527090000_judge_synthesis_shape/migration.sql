-- Reshape judge_conclusions to match the M4 synthesis contract.
ALTER TABLE "judge_conclusions"
  DROP COLUMN "common_points",
  DROP COLUMN "compromises",
  DROP COLUMN "group_summaries",
  ADD COLUMN "common_ground" JSONB NOT NULL,
  ADD COLUMN "compromise" JSONB NOT NULL,
  ADD COLUMN "participant_shifts" JSONB NOT NULL,
  ADD COLUMN "closing_statement" TEXT NOT NULL;
