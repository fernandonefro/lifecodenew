import { FhirCodeableConcept, FhirQuantity } from './fhir-base.types';

export interface FhirObservationResource {
  resourceType: 'Observation';
  id?: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept; // LOINC Code (ex: 15074-8)
  subject: {
    reference: string; // Patient/{id}
  };
  effectiveDateTime: string; // ISO 8601 UTC
  issued?: string;          // ISO 8601 UTC (Ingestion Timestamp)
  valueQuantity?: FhirQuantity;
  note?: Array<{ text: string }>;
}
