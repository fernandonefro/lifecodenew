"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAZIL_TIMEZONE = exports.UTC_TIMEZONE = void 0;
exports.getUtcIsoString = getUtcIsoString;
exports.formatToBrazilTime = formatToBrazilTime;
exports.isTimestampOlderThanMinutes = isTimestampOlderThanMinutes;
const date_fns_tz_1 = require("date-fns-tz");
exports.UTC_TIMEZONE = 'UTC';
exports.BRAZIL_TIMEZONE = 'America/Sao_Paulo';
function getUtcIsoString(date = new Date()) {
    return date.toISOString();
}
function formatToBrazilTime(date, formatStr = 'dd/MM/yyyy HH:mm:ss') {
    const d = typeof date === 'string' ? (0, date_fns_tz_1.toDate)(date) : date;
    return (0, date_fns_tz_1.formatInTimeZone)(d, exports.BRAZIL_TIMEZONE, formatStr);
}
function isTimestampOlderThanMinutes(timestampIso, minutes) {
    const diffMs = new Date().getTime() - new Date(timestampIso).getTime();
    return diffMs > minutes * 60 * 1000;
}
//# sourceMappingURL=date-utils.js.map