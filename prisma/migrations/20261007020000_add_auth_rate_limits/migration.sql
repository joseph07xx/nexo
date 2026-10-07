CREATE TABLE "AuthRateLimit" (
    "id" TEXT NOT NULL,
    "keyHash" CHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthRateLimit_keyHash_key" ON "AuthRateLimit"("keyHash");
CREATE INDEX "AuthRateLimit_updatedAt_idx" ON "AuthRateLimit"("updatedAt");