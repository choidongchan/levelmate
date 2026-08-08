-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "myRole" TEXT,
ADD COLUMN     "wantRoles" TEXT[];

-- CreateTable
CREATE TABLE "RiotAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'kr',
    "summonerId" TEXT,
    "profileIconId" INTEGER,
    "summonerLevel" INTEGER,
    "tier" TEXT,
    "division" TEXT,
    "lp" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "mainRole" TEXT,
    "champions" JSONB,
    "kills" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deaths" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assists" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentGames" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "verifyCode" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiotAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiotAccount_userId_key" ON "RiotAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RiotAccount_puuid_key" ON "RiotAccount"("puuid");

-- CreateIndex
CREATE INDEX "RiotAccount_tier_idx" ON "RiotAccount"("tier");

-- AddForeignKey
ALTER TABLE "RiotAccount" ADD CONSTRAINT "RiotAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
