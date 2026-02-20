# MCP Weather Server

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.3.0-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-SDK%201.0.0-orange)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A reference implementation of a Model Context Protocol (MCP) server providing real-time weather data via the Open-Meteo API. This server supports both local execution via standard I/O (stdio) and remote execution via HTTP with SSE transport.

## Features

- **Real-time Weather**: Current temperature, wind speed, and humidity conditions.
- **Weekly Forecast**: 7-day weather predictions with precipitation probabilities.
- **City Comparison**: Comparative analysis of weather conditions between two different locations.
- **Dual Transport Support**: Built-in support for both Local (stdio) and Remote (SSE) MCP connections.
- **Zero Configuration**: Uses public APIs that do not require API keys.

## Architecture

The project is structured to be production-ready and easily deployable:

- `src/index.ts`: Entry point for local execution (Stdio).
- `src/server-http.ts`: Entry point for remote execution (HTTP service using Express and SSE).
- `src/weather.ts`: Core logic for geocoding and weather data retrieval.
- `src/types.ts`: Strictly typed interfaces for all API communications.

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Local Testing (Stdio)

To test the server locally with an MCP client (e.g., Claude Desktop), add the following to your configuration:

```json
{
  "mcpServers": {
    "weather-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

### Remote Integration (HTTP/SSE)

Start the HTTP server using:

```bash
npm start
```

Default endpoints:
- SSE Connection: `GET /sse`
- Message Handler: `POST /messages`
- Health Check: `GET /health`

## MCP Tools

### get_current_weather
Retrieves current weather conditions for a specified city.
- **Arguments**: `city` (string)

### get_weekly_forecast
Retrieves a 7-day weather forecast for a specified city.
- **Arguments**: `city` (string)

### compare_cities_weather
Compares real-time weather data between two locations.
- **Arguments**: `city1` (string), `city2` (string)

## Deployment

The project includes a `Dockerfile` optimized for containerized environments like Railway or Render.

```bash
docker build -t mcp-weather-server .
docker run -p 3000:3000 mcp-weather-server
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Validation**: Zod
- **API**: Open-Meteo (Geocoding & Weather)

## License

This project is licensed under the MIT License.
