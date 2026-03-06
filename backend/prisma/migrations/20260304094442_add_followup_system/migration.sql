-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'SENT', 'CANCELLED');

-- AlterTable
ALTER TABLE "Factory" ADD COLUMN     "followUp1Delay" INTEGER NOT NULL DEFAULT 21600,
ADD COLUMN     "followUp1Enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "followUp1Message" TEXT,
ADD COLUMN     "followUp2Delay" INTEGER NOT NULL DEFAULT 86400,
ADD COLUMN     "followUp2Enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "followUp2Message" TEXT,
ADD COLUMN     "followUp3Delay" INTEGER NOT NULL DEFAULT 259200,
ADD COLUMN     "followUp3Enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "followUp3Message" TEXT,
ADD COLUMN     "followUpsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "followUpNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FollowUp_leadId_idx" ON "FollowUp"("leadId");

-- CreateIndex
CREATE INDEX "FollowUp_factoryId_idx" ON "FollowUp"("factoryId");

-- CreateIndex
CREATE INDEX "FollowUp_status_scheduledAt_idx" ON "FollowUp"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "FollowUp_leadId_status_idx" ON "FollowUp"("leadId", "status");

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
