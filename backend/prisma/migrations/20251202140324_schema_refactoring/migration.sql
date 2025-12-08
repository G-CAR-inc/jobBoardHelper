/*
  Warnings:

  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `session_id` on the `cookies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `sdk_usage` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cookies" DROP CONSTRAINT "cookies_session_id_fkey";

-- AlterTable
ALTER TABLE "cookies" DROP COLUMN "session_id",
ADD COLUMN     "session_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
ADD COLUMN     "sdk_usage" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "cookies" ADD CONSTRAINT "cookies_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
