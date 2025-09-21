# Vulnerable AI Demo Shop

This repository contains a deliberately vulnerable full-stack demo used to showcase how over-permissive AI assistants can be abused. It comprises a Node.js API (`/api`) and a React front-end (`/web`) wired to a local Ollama model via MCP tools. Use these docs to stand the stack up quickly for workshops or demos.

## Prerequisites
- Node.js 20+
- npm 10+
- Ollama running locally (default `http://localhost:11434`) with the model named in `OLLAMA_MODEL`

## Initial Setup
1. Install dependencies for each service:
   ```bash
   cd api && npm install
   cd ../web && npm install
   ```
2. (Optional) create `api/.env` to override defaults. Anything not provided falls back to the values listed below.
3. Create `web/.env` when you need to point the UI at a non-default API origin.

The API automatically runs migrations and seeds demo data every time it starts when `SEED_RESET=onStart`.

## Environment Variables
| Name | Service | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | api | `development` | Controls Express session security flags.
| `PORT` | api | `4000` | HTTP port for the API server.
| `SESSION_SECRET` | api | `demo-session-secret` | Key for signing Express sessions - change for real demos.
| `DATABASE_URL` | api | `data/app.db` | SQLite database location (created automatically).
| `FILE_ROOT` | api | `storage` | Directory for uploaded RAG documents and generated files.
| `SEED_RESET` | api | `onStart` | `onStart` wipes and reseeds on boot; set to `never` to preserve test data.
| `FLAG_SECRET` | api | `FLAG` | Prefix used when generating capture-the-flag tokens.
| `OLLAMA_HOST` | api | `http://localhost:11434` | Base URL for the local Ollama runtime.
| `OLLAMA_MODEL` | api | `llama3.1` | Model slug sent to Ollama for chat completions.
| `USE_EMBEDDINGS` | api | `false` | Toggle to switch RAG lookup to embedding search instead of keyword.
| `UC_SOFT_MAX_TOOL_CALLS` | api | `8` | Soft guardrail for tool invocations per turn (used for UC flagging).
| `UC_SOFT_MAX_TOKENS` | api | `6000` | Soft guardrail for token usage per turn.
| `VITE_API_URL` | web | `http://localhost:4000/api` | Axios base URL for front-end requests.

## Seeded Demo Data
The API seeds a full demo dataset on launch. Built-in auth users:
- `annie@demo.store` / `quantum123` - customer persona "Annie Photon"
- `sam@demo.store` / `duckduck90` - customer persona "Sam Quill"
- `admin@demo.store` / `pwnAllTheLLMs` - admin persona "Morgan Vector" with RAG upload access

The seeder also loads intentionally sensitive RAG content (loyalty data, poisoned instructions) to support prompt-injection and data-exfiltration demos. Uploaded files live under `storage/`.

## Running Both Services Together
1. Start the API (terminal 1):
   ```bash
   cd api
   npm run dev
   ```
   The server listens on `http://localhost:4000` and exposes `GET /api/health` for quick checks.
2. Start the web client (terminal 2):
   ```bash
   cd web
   npm run dev
   ```
   Vite serves the UI at `http://localhost:5173`. It proxies API calls to `VITE_API_URL` (default `http://localhost:4000/api`).
3. Log in with one of the seeded accounts and start exploring the vulnerable flows.

To simulate production, run `npm start` in `api` and `npm run build && npm run preview` in `web`. Remember to supply a strong `SESSION_SECRET` and consider pinning `SEED_RESET=never` if you need persistent demo state.

## Troubleshooting Tips
- Delete `data/app.db` when you want to wipe the database manually (only necessary if `SEED_RESET=never`).
- Ensure Ollama is running with the requested model; the API reports connection issues in the terminal if it cannot reach `OLLAMA_HOST`.
- If Vite cannot reach the API, double-check CORS settings and that both processes are running on the expected ports.
