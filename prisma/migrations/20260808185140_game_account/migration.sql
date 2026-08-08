-- CreateTable
CREATE TABLE "GameAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "platform" TEXT,
    "name" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "tier" TEXT,
    "detail" TEXT,
    "stats" JSONB,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameAccount_game_tier_idx" ON "GameAccount"("game", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "GameAccount_userId_game_key" ON "GameAccount"("userId", "game");

-- CreateIndex
CREATE UNIQUE INDEX "GameAccount_game_externalId_key" ON "GameAccount"("game", "externalId");

-- AddForeignKey
ALTER TABLE "GameAccount" ADD CONSTRAINT "GameAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
