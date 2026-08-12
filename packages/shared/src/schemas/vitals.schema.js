"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitalsSchema = void 0;
const zod_1 = require("zod");
exports.vitalsSchema = zod_1.z.object({
    systolicMmHg: zod_1.z.number().min(50).max(300),
    diastolicMmHg: zod_1.z.number().min(30).max(200),
    heartRateBpm: zod_1.z.number().min(30).max(250).optional(),
    measuredAt: zod_1.z.string().datetime(),
});
//# sourceMappingURL=vitals.schema.js.map