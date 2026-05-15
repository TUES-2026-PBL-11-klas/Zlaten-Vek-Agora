/*
  Warning: Changed the type of `contradictions`, `common_points`, and `compromises` on the `judge_conclusions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
*/
-- AlterTable
ALTER TABLE "judge_conclusions" DROP COLUMN "contradictions",
ADD COLUMN     "contradictions" JSONB NOT NULL,
DROP COLUMN "common_points",
ADD COLUMN     "common_points" JSONB NOT NULL,
DROP COLUMN "compromises",
ADD COLUMN     "compromises" JSONB NOT NULL;
