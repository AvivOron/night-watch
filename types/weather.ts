export interface HourlySlot {
  time: Date;
  cloudCoverPercent: number;
  visibilityMeters: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface WeatherData {
  fetchedAt: Date;
  hourly: HourlySlot[];
  currentCloudCover: number;
  seeingQuality: 'excellent' | 'good' | 'fair' | 'poor';
  seeingLabel: string;
}
