/*
  Warnings:

  - Added the required column `domain` to the `reese84_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reese84_tokens" ADD COLUMN     "domain" TEXT NOT NULL;
