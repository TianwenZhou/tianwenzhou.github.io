# Agent API

FastAPI backend for the Agent dashboard.

Runtime: Python 3.11+ is recommended. AKShare's latest releases no longer install cleanly on Ubuntu 20.04's system Python 3.8.

## Endpoints

- `GET /health`
- `GET /api/weather?location=101040700`
- `GET /api/weather/locations?q=沙坪坝`
- `GET /api/stocks/{stockKey}`
- `GET /api/stocks/lookup?symbol=002594`
- `POST /api/stocks/{stockKey}/refresh`
- `GET /api/bilibili`
- `POST /api/bilibili/refresh`

## Deploy Notes

The service expects:

- scripts in `/srv/agent-api/scripts`
- generated JSON data in `/srv/agent-api/data`
- systemd service `agent-api`
- Nginx reverse proxy from port `80` to `127.0.0.1:8000`

Secrets such as QWeather keys should be set through environment variables or a server-only `.env` file.

Required weather variables:

- `QWEATHER_HOST`
- `QWEATHER_KEY` or `QWEATHER_JWT`
