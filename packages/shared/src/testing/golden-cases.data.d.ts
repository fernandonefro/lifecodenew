import { AlertSeverity } from '../enums';
import { GlucoseIngestionDTO } from '../schemas';
export interface GoldenTestCase {
    id: string;
    name: string;
    description: string;
    input: GlucoseIngestionDTO;
    expectedResult: {
        shouldTriggerAlert: boolean;
        expectedSeverity: AlertSeverity | null;
        expectedSlaMinutes: number | null;
        requiresImmediatePatientGuidance: boolean;
    };
}
export declare const GOLDEN_CLINICAL_TEST_CASES: GoldenTestCase[];
