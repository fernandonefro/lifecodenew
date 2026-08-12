"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeasurementContext = exports.MeasurementSource = void 0;
var MeasurementSource;
(function (MeasurementSource) {
    MeasurementSource["CGM"] = "CGM";
    MeasurementSource["FLASH"] = "FLASH";
    MeasurementSource["CAPILLARY"] = "CAPILLARY";
    MeasurementSource["MANUAL"] = "MANUAL";
    MeasurementSource["LABORATORY"] = "LABORATORY";
})(MeasurementSource || (exports.MeasurementSource = MeasurementSource = {}));
var MeasurementContext;
(function (MeasurementContext) {
    MeasurementContext["FASTING"] = "FASTING";
    MeasurementContext["PRE_PRANDIAL"] = "PRE_PRANDIAL";
    MeasurementContext["POST_PRANDIAL"] = "POST_PRANDIAL";
    MeasurementContext["BEDTIME"] = "BEDTIME";
    MeasurementContext["NOCTURNAL"] = "NOCTURNAL";
    MeasurementContext["RANDOM"] = "RANDOM";
})(MeasurementContext || (exports.MeasurementContext = MeasurementContext = {}));
//# sourceMappingURL=measurement-source.enum.js.map