-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PACIENTE', 'CUIDADOR', 'MEDICO', 'NAVEGADOR', 'GESTOR_CLINICA', 'ANALISTA_OPERADORA', 'ADMIN');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('TCLE_TERMS_OF_SERVICE', 'PRIVACY_POLICY_LGPD', 'DATA_SHARING_PHYSICIAN', 'DATA_SHARING_CAREGIVER', 'ANONYMIZED_RESEARCH');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('BLOOD_GLUCOSE', 'BLOOD_PRESSURE', 'HBA1C', 'BODY_WEIGHT', 'INSULIN_DOSE', 'CARBOHYDRATE_INTAKE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CGM', 'FLASH', 'CAPILLARY', 'MANUAL', 'LABORATORY', 'BLE_DIRECT', 'CLOUD_API_DEXCOM', 'CLOUD_API_LIBRE');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('VALIDATED', 'NOISY', 'OUT_OF_BOUNDS', 'PRELIMINARY');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('TIER_1_HIGH', 'TIER_2_MODERATE', 'TIER_3_LOW');

-- CreateEnum
CREATE TYPE "CareGapStatus" AS ENUM ('OVERDUE', 'SCHEDULED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CareGapType" AS ENUM ('HBA1C_OVERDUE', 'EGFR_OVERDUE', 'RETINA_EXAM_OVERDUE', 'FOOT_EXAM_OVERDUE', 'PHYSICIAN_VISIT_OVERDUE');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PACIENTE',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "policyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "acceptedAtUtc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAtUtc" TIMESTAMPTZ(6),
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "hmacSignature" TEXT NOT NULL,
    "timestampUtc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mrn" TEXT,
    "birthDate" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "diabetesType" TEXT NOT NULL DEFAULT 'TYPE_1',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_observations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "loincCode" TEXT NOT NULL DEFAULT '15074-8',
    "value" DECIMAL(8,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mg/dL',
    "sourceType" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "context" TEXT,
    "deviceId" TEXT,
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'VALIDATED',
    "measuredAt" TIMESTAMPTZ(6) NOT NULL,
    "ingestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "observationId" UUID,
    "severity" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dueDate" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_gaps" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "gapType" "CareGapType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "loincCode" TEXT,
    "dueDate" TIMESTAMPTZ(6) NOT NULL,
    "lastPerformedAt" TIMESTAMPTZ(6),
    "status" "CareGapStatus" NOT NULL DEFAULT 'OVERDUE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "care_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_stratifications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "tier" "RiskTier" NOT NULL DEFAULT 'TIER_3_LOW',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "hba1cValue" DECIMAL(4,2),
    "tirPercentage" INTEGER,
    "calculatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_stratifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "population_metrics" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "totalBeneficiaries" INTEGER NOT NULL,
    "tier1Count" INTEGER NOT NULL,
    "tier2Count" INTEGER NOT NULL,
    "tier3Count" INTEGER NOT NULL,
    "erVisitsCount" INTEGER NOT NULL,
    "hospitalizationsCount" INTEGER NOT NULL,
    "erRatePerThousand" DECIMAL(8,2) NOT NULL,
    "inpatientRatePerThousand" DECIMAL(8,2) NOT NULL,
    "calculatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "population_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE INDEX "users_tenantId_role_idx" ON "users"("tenantId", "role");

-- CreateIndex
CREATE INDEX "users_tenantId_email_idx" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_revoked_idx" ON "sessions"("userId", "revoked");

-- CreateIndex
CREATE INDEX "consent_logs_userId_scope_accepted_idx" ON "consent_logs"("userId", "scope", "accepted");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_timestampUtc_idx" ON "audit_logs"("tenantId", "timestampUtc" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_action_idx" ON "audit_logs"("tenantId", "action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestampUtc_idx" ON "audit_logs"("userId", "timestampUtc" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "patients"("userId");

-- CreateIndex
CREATE INDEX "patients_tenantId_mrn_idx" ON "patients"("tenantId", "mrn");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_observations_externalEventId_key" ON "clinical_observations"("externalEventId");

-- CreateIndex
CREATE INDEX "clinical_observations_tenantId_patientId_measuredAt_idx" ON "clinical_observations"("tenantId", "patientId", "measuredAt" DESC);

-- CreateIndex
CREATE INDEX "clinical_observations_tenantId_externalEventId_idx" ON "clinical_observations"("tenantId", "externalEventId");

-- CreateIndex
CREATE INDEX "alerts_tenantId_severity_status_idx" ON "alerts"("tenantId", "severity", "status");

-- CreateIndex
CREATE INDEX "alerts_patientId_status_idx" ON "alerts"("patientId", "status");

-- CreateIndex
CREATE INDEX "care_gaps_tenantId_gapType_status_idx" ON "care_gaps"("tenantId", "gapType", "status");

-- CreateIndex
CREATE INDEX "care_gaps_patientId_status_idx" ON "care_gaps"("patientId", "status");

-- CreateIndex
CREATE INDEX "risk_stratifications_tenantId_tier_idx" ON "risk_stratifications"("tenantId", "tier");

-- CreateIndex
CREATE INDEX "risk_stratifications_patientId_calculatedAt_idx" ON "risk_stratifications"("patientId", "calculatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "population_metrics_tenantId_periodMonth_key" ON "population_metrics"("tenantId", "periodMonth");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_observations" ADD CONSTRAINT "clinical_observations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_observations" ADD CONSTRAINT "clinical_observations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_gaps" ADD CONSTRAINT "care_gaps_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_gaps" ADD CONSTRAINT "care_gaps_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_stratifications" ADD CONSTRAINT "risk_stratifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_stratifications" ADD CONSTRAINT "risk_stratifications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "population_metrics" ADD CONSTRAINT "population_metrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
