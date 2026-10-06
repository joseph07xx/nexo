/*
  Warnings:

  - You are about to alter the column `name` on the `SavingsGoal` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(120)`.
  - The `status` column on the `SavingsGoal` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SavingsGoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- DropIndex
DROP INDEX "SavingsGoal_coupleId_idx";

-- AlterTable
ALTER TABLE "SavingsGoal" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "description" VARCHAR(500),
ADD COLUMN     "targetDate" TIMESTAMP(3),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(120),
DROP COLUMN "status",
ADD COLUMN     "status" "SavingsGoalStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "SavingsGoal_coupleId_status_idx" ON "SavingsGoal"("coupleId", "status");

-- CreateIndex
CREATE INDEX "SavingsGoal_coupleId_createdAt_idx" ON "SavingsGoal"("coupleId", "createdAt");
