-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "fullName" TEXT NOT NULL,
    "dob" TEXT,
    "gender" TEXT,
    "idCard" TEXT NOT NULL,
    "idCardDate" TEXT,
    "idCardPlace" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "province" TEXT,
    "recruiter" TEXT,
    "team" TEXT,
    "source" TEXT,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklistReason" TEXT,
    "isWhitelisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkAssignment" (
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
    CONSTRAINT "WorkAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonusRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "company" TEXT,
    "month" TEXT NOT NULL,
    "interviewDate" TEXT,
    "policy" TEXT,
    "workerCode" TEXT,
    "bonus1" REAL DEFAULT 0,
    "bonus2" REAL DEFAULT 0,
    "bonus3" REAL DEFAULT 0,
    "bonus4" REAL DEFAULT 0,
    "bonus5" REAL DEFAULT 0,
    "bonus6" REAL DEFAULT 0,
    "bonus7" REAL DEFAULT 0,
    "totalBonus" REAL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BonusRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BonusRecord_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "isNameVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "authorizedRelation" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "warningMessage" TEXT,
    "checkedBy" TEXT,
    "checkResult" TEXT,
    "checkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankAccount_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonusPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "factory" TEXT NOT NULL,
    "description" TEXT,
    "rulesJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT,
    "operator" TEXT DEFAULT 'Hệ thống',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Worker_idCard_key" ON "Worker"("idCard");

