-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bill_text" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "debate_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "demographic" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "fears" TEXT NOT NULL,
    "priorities" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "debate_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debate_messages" (
    "id" TEXT NOT NULL,
    "debate_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debate_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" TEXT NOT NULL,
    "debate_id" TEXT NOT NULL,
    "affected_groups" JSONB NOT NULL,
    "key_changes" JSONB NOT NULL,
    "contentious_points" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judge_conclusions" (
    "id" TEXT NOT NULL,
    "debate_id" TEXT NOT NULL,
    "contradictions" TEXT NOT NULL,
    "common_points" TEXT NOT NULL,
    "compromises" TEXT NOT NULL,
    "group_summaries" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "judge_conclusions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_results_debate_id_key" ON "analysis_results"("debate_id");

-- CreateIndex
CREATE UNIQUE INDEX "judge_conclusions_debate_id_key" ON "judge_conclusions"("debate_id");

-- CreateIndex
CREATE INDEX "rounds_debate_id_round_number_idx" ON "rounds"("debate_id", "round_number");

-- CreateIndex
CREATE INDEX "debate_messages_debate_id_created_at_idx" ON "debate_messages"("debate_id", "created_at");

-- AddForeignKey
ALTER TABLE "debates" ADD CONSTRAINT "debates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_debate_id_fkey" FOREIGN KEY ("debate_id") REFERENCES "debates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_debate_id_fkey" FOREIGN KEY ("debate_id") REFERENCES "debates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debate_messages" ADD CONSTRAINT "debate_messages_debate_id_fkey" FOREIGN KEY ("debate_id") REFERENCES "debates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debate_messages" ADD CONSTRAINT "debate_messages_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debate_messages" ADD CONSTRAINT "debate_messages_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_debate_id_fkey" FOREIGN KEY ("debate_id") REFERENCES "debates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_conclusions" ADD CONSTRAINT "judge_conclusions_debate_id_fkey" FOREIGN KEY ("debate_id") REFERENCES "debates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
