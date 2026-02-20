// src/server-http.ts
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getCurrentWeather, getWeeklyForecast } from "./weather.js";

const app = express();
app.use(express.json());

function createMcpServer() {
    const server = new McpServer({
        name: "fencode-weather-server",
        version: "1.0.0",
    });

    // Registra las mismas tools del archivo index.ts
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
                const summary = forecast.map(d => `${d.date}: ${d.maxTemp}°/${d.minTemp}° - ${d.weatherDescription}`).join("\n");
                return { content: [{ type: "text", text: `📅 Pronóstico ${cityName}, ${country}:\n${summary}` }] };
            } catch (error) {
                return { content: [{ type: "text", text: `❌ ${error instanceof Error ? error.message : "Error"}` }], isError: true };
            }
        }
    );

    return server;
}

// Endpoint principal MCP
app.post("/mcp", async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => Math.random().toString(36).substring(2) });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "fencode-weather-mcp", version: "1.0.0" });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor MCP HTTP corriendo en puerto ${PORT}`);
});
