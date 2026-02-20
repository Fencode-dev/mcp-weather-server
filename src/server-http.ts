// src/server-http.ts
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { getCurrentWeather, getWeeklyForecast } from "./weather.js";

const app = express();
// Eliminamos express.json() porque el SDK de MCP necesita leer el stream directamente
// app.use(express.json());

// Singleton MCP Server instance
const server = new McpServer({
    name: "fencode-weather-server",
    version: "1.0.0",
});

// Registra las tools
server.tool(
    "get_current_weather",
    "Obtiene el clima actual de cualquier ciudad del mundo.",
    { city: z.string().describe("Nombre de la ciudad") },
    async ({ city }) => {
        try {
            const weather = await getCurrentWeather(city);
            const text = `🌡️ ${weather.city}, ${weather.country}: ${weather.temperature}°C, ${weather.weatherDescription}. Humedad: ${weather.humidity}%, Viento: ${weather.windSpeed} km/h.`;
            return { content: [{ type: "text", text }] };
        } catch (error) {
            return { content: [{ type: "text", text: `❌ ${error instanceof Error ? error.message : "Error"}` }], isError: true };
        }
    }
);

server.tool(
    "get_weekly_forecast",
    "Obtiene el pronóstico de 7 días de cualquier ciudad.",
    { city: z.string().describe("Nombre de la ciudad") },
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
            return { content: [{ type: "text", text }] };
        } catch (error) {
            return { content: [{ type: "text", text: `❌ ${error instanceof Error ? error.message : "Error"}` }], isError: true };
        }
    }
);

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

let transport: SSEServerTransport | null = null;

// Endpoint para iniciar la conexión SSE
app.get("/sse", async (req, res) => {
    console.log("🚀 Nueva conexión SSE iniciada");
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
});

// Endpoint para recibir mensajes del cliente
app.post("/messages", async (req, res) => {
    console.log("📩 Mensaje recibido");
    if (!transport) {
        res.status(400).send("No hay una conexión SSE activa");
        return;
    }
    await transport.handlePostMessage(req, res);
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "fencode-weather-mcp", version: "1.0.0" });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor MCP HTTP corriendo en puerto ${PORT}`);
    console.log(`🔗 Endpoint SSE: http://localhost:${PORT}/sse`);
    console.log(`📩 Endpoint Messages: http://localhost:${PORT}/messages`);
});
