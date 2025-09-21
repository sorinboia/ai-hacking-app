# Web Frontend

This package is the Vite-powered UI for the Vulnerable AI Demo Shop. For overall setup, environment variables, and demo accounts, start with the repository root `README.md`. The notes below cover front-end specifics only.

## Available Scripts
- `npm run dev` - start the development server on port 5173
- `npm run build` - create a production build under `dist/`
- `npm run preview` - serve the production build locally
- `npm run lint` - run ESLint with the shared config

## Environment Configuration
Set variables in `web/.env` or your shell before starting Vite.
- `VITE_API_URL` (default `http://localhost:4000/api`): base URL for Axios requests. Override this when the API runs on another host or port.

## Local Workflow
1. Install dependencies with `npm install`.
2. Ensure the API is running (see root docs) so the concierge calls succeed.
3. Launch the dev server via `npm run dev` and open `http://localhost:5173`.
4. Log in with one of the seeded credentials from the root README to explore the vulnerable flows.

Vite supports hot-module reloading, so UI tweaks show up instantly while the API continues serving the same SQLite-backed data.
