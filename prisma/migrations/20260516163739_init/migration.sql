-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "departmentId" INTEGER,
    "managerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ThrustArea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    CONSTRAINT "ThrustArea_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoalSheet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "cycle" TEXT NOT NULL DEFAULT '2025-26',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "lockedAt" DATETIME,
    "returnNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoalSheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goalSheetId" INTEGER NOT NULL,
    "thrustAreaId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "uomType" TEXT NOT NULL,
    "target" REAL NOT NULL DEFAULT 0,
    "targetDate" TEXT,
    "weightage" REAL NOT NULL DEFAULT 10,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sharedGoalId" INTEGER,
    "isSharedReadonly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Goal_goalSheetId_fkey" FOREIGN KEY ("goalSheetId") REFERENCES "GoalSheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Goal_thrustAreaId_fkey" FOREIGN KEY ("thrustAreaId") REFERENCES "ThrustArea" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Goal_sharedGoalId_fkey" FOREIGN KEY ("sharedGoalId") REFERENCES "SharedGoal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedGoal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "uomType" TEXT NOT NULL,
    "target" REAL NOT NULL DEFAULT 0,
    "targetDate" TEXT,
    "createdById" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SharedGoal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SharedGoal_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuarterlyUpdate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goalId" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "actualValue" REAL NOT NULL DEFAULT 0,
    "completionDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "computedScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuarterlyUpdate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckinComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goalSheetId" INTEGER NOT NULL,
    "managerId" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckinComment_goalSheetId_fkey" FOREIGN KEY ("goalSheetId") REFERENCES "GoalSheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckinComment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goalId" INTEGER,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL DEFAULT '',
    "newValue" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "windowOpen" DATETIME NOT NULL,
    "windowClose" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyUpdate_goalId_quarter_key" ON "QuarterlyUpdate"("goalId", "quarter");
