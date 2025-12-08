/*
  Warnings:

  - You are about to drop the column `is_rejected` on the `job_applications` table. All the data in the column will be lost.
  - You are about to drop the column `is_viewed` on the `job_applications` table. All the data in the column will be lost.
  - You are about to drop the `BrowserSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "job_applications" DROP COLUMN "is_rejected",
DROP COLUMN "is_viewed";

-- DropTable
DROP TABLE "BrowserSession";
