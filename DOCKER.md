# TED API Docker Deployment

This document provides instructions for running the TED API application using Docker.

## Prerequisites

- Docker Desktop installed and running
- Ports 80, 4000, and 6379 available

## Quick Start

1. **Stop any local development servers** (backend on port 4000):
```bash
# Kill any process using port 4000
lsof -ti:4000 | xargs kill -9
```

2. **Build and start all services**:
```bash
docker compose up --build
```

3. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:4000
   - Health check: http://localhost:4000/health

## Services

The application consists of three services:

- **frontend**: React app served by Nginx (port 80)
- **backend**: Node.js Express API (port 4000)
- **redis**: Redis cache for translations (port 6379)

## Common Commands

**Start in background:**
```bash
docker compose up -d
```

**View logs:**
```bash
docker compose logs -f
```

**Stop all services:**
```bash
docker compose down
```

**Rebuild after code changes:**
```bash
docker compose up --build
```

## API Proxy Configuration

The frontend nginx is configured to proxy API requests to the backend:
- `/api/backend/*` → `backend:4000/*`
- `/api/forecast/*` → `backend:4000/forecast/*`
- `/api/insights/*` → `backend:4000/insights/*`

## Environment Variables

Backend environment variables (configured in `docker-compose.yml`):
- `PORT=4000`
- `REDIS_URL=redis://redis:6379`

## Troubleshooting

**Port 4000 already in use:**
```bash
lsof -ti:4000 | xargs kill -9
docker compose up --build
```

**Redis connection errors:**
Redis is automatically started as part of the docker-compose stack.

**Cannot connect to backend:**
Ensure all three containers are running:
```bash
docker compose ps
```

## Development vs Production

This Docker setup is suitable for both review/testing and production deployment. For production:
- Add environment-specific configuration
- Consider using docker secrets for sensitive data
- Set up proper logging and monitoring
