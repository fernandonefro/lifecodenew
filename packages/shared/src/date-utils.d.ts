export declare const UTC_TIMEZONE = "UTC";
export declare const BRAZIL_TIMEZONE = "America/Sao_Paulo";
export declare function getUtcIsoString(date?: Date): string;
export declare function formatToBrazilTime(date: Date | string, formatStr?: string): string;
export declare function isTimestampOlderThanMinutes(timestampIso: string, minutes: number): boolean;
