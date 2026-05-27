/*
  Warnings:

  - Changed the type of `interests` on the `personas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fears` on the `personas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `priorities` on the `personas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "personas" DROP COLUMN "interests",
ADD COLUMN     "interests" JSONB NOT NULL,
DROP COLUMN "fears",
ADD COLUMN     "fears" JSONB NOT NULL,
DROP COLUMN "priorities",
ADD COLUMN     "priorities" JSONB NOT NULL;
