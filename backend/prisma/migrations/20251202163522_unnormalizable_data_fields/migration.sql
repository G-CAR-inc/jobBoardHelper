/*
  Warnings:

  - You are about to drop the column `accept` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `accept_language` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "accept",
DROP COLUMN "accept_language",
DROP COLUMN "domain",
DROP COLUMN "user_agent";
