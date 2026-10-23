/** One hour of irradiance data. Slot `hour` covers hour:00 to (hour+1):00 local time. */
export type Slot = {
  hour: number;
  /** Mean global tilted irradiance over the slot, W/m². */
  gti: number;
  /** Air temperature, °C. */
  temp: number;
  /** Cloud cover, %. */
  cloud: number;
};

export type DaySeries = {
  /** Local date, YYYY-MM-DD (Asia/Karachi). For typical days, YYYY-MM. */
  date: string;
  slots: Slot[];
};

export type IrradianceMode = "forecast" | "typical";

export type IrradianceData = {
  mode: IrradianceMode;
  days: DaySeries[];
  /** Typical mode only: the month (1–12) and year the average is built from. */
  month?: number;
  year?: number;
  fetchedAt: string;
};

export type Appliance = {
  id: string;
  name: string;
  /** Average power draw while running, kW. */
  kw: number;
  /** Run time per day, hours. */
  hours: number;
};

export type OrientationId = "E" | "SE" | "S" | "SW" | "W";

export type Settings = {
  kwp: number;
  orientation: OrientationId;
  tilt: number;
  /** Performance ratio: all system losses combined (inverter, wiring, dust). */
  pr: number;
  baseKw: number;
  appliances: Appliance[];
  mode: IrradianceMode;
  /** Month for typical-day mode; null means "current month". */
  month: number | null;
};
