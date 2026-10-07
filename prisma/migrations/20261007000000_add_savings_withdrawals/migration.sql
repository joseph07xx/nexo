-- CreateTable
CREATE TABLE "SavingsWithdrawal" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "note" VARCHAR(280),
    "withdrawalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingsWithdrawal_coupleId_withdrawalDate_idx" ON "SavingsWithdrawal"("coupleId", "withdrawalDate");

-- CreateIndex
CREATE INDEX "SavingsWithdrawal_userId_idx" ON "SavingsWithdrawal"("userId");

-- CreateIndex
CREATE INDEX "SavingsWithdrawal_goalId_idx" ON "SavingsWithdrawal"("goalId");

-- AddForeignKey
ALTER TABLE "SavingsWithdrawal" ADD CONSTRAINT "SavingsWithdrawal_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsWithdrawal" ADD CONSTRAINT "SavingsWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsWithdrawal" ADD CONSTRAINT "SavingsWithdrawal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingsGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;