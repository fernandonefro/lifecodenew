export class UcumConverter {
  private static readonly MMOL_TO_MG_DL_FACTOR = 18.0182;

  public static mmolLToMgDl(mmolL: number): number {
    return Math.round(mmolL * UcumConverter.MMOL_TO_MG_DL_FACTOR);
  }

  public static mgDlToMmolL(mgDl: number): number {
    return parseFloat((mgDl / UcumConverter.MMOL_TO_MG_DL_FACTOR).toFixed(2));
  }
}
