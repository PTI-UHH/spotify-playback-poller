-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playback_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Playback_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Playback_data" ("data", "id", "userId") SELECT "data", "id", "userId" FROM "Playback_data";
DROP TABLE "Playback_data";
ALTER TABLE "new_Playback_data" RENAME TO "Playback_data";
CREATE UNIQUE INDEX "Playback_data_userId_key" ON "Playback_data"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
