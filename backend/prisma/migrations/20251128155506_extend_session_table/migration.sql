/*
  Warnings:

  - Added the required column `accept` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accept_language` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_agent` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "accept" TEXT NOT NULL,
ADD COLUMN     "accept_language" TEXT NOT NULL,
ADD COLUMN     "user_agent" TEXT NOT NULL;
