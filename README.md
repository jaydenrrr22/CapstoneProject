# Trace – Capstone Project

A full-stack personal finance tracking application built with **FastAPI** (backend) and **React/Vite** (frontend), deployed on AWS EC2.

## Project Overview

Trace helps users track their spending and financial transactions. It provides JWT-authenticated REST API endpoints, ML-based spending predictions, and an interactive React dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy, MySQL |
| Frontend | React 19, Vite, Recharts, Framer Motion |
| Auth | JWT (HTTPBearer) + bcrypt |
| Caching | In-memory cache layer (prediction results) |
| Deployment | AWS EC2 (Ubuntu 22.04), CloudWatch monitoring |

## Repository Structure

```
CapstoneProject/
├── backend/          # FastAPI application
│   ├── api/
│   │   ├── main.py           # App entry point
│   │   ├── prediction.py     # ML prediction router
│   │   ├── cache.py          # Caching layer
│   │   ├── routers/          # API route handlers
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── dependencies/     # Auth & DB dependencies
│   └── README.md     # Backend setup guide
├── frontend/         # React/Vite application
├── infrastructure/   # AWS/deployment config
├── deployment.md     # Deployment documentation
├── seed.py           # Database seeding script
└── requirements.txt  # Python dependencies
```

## Getting Started

### Backend

See [`backend/README.md`](backend/README.md) for detailed setup instructions, including:

- Python virtual environment setup
- `.env` configuration (DB credentials)
- Database seeding with `seed.py`
- Running the Uvicorn server

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will be available at `http://localhost:5173`.

## Deployment

See [`deployment.md`](deployment.md) for full AWS EC2 deployment instructions, including CloudWatch monitoring setup and IAM role configuration.

## API Documentation

Once the backend server is running, interactive API docs are available at:

```
http://127.0.0.1:8000/docs
```
