/*
  Warnings:

  - The values [N8N] on the enum `OrderSource` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `apiKey` on the `Factory` table. All the data in the column will be lost.
  - You are about to drop the column `webhookSecret` on the `Factory` table. All the data in the column will be lost.
  - You are about to drop the column `webhookUrl` on the `Factory` table. All the data in the column will be lost.
  - You are about to drop the `Integration` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderSource_new" AS ENUM ('DASHBOARD', 'AI', 'API');
ALTER TABLE "Order" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "source" TYPE "OrderSource_new" USING ("source"::text::"OrderSource_new");
ALTER TYPE "OrderSource" RENAME TO "OrderSource_old";
ALTER TYPE "OrderSource_new" RENAME TO "OrderSource";
DROP TYPE "OrderSource_old";
ALTER TABLE "Order" ALTER COLUMN "source" SET DEFAULT 'DASHBOARD';
COMMIT;

-- DropForeignKey
ALTER TABLE "Integration" DROP CONSTRAINT "Integration_factoryId_fkey";

-- DropIndex
DROP INDEX "Factory_apiKey_key";

-- AlterTable
ALTER TABLE "Factory" DROP COLUMN "apiKey",
DROP COLUMN "webhookSecret",
DROP COLUMN "webhookUrl",
ADD COLUMN     "whatsappAccessToken" TEXT,
ADD COLUMN     "whatsappBusinessAccountId" TEXT;

-- DropTable
DROP TABLE "Integration";

-- DropEnum
DROP TYPE "IntegrationType";
