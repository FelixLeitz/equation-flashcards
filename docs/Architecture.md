# Equation Flashcards — Architecture

A full-stack flashcard app for studying equations, with LaTeX rendering.
Deployed as a **single service** (Express serves both the API and the built
React SPA) on Railway, backed by MongoDB Atlas.

- **Live:** https://equation-flashcards-production.up.railway.app
- **Stack:** React + Vite (client) · Express + Mongoose (server) ·
  MongoDB Atlas · shared Zod schemas (`@flashcards/shared`)

---

## 1. System Overview

Single-origin deployment: the browser talks to one Railway service over HTTPS.
Express serves the static client bundle _and_ the `/api` routes, so requests
are same-origin (no CORS in practice) and cookie auth "just works".

```mermaid
graph TB
    subgraph Browser["🌐 Browser (SPA)"]
        React["React App<br/>(Vite build)"]
    end

    subgraph Railway["☁️ Railway Service (single, HTTPS)"]
        direction TB
        Express["Express App"]
        Static["Static: client/dist<br/>+ SPA fallback"]
        API["/api routes/"]
        Express --> Static
        Express --> API
    end

    subgraph Atlas["🗄️ MongoDB Atlas (M0 replica set)"]
        Mongo[("equation-flashcards<br/>users · decks · cards")]
    end

    Sentry["📡 Sentry<br/>(Node + React projects)"]

    React -- "HTTPS<br/>cookie: token (HttpOnly)" --> Express
    Express -- "Mongoose / TLS" --> Mongo
    Express -- "errors (5xx)" --> Sentry
    React -- "render crashes" --> Sentry
```

---

## 2. Monorepo Structure

npm workspaces with three packages. The `shared` package holds Zod schemas and
constants imported by **both** client and server, so validation rules are
identical on each side.

```mermaid
graph LR
    Root["📦 root<br/>(npm workspaces)"]
    Root --> Client["client/<br/>React + Vite"]
    Root --> Server["server/<br/>Express + Mongoose"]
    Root --> Shared["shared/<br/>Zod schemas + constants"]

    Client -. "import @flashcards/shared" .-> Shared
    Server -. "import @flashcards/shared" .-> Shared

    style Shared fill:#e8f0fe,stroke:#4285f4
```

```
equation-flashcards/
├── client/        React SPA (Vite, Tailwind, Base UI, TanStack Query)
├── server/        Express API (Mongoose, Passport, Pino)
├── shared/        @flashcards/shared — Zod schemas + constants
├── docs/          SRS, API.md, Architecture.md
└── package.json   workspaces + root scripts (build, start, test)
```

---

## 3. Backend Layered Architecture

A strict layering convention: **routes → middleware → controllers → services
→ models**. Controllers are thin HTTP glue; **all business logic and ownership
checks live in services**. The one intentional exception is `login`, which uses
`passport.authenticate('local')` in the controller (Passport treated as HTTP
plumbing; the strategy itself delegates to the service).

```mermaid
graph TB
    Req["HTTP Request"]

    subgraph Middleware["Middleware Pipeline"]
        direction TB
        Sec["security<br/>(helmet, cors)"]
        Limit["rate-limit<br/>(global + auth)"]
        Auth["requireAuth<br/>(JWT cookie)"]
        Valid["validateBody<br/>(Zod schema)"]
        Oid["validateObjectId"]
    end

    subgraph Controllers["Controllers (thin HTTP glue)"]
        Ctrl["read req → call service → shape res"]
    end

    subgraph Services["Services (business logic)"]
        Svc["createUser · authenticateUser<br/>createDeck · getDeckForUser<br/>addCardToDeck · deleteAccount<br/>(ownership enforced here)"]
    end

    subgraph Models["Models (Mongoose)"]
        Mdl["User · Deck · Card<br/>schemas, hooks, toJSON"]
    end

    ErrH["Centralized Error Handler<br/>(AppError → JSON, no stack leak)"]
    Res["HTTP Response"]

    Req --> Sec --> Limit --> Auth --> Valid --> Oid --> Ctrl
    Ctrl --> Svc --> Mdl
    Mdl -- "data" --> Svc -- "data / throws AppError" --> Ctrl
    Ctrl --> Res
    Svc -. "throws" .-> ErrH
    Ctrl -. "throws (asyncHandler)" .-> ErrH
    ErrH --> Res

    style Services fill:#e6f4ea,stroke:#34a853
    style Controllers fill:#fef7e0,stroke:#fbbc04
```

### Request lifecycle (full middleware order in `app.js`)

```mermaid
flowchart LR
    A["trust proxy"] --> B["security<br/>(helmet+cors)"]
    B --> C["json + cookie parser"]
    C --> D["passport.initialize"]
    D --> E["morgan (non-test)"]
    E --> F["globalLimiter /api"]
    F --> G["API routes<br/>/health /auth /decks /cards /account"]
    G --> H["/api 404 (JSON)"]
    H --> I["serveClient<br/>(prod: static + SPA fallback)"]
    I --> J["Sentry error handler<br/>(if DSN)"]
    J --> K["errorHandler (last)"]
```

---

## 4. Authentication Flow

JWT issued on signup/login, stored in an **HttpOnly, Secure, SameSite=Lax
cookie** named `token`. No `Authorization` header. Protected routes verify the
cookie via the `passport-jwt` strategy behind `requireAuth`.

### Signup / Login (sets cookie)

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as Route (+rate limit, +Zod)
    participant C as auth.controller
    participant P as passport-local
    participant S as auth.service
    participant M as User model
    participant T as auth-tokens

    Note over B,T: LOGIN
    B->>R: POST /api/auth/login {email,password}
    R->>C: validated body
    C->>P: passport.authenticate('local')
    P->>S: authenticateUser(email,password)
    S->>M: findOne(email).select('+passwordHash')
    M-->>S: user (or null)
    S->>S: bcrypt.compare()
    alt valid
        S-->>P: user
        P-->>C: user
        C->>T: issueAuthCookie(res, user)
        T-->>B: Set-Cookie: token (HttpOnly, Secure, Lax)
        C-->>B: 200 { user }
    else invalid (unknown email OR wrong pw)
        S-->>P: throws AuthError
        P-->>C: false
        C-->>B: 401 { error: "Invalid email or password." }
    end
```

> Generic `401` for both unknown email and wrong password prevents user
> enumeration (single source of truth in `authenticateUser`).

### Accessing a protected route

```mermaid
sequenceDiagram
    participant B as Browser
    participant RA as requireAuth
    participant J as passport-jwt
    participant S as service
    participant DB as MongoDB

    B->>RA: GET /api/decks (cookie: token)
    RA->>J: authenticate('jwt')
    J->>J: cookieExtractor → verify JWT (exp, sig)
    alt valid token
        J->>DB: findById(payload.sub)
        DB-->>J: user
        J-->>RA: user → req.user
        RA->>S: listDecksForUser(req.user.id)
        S->>DB: find({ ownerId })
        DB-->>S: decks (+ cardCount aggregation)
        S-->>B: 200 { decks }
    else missing/expired/invalid
        J-->>RA: false
        RA-->>B: 401 UNAUTHENTICATED
    end
```

---

## 5. Data Model

Three collections. Ownership is hierarchical: a **Card** belongs to a **Deck**,
which belongs to a **User**. Cards have no direct `ownerId` — they are
authorized transitively through their parent deck.

```mermaid
erDiagram
    USER ||--o{ DECK : owns
    DECK ||--o{ CARD : contains

    USER {
        ObjectId _id
        string email "unique, lowercased, indexed"
        string displayName
        string passwordHash "select:false, bcrypt cost 12"
        date createdAt
        date updatedAt
    }
    DECK {
        ObjectId _id
        ObjectId ownerId "ref User, indexed"
        string title
        string description "default empty"
        date createdAt
        date updatedAt
    }
    CARD {
        ObjectId _id
        ObjectId deckId "ref Deck, indexed"
        string front "LaTeX allowed, stored as-is"
        string back "LaTeX allowed, stored as-is"
        number order "stable creation order"
        date createdAt
        date updatedAt
    }
```

### Ownership & authorization (the chokepoint)

```mermaid
graph TB
    subgraph "Deck access"
        GDU["getDeckForUser(deckId, userId)<br/>findOne({_id, ownerId})"]
        GDU -->|not found / not owned| NF1["throw NotFoundError (404)"]
        GDU -->|owned| OK1["deck"]
    end

    subgraph "Card access (transitive)"
        GCU["getCardForUser(cardId, userId)"]
        GCU --> FC["Card.findById"]
        FC -->|missing| NF2["throw NotFoundError"]
        FC -->|found| GDU2["getDeckForUser(card.deckId, userId)"]
        GDU2 -->|not owned| NF2
        GDU2 -->|owned| OK2["card"]
    end

    style GDU fill:#e6f4ea,stroke:#34a853
    style GDU2 fill:#e6f4ea,stroke:#34a853
```

> Cross-user access always returns **404, not 403** — existence is never
> disclosed. All deck/card reads, updates, and deletes funnel through
> `getDeckForUser`, so authorization can't be bypassed by a thin controller.

### Cascade deletes (transactional)

```mermaid
flowchart TB
    subgraph DeleteDeck["deleteDeck(deckId, userId)"]
        D1["getDeckForUser (authorize)"] --> D2{"transaction<br/>supported?"}
        D2 -->|"yes (Atlas replica set)"| D3["session.withTransaction:<br/>Card.deleteMany + Deck.deleteOne"]
        D2 -->|"no (test standalone)"| D4["sequential deletes (fallback)"]
    end

    subgraph DeleteAccount["deleteAccount(userId)"]
        A1["gather user's deckIds"] --> A2{"transaction?"}
        A2 -->|"yes"| A3["Card.deleteMany(in deckIds)<br/>+ Deck.deleteMany(owner)<br/>+ User.deleteOne"]
        A2 -->|"no"| A4["sequential fallback"]
    end
```

---

## 6. Frontend Architecture

Feature-based React SPA. **TanStack Query** owns server state (caching,
invalidation); **AuthContext** (sourced from the `/me` query) drives route
guards. UI primitives come from **Base UI** (note: the `render`-prop pattern,
not Radix's `asChild`). Forms use React Hook Form + the **shared Zod schemas**.

```mermaid
graph TB
    Main["main.jsx<br/>initSentry()"] --> App

    subgraph App["App.jsx (providers)"]
        EB["Sentry.ErrorBoundary"]
        QC["QueryClientProvider"]
        AP["AuthProvider"]
        RP["RouterProvider"]
        TO["Toaster"]
        EB --> QC --> AP --> RP
        AP --> TO
    end

    subgraph Features["features/"]
        AuthF["auth/<br/>api · AuthContext · guards · pages"]
        DecksF["decks/<br/>api · list · detail · form"]
        CardsF["cards/<br/>api · editor · item"]
        StudyF["study/<br/>useStudySession · CardFace"]
        AcctF["account/<br/>api · AccountPage"]
    end

    subgraph Shared["lib + components"]
        ApiClient["lib/api-client<br/>(fetch, credentials:include)"]
        QClient["lib/query-client"]
        Latex["components/LatexRenderer<br/>(KaTeX)"]
    end

    RP --> Features
    Features --> ApiClient
    Features --> Latex
    QC --> QClient

    style Shared fill:#e8f0fe,stroke:#4285f4
```

### Routing & guards

```mermaid
graph TB
    Root["/"] --> Landing["LandingPage<br/>(redirect by auth)"]

    subgraph Public["RedirectIfAuth (bounce logged-in → /decks)"]
        Login["/login"]
        Signup["/signup"]
    end

    subgraph Protected["RequireAuth (bounce logged-out → /login)"]
        subgraph Shell["AppShell (header chrome)"]
            Decks["/decks"]
            Detail["/decks/:id"]
            Account["/account"]
        end
        Study["/decks/:id/study<br/>(full-screen, outside shell)"]
    end

    NotFound["* → NotFoundPage"]
```

### Server-state flow (TanStack Query)

```mermaid
sequenceDiagram
    participant UI as Component
    participant Q as TanStack Query
    participant AC as api-client
    participant API as Express /api

    UI->>Q: useDeck(id) / useCreateCard(...)
    Q->>AC: api.get/post(...)
    AC->>API: fetch(credentials:'include')
    API-->>AC: JSON (or ApiError on !ok)
    AC-->>Q: data / throws ApiError
    Q-->>UI: { data, isLoading, isError }
    Note over Q: mutations invalidate<br/>['decks', id] & ['decks']<br/>→ cardCount + lists refresh
```

---

## 7. LaTeX Rendering Pipeline

The app's core purpose. Card faces mix plain text and LaTeX; the renderer
tokenizes `$...$` (inline) and `$$...$$` (block), runs KaTeX with
`throwOnError:false` and `trust:false`, and degrades gracefully on malformed
input. Plain text is React-escaped (XSS-safe); only KaTeX's own output uses
`dangerouslySetInnerHTML`.

```mermaid
flowchart TB
    In["card.front / card.back (string)"] --> Split1["split on $$...$$ (block)"]
    Split1 --> Loop{"for each part"}
    Loop -->|block| KB["KaTeX displayMode=true"]
    Loop -->|else| Split2["split on $...$ (inline)"]
    Split2 --> Loop2{"for each seg"}
    Loop2 -->|inline| KI["KaTeX displayMode=false"]
    Loop2 -->|plain| TXT["React text node (escaped)"]
    KB --> Out["rendered nodes"]
    KI --> Out
    TXT --> Out
    KB -. "malformed" .-> Err["error node / red fallback<br/>(no crash, REQ-STUDY-006)"]
    KI -. "malformed" .-> Err
    Err --> Out

    style KB fill:#fce8e6,stroke:#ea4335
    style KI fill:#fce8e6,stroke:#ea4335
```

---

## 8. Study Mode State Machine

`useStudySession` manages a session over the deck's ordered cards: front-first,
flip to reveal, navigate (buttons / arrow keys / swipe), and a completion view.

```mermaid
stateDiagram-v2
    [*] --> ShowingFront
    ShowingFront --> ShowingBack : flip (tap/space/enter)
    ShowingBack --> ShowingFront : flip
    ShowingFront --> ShowingFront : prev (resets to front)
    ShowingBack --> ShowingFront : next (not last)
    ShowingFront --> ShowingFront : next (not last)
    ShowingBack --> Completed : next on last card
    ShowingFront --> Completed : next on last card
    Completed --> ShowingFront : restart
    Completed --> [*] : exit → deck detail
```

---

## 9. Deployment Topology

Single-service: one Railway container builds the client (`vite build`) and runs
Express, which serves `client/dist` + the API on one origin. Atlas (replica
set) enables real transactions for cascade deletes.

```mermaid
graph TB
    subgraph CI["Local (pre-push)"]
        Hooks["lint-staged + npm test"]
    end

    Git["git push main"] --> RW

    subgraph RW["Railway"]
        direction TB
        Build["npm install →<br/>npm run build (vite)"]
        Run["npm start →<br/>node --import instrument.js server.js"]
        Build --> Run
        Run --> Listen["listen on $PORT (injected)"]
    end

    Hooks --> Git
    Listen -- "Mongoose/TLS" --> Atlas[("MongoDB Atlas M0")]
    Run -- "errors" --> SN["Sentry (Node)"]
    Build -. "VITE_SENTRY_DSN baked in" .-> Bundle["client/dist"]
    Bundle -- "render crashes" --> SR["Sentry (React)"]
```

### Environment variables

```mermaid
graph LR
    subgraph Runtime["Runtime (server)"]
        NE["NODE_ENV=production"]
        MU["MONGODB_URI"]
        JS["JWT_SECRET (≥32)"]
        FO["FRONTEND_ORIGIN"]
        SD["SENTRY_DSN"]
        PT["PORT (injected by Railway)"]
    end
    subgraph BuildTime["Build-time (Vite, baked into bundle)"]
        VS["VITE_SENTRY_DSN"]
        VA["VITE_API_BASE_URL (empty = same-origin)"]
    end
```

---

## 10. Cross-Cutting Concerns

| Concern              | Implementation                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| **Validation**       | Shared Zod schemas (`@flashcards/shared`) — identical on client & server   |
| **AuthN**            | JWT in HttpOnly/Secure/SameSite=Lax cookie; bcrypt (cost 12)               |
| **AuthZ**            | Ownership enforced in services; `getDeckForUser` chokepoint; 404-not-403   |
| **Errors**           | `AppError` subclasses → centralized handler → uniform JSON, no stack leaks |
| **Rate limiting**    | Global (`/api`) + strict auth limiter (5/15min)                            |
| **Security headers** | helmet + CORS (`FRONTEND_ORIGIN` allowlist)                                |
| **Logging**          | Pino (JSON in prod), with secret redaction                                 |
| **Observability**    | Sentry (Node + React), `--import` preload for instrumentation              |
| **Atomicity**        | Transactions for cascade deletes (replica set), standalone fallback        |
| **Testing**          | Mocha + Supertest (server) · Vitest + RTL (client)                         |
