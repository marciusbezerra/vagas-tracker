-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Jobs" (
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
    "note" TEXT,
    "simpleApply" BOOLEAN NOT NULL DEFAULT false,
    "applyDate" DATETIME,
    "recruiterNotified" BOOLEAN NOT NULL DEFAULT false,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Jobs" ("applyDate", "company", "createdAt", "id", "jobDate", "location", "note", "recruiterNotified", "seniority", "simpleApply", "status", "title", "type", "updatedAt", "url", "vagaIdLinkedIn") SELECT "applyDate", "company", "createdAt", "id", "jobDate", "location", "note", "recruiterNotified", "seniority", "simpleApply", "status", "title", "type", "updatedAt", "url", "vagaIdLinkedIn" FROM "Jobs";
DROP TABLE "Jobs";
ALTER TABLE "new_Jobs" RENAME TO "Jobs";
CREATE UNIQUE INDEX "Jobs_vagaIdLinkedIn_key" ON "Jobs"("vagaIdLinkedIn");
CREATE UNIQUE INDEX "Jobs_url_key" ON "Jobs"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
