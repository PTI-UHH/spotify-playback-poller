/*
  Warnings:

  - You are about to drop the column `title` on the `Playback_data` table. All the data in the column will be lost.
  - Added the required column `access_token` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_token` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `data` on table `Playback_data` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "refresh_token" TEXT NOT NULL,
    "access_token" TEXT NOT NULL
);
INSERT INTO "new_User" ("id") SELECT "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE TABLE "new_Playback_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Playback_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Playback_data" ("data", "id", "userId") SELECT "data", "id", "userId" FROM "Playback_data";
DROP TABLE "Playback_data";
ALTER TABLE "new_Playback_data" RENAME TO "Playback_data";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
