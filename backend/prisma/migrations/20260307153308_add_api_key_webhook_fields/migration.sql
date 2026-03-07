/*
  Warnings:

  - A unique constraint covering the columns `[apiKey]` on the table `Factory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Factory" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "webhookSecret" TEXT,
ADD COLUMN     "webhookUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Factory_apiKey_key" ON "Factory"("apiKey");
