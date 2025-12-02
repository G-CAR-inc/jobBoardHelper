/*
  Warnings:

  - You are about to drop the `reese84_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `utmvc_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reese84_tokens" DROP CONSTRAINT "reese84_tokens_session_id_fkey";

-- DropForeignKey
ALTER TABLE "utmvc_tokens" DROP CONSTRAINT "utmvc_tokens_session_id_fkey";

-- DropTable
DROP TABLE "reese84_tokens";

-- DropTable
DROP TABLE "utmvc_tokens";
