/*
  Warnings:

  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Job";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vagaIdLinkedIn" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "url" TEXT NOT NULL,
    "jobDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Jobs_vagaIdLinkedIn_key" ON "Jobs"("vagaIdLinkedIn");

-- CreateIndex
CREATE UNIQUE INDEX "Jobs_url_key" ON "Jobs"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Links_url_key" ON "Links"("url");
