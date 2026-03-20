export type Spot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  areaName: string;
  memo: string;
  createdAt: string;
};

export type FishingResult = "caught" | "no-catch";
export type FishingTimeZone = "morning" | "day" | "evening" | "night";

export type FishingLog = {
  id: string;
  spotId: string;
  date: string;
  result: FishingResult;
  fishType: string;
  sizeCm: number | null;
  count: number | null;
  weather: string;
  tide: string;
  timeZone: FishingTimeZone;
  lureOrBait: string;
  memo: string;
  createdAt: string;
};
