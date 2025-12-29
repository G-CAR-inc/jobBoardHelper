/*
  Warnings:

  - You are about to drop the column `visa_reason` on the `application_analyses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "application_analyses" DROP COLUMN "visa_reason",
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "nationality_reason" TEXT,
ADD COLUMN     "nationality_verdict" BOOLEAN NOT NULL DEFAULT false;
