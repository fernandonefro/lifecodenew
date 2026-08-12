"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UcumConverter = void 0;
class UcumConverter {
    static mmolLToMgDl(mmolL) {
        return Math.round(mmolL * UcumConverter.MMOL_TO_MG_DL_FACTOR);
    }
    static mgDlToMmolL(mgDl) {
        return parseFloat((mgDl / UcumConverter.MMOL_TO_MG_DL_FACTOR).toFixed(2));
    }
}
exports.UcumConverter = UcumConverter;
UcumConverter.MMOL_TO_MG_DL_FACTOR = 18.0182;
//# sourceMappingURL=ucum-converter.js.map