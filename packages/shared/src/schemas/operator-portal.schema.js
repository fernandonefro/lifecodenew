"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operatorMetricsFilterSchema = exports.CareGapType = exports.RiskTier = void 0;
const zod_1 = require("zod");
var RiskTier;
(function (RiskTier) {
    RiskTier["TIER_3_HIGH"] = "TIER_3_HIGH";
    RiskTier["TIER_2_MODERATE"] = "TIER_2_MODERATE";
    RiskTier["TIER_1_LOW"] = "TIER_1_LOW";
})(RiskTier || (exports.RiskTier = RiskTier = {}));
var CareGapType;
(function (CareGapType) {
    CareGapType["HBA1C_OVERDUE"] = "HBA1C_OVERDUE";
    CareGapType["RENAL_SCREENING_PENDING"] = "RENAL_SCREENING_PENDING";
    CareGapType["RETINOPATHY_SCREENING_PENDING"] = "RETINOPATHY_SCREENING_PENDING";
    CareGapType["FOOT_EXAM_PENDING"] = "FOOT_EXAM_PENDING";
    CareGapType["CONSULTATION_OVERDUE"] = "CONSULTATION_OVERDUE";
})(CareGapType || (exports.CareGapType = CareGapType = {}));
exports.operatorMetricsFilterSchema = zod_1.z.object({
    tenantId: zod_1.z.string().uuid().optional(),
    riskTier: zod_1.z.nativeEnum(RiskTier).optional(),
    gapType: zod_1.z.nativeEnum(CareGapType).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=operator-portal.schema.js.map