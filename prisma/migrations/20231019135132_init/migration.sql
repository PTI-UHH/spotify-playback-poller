-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "active" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccessToken" (
    "access_token" TEXT NOT NULL PRIMARY KEY,
    "refresh_token" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaybackData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaybackData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AccessToken_access_token_key" ON "AccessToken"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "AccessToken_userId_key" ON "AccessToken"("userId");
