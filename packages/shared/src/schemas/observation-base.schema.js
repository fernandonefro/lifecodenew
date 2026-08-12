"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observationBaseSchema = void 0;
const zod_1 = require("zod");
exports.observationBaseSchema = zod_1.z.object({
    schemaVersion: zod_1.z.string().default('1.0'),
    patientId: zod_1.z.string().uuid(),
    externalEventId: zod_1.z.string().min(1),
    loincCode: zod_1.z.string().min(1),
    value: zod_1.z.number(),
    unit: zod_1.z.string(),
    measuredAt: zod_1.z.string().datetime(),
    deviceId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=observation-base.schema.js.map