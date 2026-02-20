// src/types.ts

export interface GeoLocation {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    timezone: string;
}

export interface CurrentWeather {
    city: string;
    country: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherDescription: string;
    isDay: boolean;
}

export interface DailyForecast {
    date: string;
    maxTemp: number;
    minTemp: number;
    precipitationProbability: number;
    weatherDescription: string;
}

export interface WeeklyForecast {
    city: string;
    country: string;
    forecast: DailyForecast[];
}
