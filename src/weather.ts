// src/weather.ts

import type { GeoLocation, CurrentWeather, WeeklyForecast, DailyForecast } from "./types.js";

// Códigos WMO de condición climática
const WMO_CODES: Record<number, string> = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna intensa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia fuerte",
    71: "Nevada ligera",
    73: "Nevada moderada",
    75: "Nevada fuerte",
    80: "Chubascos ligeros",
    81: "Chubascos moderados",
    82: "Chubascos fuertes",
    95: "Tormenta eléctrica",
    99: "Tormenta con granizo",
};

// Convierte nombre de ciudad a coordenadas
export async function geocodeCity(cityName: string): Promise<GeoLocation> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=es&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error al buscar la ciudad: ${response.statusText}`);
    }

    const data = await response.json() as { results?: GeoLocation[] };

    if (!data.results || data.results.length === 0) {
        throw new Error(`No se encontró la ciudad: "${cityName}". Intenta con un nombre más específico.`);
    }

    return data.results[0];
}

// Obtiene el clima actual de una ciudad
export async function getCurrentWeather(cityName: string): Promise<CurrentWeather> {
    const location = await geocodeCity(cityName);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error al consultar el clima: ${response.statusText}`);
    }

    const data = await response.json() as {
        current: {
            temperature_2m: number;
            apparent_temperature: number;
            relative_humidity_2m: number;
            wind_speed_10m: number;
            weather_code: number;
            is_day: number;
        };
    };

    const current = data.current;

    return {
        city: location.name,
        country: location.country,
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        weatherDescription: WMO_CODES[current.weather_code] ?? "Condición desconocida",
        isDay: current.is_day === 1,
    };
}

// Obtiene el pronóstico de 7 días
export async function getWeeklyForecast(cityName: string): Promise<WeeklyForecast> {
    const location = await geocodeCity(cityName);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error al consultar el pronóstico: ${response.statusText}`);
    }

    const data = await response.json() as {
        daily: {
            time: string[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
            precipitation_probability_max: number[];
            weather_code: number[];
        };
    };

    const daily = data.daily;
    const forecast: DailyForecast[] = daily.time.map((date, i) => ({
        date,
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        precipitationProbability: daily.precipitation_probability_max[i],
        weatherDescription: WMO_CODES[daily.weather_code[i]] ?? "Condición desconocida",
    }));

    return {
        city: location.name,
        country: location.country,
        forecast,
    };
}
