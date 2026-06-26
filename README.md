# TestPro Deployment Package

## Overview

This package contains the TestPro application source for local setup and review.

It includes:

- `client/` — React frontend application built with Vite
- `server/` — Express backend API written in TypeScript

This package is intended for local validation and onboarding. It does not include the original AWS/EC2 deployment pipeline or any production-specific host/credential configuration.

---

## Directory structure

```
TestPro-Deployment-v1.0/
  client/
    .env.development
    .env.production
    package.json
    package-lock.json
    tsconfig.json
    tsconfig.app.json
    tsconfig.node.json
    vite.config.ts
    src/
      App.tsx
      main.tsx
      ...
  server/
    .env.example
    package.json
    package-lock.json
    tsconfig.json
    ecosystem.config.js
    src/
      app.ts
      server.ts
      controllers/
      routes/
      services/
      utils/
```

---

## Prerequisites

- Node.js 20.x
- npm 10.x or later
- Git (optional)

---

## Local setup

### 1. Backend

```bash
cd TestPro-Deployment-v1.0/server
npm install
npm run build
npm start
```

- The backend listens on `PORT` from environment or defaults to `3000`.
- The server exposes API routes under `/api/v1` and metrics at `/metrics`.
- For live reload during development, use:

```bash
npm run dev
```

### 2. Frontend

```bash
cd ../client
npm install
npm run dev
```

- The frontend runs with Vite and uses `client/.env.development` to locate the backend API.
- Open the local Vite URL shown in the terminal after startup.

---

## Environment configuration

### Frontend

The frontend uses `client/.env.development` for local development.

Example:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Backend

The backend accepts the following environment variables:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

- `PORT`: port the Express server listens on.
- `NODE_ENV`: controls production vs development logger behavior.
- `LOG_LEVEL`: optional logger verbosity.

A sample file is provided at `server/.env.example`.

---

## API endpoints

### Compare endpoint

- `POST /api/v1/compare`
- Used by the frontend to compare MuleSoft and SAP BTP payloads.

### Load test endpoint

- `POST /api/v1/load-test`
- Used by the frontend to execute concurrent endpoint load tests.

### Metrics endpoint

- `GET /metrics`
- Exposes Prometheus-style metrics for the backend service.

---

## Notes for Watch Tower

- This package includes the core application source only.
- It does not include the original deployment automation (`Jenkinsfile`) or AWS-specific host values.
- `client/.env.production` is present but should not be used for production as-is; it should be replaced with J&J-specific deployment configuration.

---

## Security considerations

- `server/src/app.ts` currently enables CORS with `app.use(cors())`.
  - For production, replace this with a strict allowlist of trusted origins.
- `/metrics` is exposed without application-level authentication.
  - In production, protect this endpoint via network controls, reverse proxy rules, or authentication.
- Do not commit any secrets, keys, or host-specific credentials into source control.

---

## Recommended next steps

1. Confirm the backend starts successfully on `http://localhost:3000`.
2. Confirm the frontend starts successfully and can call the backend.
3. Verify the `POST /api/v1/compare` and `POST /api/v1/load-test` flows from the UI.
4. Verify `/metrics` returns Prometheus metrics.
5. Review `server/.env.example` and `client/.env.development` to ensure environment values are correct for local testing.

---

