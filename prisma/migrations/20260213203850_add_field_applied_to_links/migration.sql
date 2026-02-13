-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "simpleApply" BOOLEAN NOT NULL DEFAULT false,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Links" ("createdAt", "done", "id", "simpleApply", "updatedAt", "url") SELECT "createdAt", "done", "id", "simpleApply", "updatedAt", "url" FROM "Links";
DROP TABLE "Links";
ALTER TABLE "new_Links" RENAME TO "Links";
CREATE UNIQUE INDEX "Links_url_key" ON "Links"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
