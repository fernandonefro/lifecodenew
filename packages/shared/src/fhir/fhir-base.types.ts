export interface FhirCoding {
  system: string;
  code: string;
  display: string;
}

export interface FhirCodeableConcept {
  coding: FhirCoding[];
  text?: string;
}

export interface FhirQuantity {
  value: number;
  unit: string;
  system: string; // http://unitsofmeasure.org (UCUM)
  code: string;   // ex: mg/dL, mm[Hg], %
}
