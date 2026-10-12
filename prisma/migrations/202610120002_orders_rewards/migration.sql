-- AlterTable
ALTER TABLE "Worker" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "Worker" ADD COLUMN "archivedBy" TEXT;

-- CreateTable
CREATE TABLE "RecruitmentOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "factory" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "factoryId" TEXT,
    CONSTRAINT "RecruitmentOrder_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecruitmentBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "periodMonth" TEXT,
    "target" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecruitmentBatch_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RecruitmentOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssignmentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "occurredOn" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "interviewResult" TEXT,
    "note" TEXT,
    "operator" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssignmentEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkAssignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "factory" TEXT NOT NULL,
    "effectiveFrom" TEXT NOT NULL,
    "effectiveTo" TEXT NOT NULL,
    "rulesSnapshot" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicyEnrollment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkAssignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PolicyEnrollment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "BonusPolicy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RewardStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "thresholdDays" REAL,
    "amount" INTEGER NOT NULL,
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "eligibleAsOf" TEXT,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedOn" TEXT,
    "confirmedBy" TEXT,
    "confirmationNote" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RewardStage_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "PolicyEnrollment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RewardPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stageId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidOn" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "confirmedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardPayment_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RewardStage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecruitmentTeam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recruiter_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "RecruitmentTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaborStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "warnsDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "endsAssignment" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL DEFAULT 'DS_TONG',
    "mappingJson" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "syncDirection" TEXT NOT NULL DEFAULT 'IMPORT_ONLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "interviewFactory" TEXT NOT NULL,
    "workingFactory" TEXT,
    "contractType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Đang chờ phỏng vấn',
    "leaveDate" TEXT,
    "leaveReason" TEXT,
    "shuttleBusKtx" TEXT,
    "interviewDate" TEXT,
    "expectedTrainingDate" TEXT,
    "expectedTrainingStatus" TEXT,
    "standardTrainingDate" TEXT,
    "onboardingMonth" TEXT,
    "recruiter" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "orderId" TEXT,
    "batchId" TEXT,
    "team" TEXT,
    "recruiterId" TEXT,
    "teamId" TEXT,
    "employeeCode" TEXT,
    "interviewResult" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "passedDate" TEXT,
    "startDate" TEXT,
    "confirmedWorkDays" REAL,
    "workDaysAsOf" TEXT,
    "workDaysConfirmedBy" TEXT,
    CONSTRAINT "WorkAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RecruitmentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkAssignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "RecruitmentBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkAssignment_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "RecruitmentTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkAssignment" ("contractType", "createdAt", "expectedTrainingDate", "expectedTrainingStatus", "id", "interviewDate", "interviewFactory", "leaveDate", "leaveReason", "onboardingMonth", "recruiter", "shuttleBusKtx", "source", "standardTrainingDate", "status", "updatedAt", "workerId", "workingFactory") SELECT "contractType", "createdAt", "expectedTrainingDate", "expectedTrainingStatus", "id", "interviewDate", "interviewFactory", "leaveDate", "leaveReason", "onboardingMonth", "recruiter", "shuttleBusKtx", "source", "standardTrainingDate", "status", "updatedAt", "workerId", "workingFactory" FROM "WorkAssignment";
DROP TABLE "WorkAssignment";
ALTER TABLE "new_WorkAssignment" RENAME TO "WorkAssignment";
CREATE TABLE "new_BonusPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "factory" TEXT NOT NULL,
    "description" TEXT,
    "effectiveFrom" TEXT,
    "effectiveTo" TEXT,
    "orderId" TEXT,
    "rulesJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BonusPolicy_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RecruitmentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BonusPolicy" ("createdAt", "description", "factory", "id", "isActive", "name", "rulesJson", "updatedAt") SELECT "createdAt", "description", "factory", "id", "isActive", "name", "rulesJson", "updatedAt" FROM "BonusPolicy";
DROP TABLE "BonusPolicy";
ALTER TABLE "new_BonusPolicy" RENAME TO "BonusPolicy";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentOrder_code_key" ON "RecruitmentOrder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentBatch_orderId_code_key" ON "RecruitmentBatch"("orderId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyEnrollment_assignmentId_policyId_key" ON "PolicyEnrollment"("assignmentId", "policyId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardStage_enrollmentId_step_key" ON "RewardStage"("enrollmentId", "step");

-- CreateIndex
CREATE UNIQUE INDEX "RewardPayment_reference_key" ON "RewardPayment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Factory_code_key" ON "Factory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Factory_name_key" ON "Factory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentTeam_code_key" ON "RecruitmentTeam"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_code_key" ON "Recruiter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LaborStatus_name_key" ON "LaborStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ImportProfile_name_key" ON "ImportProfile"("name");

