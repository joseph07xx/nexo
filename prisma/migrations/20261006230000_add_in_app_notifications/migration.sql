-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONTRIBUTION_CREATED');

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'CONTRIBUTION_CREATED',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InAppNotification_recipientId_readAt_createdAt_idx" ON "InAppNotification"("recipientId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "SavingsContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;