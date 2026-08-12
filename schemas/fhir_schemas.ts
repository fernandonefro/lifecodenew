/**
 * LIFECODE SaMD PLATFORM - CANONICAL FHIR ENTITIES & TYPES
 * Standard: HL7 FHIR R4/R5 Compliance for Diabetes Care
 */

export type FHIRResourceType =
  | 'Patient'
  | 'CarePlan'
  | 'Task'
  | 'Observation'
  | 'RiskAssessment'
  | 'Device';

export interface Identifier {
  system: string;
  value: string;
  use?: 'usual' | 'official' | 'temp' | 'secondary';
}

export interface Coding {
  system: string;
  code: string;
  display: string;
  version?: string;
}

export interface CodeableConcept {
  coding: Coding[];
  text?: string;
}

export interface Reference {
  reference: string;
  type?: FHIRResourceType;
  display?: string;
}

export interface Period {
  start: string;
  end?: string;
}

export interface Quantity {
  value: number;
  unit: string;
  system: string;
  code: string;
}

export interface Extension {
  url: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueDateTime?: string;
  valueQuantity?: Quantity;
}

export interface PatientFHIR {
  resourceType: 'Patient';
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
    security: Coding[];
  };
  identifier: Identifier[];
  active: boolean;
  name: Array<{
    use: 'official' | 'usual';
    family: string;
    given: string[];
  }>;
  telecom: Array<{
    system: 'phone' | 'email';
    value: string;
    use: 'mobile' | 'home' | 'work';
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  generalPractitioner?: Reference[];
  extension: Array<
    | { url: 'https://lifecode.health/fhir/StructureDefinition/lgpd-consent'; valueBoolean: boolean; valueDateTime: string }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/diabetes-type'; valueString: 'TYPE_1' | 'TYPE_2' | 'GESTATIONAL' | 'LADA' | 'MODY' }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/tenant-id'; valueString: string }
  >;
}

export interface TargetGlucoseRange {
  lowMgDl: number;
  highMgDl: number;
  severeLowMgDl: number;
  severeHighMgDl: number;
}

export interface InsulinParameters {
  carbRatioGramsPerUnit: number;
  sensitivityFactorMgDlPerUnit: number;
  targetGlucoseMgDl: number;
  activeInsulinDurationHours: number;
}

export interface CarePlanFHIR {
  resourceType: 'CarePlan';
  id: string;
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed';
  intent: 'plan' | 'order';
  category: CodeableConcept[];
  title: string;
  description?: string;
  subject: Reference;
  author: Reference;
  period: Period;
  created: string;
  activity: Array<{
    detail: {
      code: CodeableConcept;
      status: 'not-started' | 'in-progress' | 'completed';
      doNotPerform: boolean;
    };
  }>;
  extension: Array<
    | { url: 'https://lifecode.health/fhir/StructureDefinition/target-glucose'; valueString: string }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/insulin-parameters'; valueString: string }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/icp-brazil-signature'; valueString: string }
  >;
}

export interface ObservationFHIR {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'entered-in-error';
  category: CodeableConcept[];
  code: CodeableConcept;
  subject: Reference;
  effectiveDateTime: string;
  issued: string;
  valueQuantity?: Quantity;
  device?: Reference;
  component?: Array<{
    code: CodeableConcept;
    valueCodeableConcept?: CodeableConcept;
    valueQuantity?: Quantity;
  }>;
  extension: Array<
    | { url: 'https://lifecode.health/fhir/StructureDefinition/glucose-context'; valueString: 'FASTING' | 'PRE_PRANDIAL' | 'POST_PRANDIAL' | 'BEDTIME' | 'NIGHT' }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/provenance-source'; valueString: 'BLE_DIRECT' | 'CLOUD_API_DEXCOM' | 'CLOUD_API_LIBRE' | 'MANUAL_ENTRY' }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/idempotency-key'; valueString: string }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/signal-quality'; valueString: 'GOOD' | 'NOISY' | 'UNRELIABLE' }
  >;
}

export interface TaskFHIR {
  resourceType: 'Task';
  id: string;
  status: 'draft' | 'requested' | 'accepted' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
  intent: 'order' | 'proposal' | 'plan';
  priority: 'routine' | 'urgent' | 'asap' | 'stat';
  code: CodeableConcept;
  description: string;
  focus?: Reference;
  for: Reference;
  executionPeriod: Period;
  authoredOn: string;
  lastModified: string;
  requester: Reference;
  owner: Reference;
}

export interface RiskAssessmentFHIR {
  resourceType: 'RiskAssessment';
  id: string;
  status: 'registered' | 'final' | 'entered-in-error';
  subject: Reference;
  occurrenceDateTime: string;
  basis: Reference[];
  prediction: Array<{
    outcome: CodeableConcept;
    probabilityDecimal?: number;
    qualitativeRisk?: CodeableConcept;
    whenRange?: Period;
    rationale?: string;
  }>;
  extension: Array<
    | { url: 'https://lifecode.health/fhir/StructureDefinition/time-in-range-14d'; valueQuantity: Quantity }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/time-below-range-14d'; valueQuantity: Quantity }
    | { url: 'https://lifecode.health/fhir/StructureDefinition/gmi-estimated-a1c'; valueQuantity: Quantity }
  >;
}
