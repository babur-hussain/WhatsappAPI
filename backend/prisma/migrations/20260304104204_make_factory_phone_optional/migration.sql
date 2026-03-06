-- DropIndex
DROP INDEX "Factory_phone_key";

-- AlterTable
ALTER TABLE "Factory" ALTER COLUMN "phone" DROP NOT NULL;
