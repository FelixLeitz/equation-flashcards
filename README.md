# Equation Flashcards

> Build and study flashcards with beautifully rendered mathematical equations.

A full-stack flashcard app for learning equations, with live **LaTeX rendering**
(KaTeX), a distraction-free study mode, and secure cookie-based auth. Built as a
single-service deployment (Express serves the React SPA _and_ the API) on Railway,
backed by MongoDB Atlas.

## Features

- **Authentication** — sign up, log in, log out; JWT in an HttpOnly cookie, bcrypt-hashed passwords, generic auth failures (no user enumeration).
- **Decks** — create, edit, and delete decks; live card counts; ownership-scoped (you only ever see your own).
- **Cards with LaTeX** — front/back faces supporting inline (`$...$`) and block (`$$...$$`) math, with a **live KaTeX preview** as you type. Malformed LaTeX degrades gracefully instead of crashing.
- **Study mode** — full-screen, one card at a time; flip to reveal; navigate via buttons, arrow keys, or swipe; progress indicator and a session-complete view.
- **Account deletion** — permanently delete your account and all data, with a type-to-confirm safeguard.
- **Responsive** — mobile-first, works on phones and desktops.

---

## Tech Stack

| Layer             | Technology                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | React, Vite, React Router, TanStack Query, React Hook Form, Tailwind CSS, **Base UI**, KaTeX, react-hot-toast |
| **Backend**       | Node.js, Express, Mongoose, Passport (local + JWT), Pino                                                      |
| **Database**      | MongoDB Atlas (M0 replica set)                                                                                |
| **Validation**    | Zod — **shared schemas** used identically on client & server                                                  |
| **Auth**          | JWT in HttpOnly/Secure/SameSite=Lax cookie; bcrypt                                                            |
| **Testing**       | Mocha + Supertest (server) · Vitest + React Testing Library (client)                                          |
| **Observability** | Sentry (separate Node + React projects)                                                                       |
| **Deployment**    | Railway (single service) · MongoDB Atlas                                                                      |
| **Tooling**       | npm workspaces (monorepo), ESLint, Prettier, Husky + lint-staged                                              |

---

## Architecture

Single-origin deployment — one Railway service serves both the static client
bundle and the `/api` routes, so requests are same-origin (no CORS in practice)
and cookie auth works without `SameSite=None`.

```
Browser (React SPA)
      │  HTTPS · cookie: token (HttpOnly)
      ▼
Railway service (Express)
   ├─ static: client/dist + SPA fallback
   └─ /api routes  ──Mongoose/TLS──►  MongoDB Atlas
```

The backend follows a strict layering: **routes → middleware → controllers →
services → models**. Controllers are thin HTTP glue; all business logic and
ownership checks live in services.

**Detailed diagrams:** see [`docs/Architecture.md`](docs/Architecture.md)
(Mermaid diagrams — system, auth flows, data model, frontend, LaTeX pipeline,
study-mode state machine, deployment).

**API reference:** see [`docs/API.md`](docs/API.md).

---

## Project Structure

```
equation-flashcards/
├── client/          React SPA (Vite, Tailwind, Base UI, TanStack Query)
│   ├── src/
│   │   ├── components/   shared UI (LatexRenderer, AppShell, ...)
│   │   ├── features/     auth · decks · cards · study · account
│   │   ├── lib/          api-client, query-client
│   │   ├── pages/        landing, 404
│   │   └── router.jsx
│   └── ...
├── server/          Express API (Mongoose, Passport, Pino)
│   ├── src/
│   │   ├── config/      env, database, passport, logger, sentry
│   │   ├── middleware/  security, rate-limit, auth, validate, error-handler
│   │   ├── models/      User · Deck · Card
│   │   ├── controllers/ thin HTTP glue
│   │   ├── services/    business logic + ownership checks
│   │   ├── routes/      health · auth · decks · cards · account
│   │   ├── instrument.js  (Sentry preload)
│   │   └── server.js
│   └── test/        Mocha + Supertest suites
├── shared/          @flashcards/shared — Zod schemas + constants
├── docs/            SRS · API.md · Architecture.md
└── package.json     npm workspaces + root scripts
```

---

## Getting Started

### Prerequisites

- **Node.js ≥ 20**
- **MongoDB** — a local instance, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/equation-flashcards.git
cd equation-flashcards
npm install        # installs all workspaces and links @flashcards/shared
```

### 2. Configure environment

**Server** — copy the example and fill in values:

```bash
cp server/.env.example server/.env
```

```bash
# server/.env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/equation-flashcards
JWT_SECRET=use-a-long-random-string-at-least-32-characters
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
# SENTRY_DSN=        # optional; leave empty to disable in dev
```

> Generate a strong secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Client** — copy the example (defaults are fine for local dev):

```bash
cp client/.env.example client/.env
```

```bash
# client/.env
VITE_API_BASE_URL=        # empty in dev — the Vite proxy forwards /api
# VITE_SENTRY_DSN=        # optional
```

### 3. Run in development

```bash
npm run dev
```

This starts both workspaces concurrently:

- **Client:** http://localhost:5173 (Vite, proxies `/api` → server)
- **Server:** http://localhost:3000

Open **http://localhost:5173** and sign up.

---

## Testing

```bash
npm test               # server (Mocha) + client (Vitest)
npm test -w server     # backend only
npm test -w client     # frontend only
```

The server suite uses an in-memory MongoDB (`mongodb-memory-server`), so no
running database is required for tests.

---

## Available Scripts

Run from the repo root:

| Script           | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| `npm run dev`    | Start client + server concurrently (development)               |
| `npm run build`  | Build the client (`client/dist`) for production                |
| `npm start`      | Start the server in production (serves the built client + API) |
| `npm test`       | Run all server + client tests                                  |
| `npm run lint`   | Lint the whole monorepo                                        |
| `npm run format` | Format with Prettier                                           |

A Husky `pre-commit` hook runs `lint-staged` + tests on commit.

---

## Production Build (local preview)

To run the production single-service setup locally:

```bash
npm run build                          # build the client
NODE_ENV=production npm start          # Express serves client/dist + /api on :3000
```

Then open **http://localhost:3000** (the _server_ port — Express serves the SPA).

> Note: with `NODE_ENV=production`, auth cookies are flagged `Secure` and require
> HTTPS, so login may not persist over plain `http://localhost`. It works over
> HTTPS in deployment.

---

## Deployment (Railway + Atlas)

Deployed as a **single service**: Railway builds the client and runs Express,
which serves both `client/dist` and the API on one origin.

**Lifecycle:** `npm install` → `npm run build` → `npm start`
(`node --import ./src/instrument.js src/server.js`).

**Environment variables on Railway:**

| Variable            | Type           | Notes                                               |
| ------------------- | -------------- | --------------------------------------------------- |
| `NODE_ENV`          | runtime        | `production`                                        |
| `MONGODB_URI`       | runtime        | Atlas SRV string (incl. db name)                    |
| `JWT_SECRET`        | runtime        | fresh 32+ char secret (not your local one)          |
| `FRONTEND_ORIGIN`   | runtime        | the deployed Railway URL (https, no trailing slash) |
| `SENTRY_DSN`        | runtime        | Sentry **Node** project DSN                         |
| `VITE_SENTRY_DSN`   | **build-time** | Sentry **React** project DSN (baked into bundle)    |
| `VITE_API_BASE_URL` | **build-time** | leave **empty** (single-service, same-origin)       |
| `PORT`              | runtime        | injected automatically by Railway — do not hardcode |

> `VITE_*` vars are baked in at `vite build`, so they must be set as build-time
> variables, not just runtime.

**MongoDB Atlas:** an M0 (free) replica-set cluster, a DB user.
Access requires valid credentials + TLS.

The health check path is `/api/health`.

## Author

Built by **Felix Leitz** — [GitHub](https://github.com/FelixLeitz)
