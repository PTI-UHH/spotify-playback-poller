/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "refresh_token" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL
);
INSERT INTO "new_User" ("access_token", "active", "refresh_token", "user_id") SELECT "access_token", "active", "refresh_token", "user_id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_user_id_key" ON "User"("user_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
