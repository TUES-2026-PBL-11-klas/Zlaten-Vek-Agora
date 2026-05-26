-- CreateEnum
CREATE TYPE "Emotion" AS ENUM ('calm', 'confident', 'pensive', 'anxious', 'tense');

-- AlterTable
ALTER TABLE "debate_messages" ADD COLUMN "emotion" "Emotion" NOT NULL DEFAULT 'calm';

-- CreateIndex
CREATE INDEX "debate_messages_round_id_sequence_idx" ON "debate_messages"("round_id", "sequence");
