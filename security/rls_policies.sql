-- LIFECODE SaMD PLATFORM - ROW-LEVEL SECURITY (RLS) POLICIES (CA-01 REQUIREMENT)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS care_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    practitioner_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('PHYSICIAN', 'NURSE', 'EDUCATOR', 'CARE_GIVER')),
    active BOOLEAN DEFAULT TRUE,
    granted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fhir_observations (
    observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    patient_id UUID NOT NULL,
    effective_date_time TIMESTAMPTZ NOT NULL,
    value_quantity_value NUMERIC(6, 2) NOT NULL,
    value_quantity_unit VARCHAR(20) DEFAULT 'mg/dL',
    loinc_code VARCHAR(20) NOT NULL DEFAULT '15074-8',
    source_provenance VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fhir_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_observations FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_assigned_to_patient(p_patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF NULLIF(current_setting('app.current_user_id', true), '') = p_patient_id::text THEN
        RETURN TRUE;
    END IF;
    IF current_setting('app.current_user_role', true) = 'ADMIN' THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 
        FROM care_team_members ctm
        WHERE ctm.tenant_id::text = current_setting('app.current_tenant_id', true)
          AND ctm.practitioner_id::text = current_setting('app.current_user_id', true)
          AND ctm.patient_id = p_patient_id
          AND ctm.active = TRUE
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE POLICY rls_fhir_obs_select_policy ON fhir_observations
    FOR SELECT
    USING (
        tenant_id::text = current_setting('app.current_tenant_id', true)
        AND is_assigned_to_patient(patient_id)
    );

CREATE POLICY rls_fhir_obs_insert_policy ON fhir_observations
    FOR INSERT
    WITH CHECK (
        tenant_id::text = current_setting('app.current_tenant_id', true)
    );
