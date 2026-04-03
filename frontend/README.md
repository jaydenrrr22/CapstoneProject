# Capstone Project Frontend

This frontend is built with React and Vite and talks to the FastAPI backend through the `/api` path.

## Development

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173`.

## API Routing

The frontend always calls `/api`.

- In local development, Vite proxies `/api` to the backend.
- In production, Nginx proxies `/api` to the backend.

Do not set `VITE_API_BASE_URL` for this app.

## Build

```bash
cd frontend
npm run build
```

## Notes

- Authentication uses the shared Axios service layer.
- API requests should go through the existing client/service files rather than using `fetch` directly in components.
