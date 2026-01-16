-- CreateTable
CREATE TABLE "Job" (
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

-- CreateIndex
CREATE UNIQUE INDEX "Job_vagaIdLinkedIn_key" ON "Job"("vagaIdLinkedIn");

-- CreateIndex
CREATE UNIQUE INDEX "Job_url_key" ON "Job"("url");
