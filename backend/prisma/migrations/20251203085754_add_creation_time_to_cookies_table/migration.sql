/*
  Warnings:

  - Added the required column `creation` to the `cookies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cookies" ADD COLUMN     "creation" TIMESTAMP(3) NOT NULL;
