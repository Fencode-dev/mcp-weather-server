// src/index.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getCurrentWeather, getWeeklyForecast } from "./weather.js";

// Inicializa el servidor MCP
const server = new McpServer({
    name: "fencode-weather-server",
    version: "1.0.0",
});

// ─── TOOL 1: Clima actual ───────────────────────────────────────
server.tool(
    "get_current_weather",
    "Obtiene el clima actual de cualquier ciudad del mundo: temperatura, sensación térmica, humedad, viento y condición climática.",
    {
        city: z.string().describe("Nombre de la ciudad (ej: 'Monterrey', 'Ciudad de México', 'Buenos Aires')"),
    },
    async ({ city }) => {
        try {
            const weather = await getCurrentWeather(city);

            const icon = weather.isDay ? "☀️" : "🌙";
            const text = `
${icon} Clima actual en ${weather.city}, ${weather.country}

🌡️  Temperatura: ${weather.temperature}°C (sensación: ${weather.feelsLike}°C)
🌤️  Condición: ${weather.weatherDescription}
💧 Humedad: ${weather.humidity}%
💨 Viento: ${weather.windSpeed} km/h
      `.trim();

            return {
                content: [{ type: "text", text }],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

// ─── TOOL 2: Pronóstico semanal ─────────────────────────────────
server.tool(
    "get_weekly_forecast",
    "Obtiene el pronóstico del clima para los próximos 7 días de cualquier ciudad.",
    {
        city: z.string().describe("Nombre de la ciudad"),
    },
    async ({ city }) => {
        try {
            const { city: cityName, country, forecast } = await getWeeklyForecast(city);

            const rows = forecast
                .map((day) => {
                    const date = new Date(day.date + "T12:00:00").toLocaleDateString("es-MX", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                    });
                    return `  ${date.padEnd(15)} ${String(day.maxTemp).padStart(3)}°C / ${String(day.minTemp).padStart(3)}°C   💧${day.precipitationProbability}%   ${day.weatherDescription}`;
                })
                .join("\n");

            const text = `
📅 Pronóstico 7 días — ${cityName}, ${country}

  Día              Máx   Mín   Lluvia  Condición
  ─────────────────────────────────────────────────
${rows}
      `.trim();

            return {
                content: [{ type: "text", text }],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

// ─── TOOL 3: Comparar ciudades ──────────────────────────────────
server.tool(
    "compare_cities_weather",
    "Compara el clima actual entre dos ciudades.",
    {
        city1: z.string().describe("Primera ciudad a comparar"),
        city2: z.string().describe("Segunda ciudad a comparar"),
    },
    async ({ city1, city2 }) => {
        try {
            const [weatherA, weatherB] = await Promise.all([
                getCurrentWeather(city1),
                getCurrentWeather(city2),
            ]);

            const tempDiff = weatherA.temperature - weatherB.temperature;
            const warmerCity = tempDiff > 0 ? weatherA.city : weatherB.city;
            const tempDiffAbs = Math.abs(tempDiff);

            const text = `
🆚 Comparación de clima

📍 ${weatherA.city}, ${weatherA.country}
   🌡️  ${weatherA.temperature}°C (sensación ${weatherA.feelsLike}°C)
   🌤️  ${weatherA.weatherDescription}
   💧 Humedad: ${weatherA.humidity}% | 💨 Viento: ${weatherA.windSpeed} km/h

📍 ${weatherB.city}, ${weatherB.country}
   🌡️  ${weatherB.temperature}°C (sensación ${weatherB.feelsLike}°C)
   🌤️  ${weatherB.weatherDescription}
   💧 Humedad: ${weatherB.humidity}% | 💨 Viento: ${weatherB.windSpeed} km/h

📊 Resumen: ${warmerCity} está ${tempDiffAbs}°C más ${tempDiffAbs > 0 ? "cálida" : "fría"} que la otra ciudad.
      `.trim();

            return {
                content: [{ type: "text", text }],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

// ─── Inicia el servidor con transporte stdio ────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ Servidor MCP de clima iniciado correctamente");
}

main().catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
});
