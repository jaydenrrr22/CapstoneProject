cat << 'EOF' > README.md
# Capstone Project Frontend

This is a React + Vite-based frontend application for the Financial ML App.  
It communicates with the FastAPI backend using Axios and implements JWT-based authentication.

The frontend uses a Service Layer architecture to handle all API requests.

---

## Setup Instructions

### 1. Environment Setup

Make sure you have Node.js installed (v18+ recommended).

From the root of the project, navigate to the frontend folder:

cd frontend

Install the required packages:

npm install

This will install all required dependencies including Axios.

Install React Router:

npm install react-router-dom

Install Recharts for charts:

npm install recharts

---

### 2. Environment Variables

Create a .env file inside the frontend folder:

VITE_API_BASE_URL=http://127.0.0.1:8000

This is required for the frontend to communicate with the backend during local development.

If you run the frontend behind a local reverse proxy or configure a Vite dev-server proxy that forwards `/api` to the backend, you may instead set:

VITE_API_BASE_URL=/api
Note: This file is not tracked by Git. Each developer must create their own .env file.

You can copy from .env.example if available:

cp .env.example .env

---

### 3. Start Development Server

Run the Vite development server:

npm run dev

The application will run locally at:

http://localhost:5173

---

## Deployment Notes

When deploying to production (AWS EC2), update the .env file:

VITE_API_BASE_URL=https://3.151.137.239

This ensures the frontend connects to the deployed backend instead of localhost.

---

## Architecture Notes

- Uses a centralized API client (apiClient) for:
  - Automatic JWT token attachment
  - Global error handling (401 redirects to login)
- All API calls should go through the service layer (/services)
- Avoid using fetch directly in components

---
EOF