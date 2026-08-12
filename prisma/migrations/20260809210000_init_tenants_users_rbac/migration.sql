-- LIFECODE INITIAL DATABASE MIGRATION & RLS ENFORCEMENT
-- Migration: 20260809210000_init_tenants_users_rbac

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum Role
CREATE TYPE "Role" AS ENUM ('PATIENT', 'PHYSICIAN', 'NURSE', 'CARE_GIVER', 'ADMIN');

-- CreateEnum DiabetesType
CREATE TYPE "DiabetesType" AS ENUM ('TYPE_1', 'TYPE_2', 'GESTATIONAL', 'LADA', 'MODY');

-- CreateEnum ProvenanceSource
CREATE TYPE "ProvenanceSource" AS ENUM ('BLE_DIRECT', 'CLOUD_API_DEXCOM', 'CLOUD_API_LIBRE', 'MANUAL_ENTRY');

-- CreateTable Tenants
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateTable Users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");
CREATE INDEX "users_tenantId_email_idx" ON "users"("tenantId", "email");

-- CreateTable PatientProfiles
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "diabetesType" "DiabetesType" NOT NULL DEFAULT 'TYPE_1',
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "emergencyContactPhone" TEXT,
    "lgpdConsentSignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "patient_profiles_userId_key" ON "patient_profiles"("userId");

-- CreateTable PractitionerProfiles
CREATE TABLE "practitioner_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "licenseType" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseState" TEXT NOT NULL,
    "signaturePkiHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practitioner_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "practitioner_profiles_userId_key" ON "practitioner_profiles"("userId");

-- CreateTable CareTeamMembers
CREATE TABLE "care_team_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "practitionerId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "care_team_members_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "care_team_members_tenantId_practitionerId_patientId_idx" ON "care_team_members"("tenantId", "practitionerId", "patientId");

-- CreateTable FhirObservations
CREATE TABLE "fhir_observations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "effectiveDateTime" TIMESTAMP(3) NOT NULL,
    "valueQuantityValue" DECIMAL(6,2) NOT NULL,
    "valueQuantityUnit" TEXT NOT NULL DEFAULT 'mg/dL',
    "loincCode" TEXT NOT NULL DEFAULT '15074-8',
    "trendArrow" TEXT,
    "context" TEXT,
    "sourceProvenance" "ProvenanceSource" NOT NULL DEFAULT 'BLE_DIRECT',
    "idempotencyKey" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fhir_observations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "fhir_observations_idempotencyKey_key" ON "fhir_observations"("idempotencyKey");
CREATE INDEX "fhir_observations_tenantId_patientId_effectiveDateTime_idx" ON "fhir_observations"("tenantId", "patientId", "effectiveDateTime" DESC);

-- CreateTable AuditLogs
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "hmacSignature" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practitioner_profiles" ADD CONSTRAINT "practitioner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fhir_observations" ADD CONSTRAINT "fhir_observations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fhir_observations" ADD CONSTRAINT "fhir_observations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
