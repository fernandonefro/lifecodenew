export enum MeasurementSource {
  CGM = 'CGM',
  FLASH = 'FLASH',
  CAPILLARY = 'CAPILLARY',
  MANUAL = 'MANUAL',
  LABORATORY = 'LABORATORY',
}

export enum MeasurementContext {
  FASTING = 'FASTING',            // Jejum
  PRE_PRANDIAL = 'PRE_PRANDIAL',    // Pré-prandial
  POST_PRANDIAL = 'POST_PRANDIAL',  // Pós-prandial
  BEDTIME = 'BEDTIME',            // Ao deitar
  NOCTURNAL = 'NOCTURNAL',        // Madrugada
  RANDOM = 'RANDOM',               // Casual
}
