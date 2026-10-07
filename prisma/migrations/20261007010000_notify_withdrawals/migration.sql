ALTER TYPE "NotificationType" ADD VALUE 'WITHDRAWAL_CREATED';

ALTER TABLE "InAppNotification"
    ALTER COLUMN "contributionId" DROP NOT NULL,
    ADD COLUMN "withdrawalId" TEXT;

CREATE INDEX "InAppNotification_withdrawalId_idx" ON "InAppNotification"("withdrawalId");

ALTER TABLE "InAppNotification"
    ADD CONSTRAINT "InAppNotification_withdrawalId_fkey"
    FOREIGN KEY ("withdrawalId") REFERENCES "SavingsWithdrawal"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;