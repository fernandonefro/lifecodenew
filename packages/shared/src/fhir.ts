export type FHIRResourceType = 'Patient' | 'CarePlan' | 'Task' | 'Observation' | 'RiskAssessment';

export interface Quantity {
  value: number;
  unit: string;
  system: string;
  code: string;
}

export interface ObservationFHIR {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
  };
  subject: { reference: string };
  effectiveDateTime: string;
  issued: string;
  valueQuantity: Quantity;
}
