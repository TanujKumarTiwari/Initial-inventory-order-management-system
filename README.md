# Inventory & Order Management System

A production-ready full-stack Inventory & Order Management System with a React frontend, FastAPI backend, PostgreSQL database, Dockerfiles, and Docker Compose orchestration.

## Features

- Product CRUD with unique SKU validation.
- Customer create/list/detail/delete with unique email validation.
- Order create/list/detail/delete with automatic total calculation.
- Inventory protection for insufficient stock and negative quantities.
- Automatic stock reduction on order creation and stock restoration on order cancellation.
- Responsive operations dashboard with totals and low-stock watchlist.
- Containerized frontend, backend, and PostgreSQL services.

## Stack

- Frontend: React, Vite, JavaScript, Lucide icons
- Backend: Python, FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL
- Containers: Docker and Docker Compose

## Local Setup

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Update `POSTGRES_PASSWORD` in `.env`.

3. Start the full stack:

```bash
docker compose up --build
```

4. Open the app:

- Frontend: `http://localhost:8080`
- Backend API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## API Endpoints

Products:

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`

Customers:

- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `DELETE /customers/{id}`

Orders:

- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `DELETE /orders/{id}`

Dashboard:

- `GET /dashboard`

## Deployment On Free Hosting

One practical free-tier deployment path:

1. Create a free PostgreSQL database on Neon or Supabase.
2. Deploy `backend/` to Render as a Web Service:
   - Runtime: Docker
   - Root directory: `backend`
   - Environment variables:
     - `DATABASE_URL`
     - `CORS_ORIGINS=https://your-frontend-domain`
3. Deploy `frontend/` to Render Static Site, Netlify, or Vercel:
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Environment variable:
     - `VITE_API_BASE_URL=https://your-backend-domain`
4. For single-host Docker deployment, use `docker-compose.yml` on any free Docker-capable host and set production values in `.env`.

## Notes

- The backend creates tables on startup for simplicity. For larger production teams, add Alembic migrations before evolving schemas.
- Docker Compose uses a named volume, `postgres_data`, so database data persists across container restarts.
- Credentials are read from environment variables and are not hardcoded in source.
