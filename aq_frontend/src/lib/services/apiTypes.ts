export type GeoResult = {
  name: string;
  country: string;
  state?: string | null;
  lat: number;
  lon: number;
};

export type AirData = {
  location: { lat: number; lon: number };
  timestamp_unix: number;
  aqi_ow_1_5: number;
  pollutants: Record<string, number>;
  source: string;
};

export type AirHistoryItem = {
  timestamp_unix: number;
  aqi_ow_1_5: number;
  pollutants: Record<string, number>;
};

export type AirHistoryResponse = {
  location: { lat: number; lon: number };
  start_unix: number;
  end_unix: number;
  items: AirHistoryItem[];
  source: string;
};