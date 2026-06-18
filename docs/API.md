# Equation Flashcards — API Reference

Base URL (production): `https://equation-flashcards-production.up.railway.app`
Base path: `/api`

## Conventions

- **Content-Type:** `application/json` for all request bodies.
- **Authentication:** JWT stored in an **HttpOnly cookie** named `token`
  (`Secure` in production, `SameSite=Lax`). Send credentials with every
  request (`fetch(..., { credentials: 'include' })`). There is **no**
  `Authorization` header.
- **Success bodies** return the resource directly (e.g. `{ "user": {...} }`,
  `{ "decks": [...] }`). There is no `success`/`data` envelope.
- **Error bodies** share one shape:
  ```json
  { "error": { "code": "STRING_CODE", "message": "Human readable", "details": [ ... ] } }
  ```
  `details` is present only for validation errors.
- **Ownership:** accessing another user's resource returns `404 NOT_FOUND`
  (never `403`) — existence is not disclosed.

### Common Error Codes

| Status | Code                    | Meaning                                                 |
| ------ | ----------------------- | ------------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | Request body failed Zod validation (includes `details`) |
| `401`  | `UNAUTHENTICATED`       | Missing/invalid auth cookie, or bad credentials         |
| `404`  | `NOT_FOUND`             | Resource does not exist or is not owned by the user     |
| `409`  | `CONFLICT`              | Uniqueness/limit conflict (e.g. duplicate email)        |
| `429`  | `RATE_LIMITED`          | Too many requests                                       |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error                                 |

---

## Health

### Health Check

| Field            | Value                                              |
| ---------------- | -------------------------------------------------- |
| **Endpoint**     | `GET /api/health`                                  |
| **Description**  | Liveness probe (used by the platform health check) |
| **Auth**         | None                                               |
| **Content-Type** | —                                                  |

#### Success Responses

| Status   | Body                                                          |
| -------- | ------------------------------------------------------------- |
| `200 OK` | `{ "status": "ok", "timestamp": "string", "uptime": number }` |

```json
{ "status": "ok", "timestamp": "2026-06-18T12:31:00.000Z", "uptime": 1234.56 }
```

---

## Authentication

### Sign Up

| Field            | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| **Endpoint**     | `POST /api/auth/signup`                                |
| **Description**  | Register a new user and log them in (sets auth cookie) |
| **Auth**         | None                                                   |
| **Content-Type** | `application/json`                                     |
| **Rate limit**   | 5 requests / 15 min per IP                             |

#### Request

| Field         | Type   | Required | Rules                                   |
| ------------- | ------ | -------- | --------------------------------------- |
| `email`       | string | Yes      | Valid email format; stored lowercased   |
| `displayName` | string | Yes      | 1–`MAX_DISPLAY_NAME_LENGTH` chars       |
| `password`    | string | Yes      | ≥8 chars, contains a letter and a digit |

```json
{
  "email": "user@example.com",
  "displayName": "Ada",
  "password": "correcthorse9"
}
```

#### Success Responses

| Status        | Body                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `201 Created` | `{ "user": { "id": "string", "email": "string", "displayName": "string" } }` — sets `token` HttpOnly cookie |

```json
{
  "user": {
    "id": "69fd40c5b62530ecf1f3608b",
    "email": "user@example.com",
    "displayName": "Ada"
  }
}
```

#### Error Responses

| Status | Code                    | Description              |
| ------ | ----------------------- | ------------------------ |
| `400`  | `VALIDATION_ERROR`      | Zod validation failed    |
| `409`  | `CONFLICT`              | Email already registered |
| `429`  | `RATE_LIMITED`          | Too many auth attempts   |
| `500`  | `INTERNAL_SERVER_ERROR` | Server error             |

---

### Log In

| Field            | Value                                                     |
| ---------------- | --------------------------------------------------------- |
| **Endpoint**     | `POST /api/auth/login`                                    |
| **Description**  | Verify credentials and start a session (sets auth cookie) |
| **Auth**         | None                                                      |
| **Content-Type** | `application/json`                                        |
| **Rate limit**   | 5 requests / 15 min per IP                                |

#### Request

| Field      | Type   | Required | Rules              |
| ---------- | ------ | -------- | ------------------ |
| `email`    | string | Yes      | Valid email format |
| `password` | string | Yes      | Non-empty          |

```json
{
  "email": "user@example.com",
  "password": "correcthorse9"
}
```

#### Success Responses

| Status   | Body                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `200 OK` | `{ "user": { "id": "string", "email": "string", "displayName": "string" } }` — sets `token` HttpOnly cookie |

#### Error Responses

| Status | Code                    | Description                                               |
| ------ | ----------------------- | --------------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | Zod validation failed                                     |
| `401`  | `UNAUTHENTICATED`       | Invalid email or password (generic — no field disclosure) |
| `429`  | `RATE_LIMITED`          | Too many auth attempts                                    |
| `500`  | `INTERNAL_SERVER_ERROR` | Server error                                              |

> The `401` message is always `"Invalid email or password."` for both an
> unknown email and a wrong password, to prevent user enumeration.

---

### Log Out

| Field            | Value                         |
| ---------------- | ----------------------------- |
| **Endpoint**     | `POST /api/auth/logout`       |
| **Description**  | Clear the auth cookie         |
| **Auth**         | None (no-op if not logged in) |
| **Content-Type** | —                             |

#### Success Responses

| Status           | Body                              |
| ---------------- | --------------------------------- |
| `204 No Content` | _(empty)_ — clears `token` cookie |

---

### Current User

| Field            | Value                                   |
| ---------------- | --------------------------------------- |
| **Endpoint**     | `GET /api/auth/me`                      |
| **Description**  | Return the currently authenticated user |
| **Auth**         | Required (cookie)                       |
| **Content-Type** | —                                       |

#### Success Responses

| Status   | Body                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| `200 OK` | `{ "user": { "id": "string", "email": "string", "displayName": "string" } }` |

#### Error Responses

| Status | Code              | Description                    |
| ------ | ----------------- | ------------------------------ |
| `401`  | `UNAUTHENTICATED` | Missing or invalid auth cookie |

---

## Decks

All deck endpoints require authentication (cookie). A deck is always scoped to
its owner; another user's deck returns `404`.

### Create Deck

| Field            | Value                                       |
| ---------------- | ------------------------------------------- |
| **Endpoint**     | `POST /api/decks`                           |
| **Description**  | Create a new deck owned by the current user |
| **Auth**         | Required                                    |
| **Content-Type** | `application/json`                          |

#### Request

| Field         | Type   | Required | Rules                                                  |
| ------------- | ------ | -------- | ------------------------------------------------------ |
| `title`       | string | Yes      | 1–`MAX_DECK_TITLE_LENGTH` chars                        |
| `description` | string | No       | ≤`MAX_DECK_DESCRIPTION_LENGTH` chars; defaults to `""` |

```json
{ "title": "Calculus", "description": "Derivatives & integrals" }
```

#### Success Responses

| Status        | Body                                                                                |
| ------------- | ----------------------------------------------------------------------------------- |
| `201 Created` | `{ "deck": { "id", "title", "description", "createdAt", "updatedAt", "ownerId" } }` |

#### Error Responses

| Status | Code                    | Description                                        |
| ------ | ----------------------- | -------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | Zod validation failed                              |
| `401`  | `UNAUTHENTICATED`       | Not logged in                                      |
| `409`  | `CONFLICT`              | Per-user deck limit reached (`MAX_DECKS_PER_USER`) |
| `500`  | `INTERNAL_SERVER_ERROR` | Server error                                       |

---

### List Decks

| Field            | Value                                                                               |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Endpoint**     | `GET /api/decks`                                                                    |
| **Description**  | List the current user's decks (most recently updated first), each with a card count |
| **Auth**         | Required                                                                            |
| **Content-Type** | —                                                                                   |

#### Success Responses

| Status   | Body                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| `200 OK` | `{ "decks": [ { "id", "title", "description", "cardCount", "createdAt", "updatedAt" } ] }` |

```json
{
  "decks": [
    {
      "id": "69fd40c5b62530ecf1f3608b",
      "title": "Calculus",
      "description": "Derivatives & integrals",
      "cardCount": 12,
      "createdAt": "2026-05-08T01:47:49.450Z",
      "updatedAt": "2026-05-08T01:47:49.450Z"
    }
  ]
}
```

#### Error Responses

| Status | Code              | Description   |
| ------ | ----------------- | ------------- |
| `401`  | `UNAUTHENTICATED` | Not logged in |

---

### Get Deck (with cards)

| Field            | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| **Endpoint**     | `GET /api/decks/:id`                                        |
| **Description**  | Get a single deck and its cards (ordered by creation order) |
| **Auth**         | Required                                                    |
| **Content-Type** | —                                                           |

#### Path Parameters

| Param | Type   | Rules                          |
| ----- | ------ | ------------------------------ |
| `id`  | string | Must be a valid Mongo ObjectId |

#### Success Responses

| Status   | Body                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `200 OK` | `{ "deck": { "id", "title", "description", ... }, "cards": [ { "id", "front", "back", "order", ... } ] }` |

#### Error Responses

| Status | Code              | Description                                |
| ------ | ----------------- | ------------------------------------------ |
| `401`  | `UNAUTHENTICATED` | Not logged in                              |
| `404`  | `NOT_FOUND`       | Deck not found, not owned, or malformed id |

---

### Update Deck

| Field            | Value                                    |
| ---------------- | ---------------------------------------- |
| **Endpoint**     | `PATCH /api/decks/:id`                   |
| **Description**  | Update a deck's title and/or description |
| **Auth**         | Required                                 |
| **Content-Type** | `application/json`                       |

#### Path Parameters

| Param | Type   | Rules                |
| ----- | ------ | -------------------- |
| `id`  | string | Valid Mongo ObjectId |

#### Request

| Field         | Type   | Required | Rules                                |
| ------------- | ------ | -------- | ------------------------------------ |
| `title`       | string | No\*     | 1–`MAX_DECK_TITLE_LENGTH` chars      |
| `description` | string | No\*     | ≤`MAX_DECK_DESCRIPTION_LENGTH` chars |

> \* All fields optional, but **at least one** must be provided.

#### Success Responses

| Status   | Body                                                |
| -------- | --------------------------------------------------- |
| `200 OK` | `{ "deck": { "id", "title", "description", ... } }` |

#### Error Responses

| Status | Code               | Description                                  |
| ------ | ------------------ | -------------------------------------------- |
| `400`  | `VALIDATION_ERROR` | Validation failed, or empty body (no fields) |
| `401`  | `UNAUTHENTICATED`  | Not logged in                                |
| `404`  | `NOT_FOUND`        | Deck not found, not owned, or malformed id   |

---

### Delete Deck

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| **Endpoint**     | `DELETE /api/decks/:id`                        |
| **Description**  | Delete a deck and cascade-delete all its cards |
| **Auth**         | Required                                       |
| **Content-Type** | —                                              |

#### Path Parameters

| Param | Type   | Rules                |
| ----- | ------ | -------------------- |
| `id`  | string | Valid Mongo ObjectId |

#### Success Responses

| Status           | Body      |
| ---------------- | --------- |
| `204 No Content` | _(empty)_ |

#### Error Responses

| Status | Code              | Description                                |
| ------ | ----------------- | ------------------------------------------ |
| `401`  | `UNAUTHENTICATED` | Not logged in                              |
| `404`  | `NOT_FOUND`       | Deck not found, not owned, or malformed id |

---

## Cards

Card operations are authorized **through the parent deck**: if you don't own
the deck, you get `404`. Cards are created nested under a deck; updates and
deletes target the card directly.

### Create Card

| Field            | Value                           |
| ---------------- | ------------------------------- |
| **Endpoint**     | `POST /api/decks/:deckId/cards` |
| **Description**  | Add a card to a deck you own    |
| **Auth**         | Required                        |
| **Content-Type** | `application/json`              |

#### Path Parameters

| Param    | Type   | Rules                |
| -------- | ------ | -------------------- |
| `deckId` | string | Valid Mongo ObjectId |

#### Request

| Field   | Type   | Required | Rules                                                                         |
| ------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `front` | string | No       | ≤`MAX_CARD_FACE_LENGTH` chars; defaults to `""` (LaTeX allowed, stored as-is) |
| `back`  | string | No       | ≤`MAX_CARD_FACE_LENGTH` chars; defaults to `""` (LaTeX allowed, stored as-is) |

```json
{ "front": "Derivative of $\\sin(x)$?", "back": "$\\cos(x)$" }
```

#### Success Responses

| Status        | Body                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `201 Created` | `{ "card": { "id", "deckId", "front", "back", "order", "createdAt", "updatedAt" } }` |

#### Error Responses

| Status | Code               | Description                                        |
| ------ | ------------------ | -------------------------------------------------- |
| `400`  | `VALIDATION_ERROR` | Validation failed (e.g. face too long)             |
| `401`  | `UNAUTHENTICATED`  | Not logged in                                      |
| `404`  | `NOT_FOUND`        | Deck not found, not owned, or malformed id         |
| `409`  | `CONFLICT`         | Per-deck card limit reached (`MAX_CARDS_PER_DECK`) |

> LaTeX is **not** validated for correctness; malformed LaTeX is persisted
> verbatim and rendered gracefully on the client.

---

### Update Card

| Field            | Value                             |
| ---------------- | --------------------------------- |
| **Endpoint**     | `PATCH /api/cards/:id`            |
| **Description**  | Update a card's front and/or back |
| **Auth**         | Required                          |
| **Content-Type** | `application/json`                |

#### Path Parameters

| Param | Type   | Rules                |
| ----- | ------ | -------------------- |
| `id`  | string | Valid Mongo ObjectId |

#### Request

| Field   | Type   | Required | Rules                         |
| ------- | ------ | -------- | ----------------------------- |
| `front` | string | No\*     | ≤`MAX_CARD_FACE_LENGTH` chars |
| `back`  | string | No\*     | ≤`MAX_CARD_FACE_LENGTH` chars |

> \* All fields optional, but **at least one** must be provided.

#### Success Responses

| Status   | Body                                                            |
| -------- | --------------------------------------------------------------- |
| `200 OK` | `{ "card": { "id", "deckId", "front", "back", "order", ... } }` |

#### Error Responses

| Status | Code               | Description                                            |
| ------ | ------------------ | ------------------------------------------------------ |
| `400`  | `VALIDATION_ERROR` | Validation failed, or empty body                       |
| `401`  | `UNAUTHENTICATED`  | Not logged in                                          |
| `404`  | `NOT_FOUND`        | Card not found, parent deck not owned, or malformed id |

---

### Delete Card

| Field            | Value                   |
| ---------------- | ----------------------- |
| **Endpoint**     | `DELETE /api/cards/:id` |
| **Description**  | Delete a card           |
| **Auth**         | Required                |
| **Content-Type** | —                       |

#### Path Parameters

| Param | Type   | Rules                |
| ----- | ------ | -------------------- |
| `id`  | string | Valid Mongo ObjectId |

#### Success Responses

| Status           | Body      |
| ---------------- | --------- |
| `204 No Content` | _(empty)_ |

#### Error Responses

| Status | Code              | Description                                            |
| ------ | ----------------- | ------------------------------------------------------ |
| `401`  | `UNAUTHENTICATED` | Not logged in                                          |
| `404`  | `NOT_FOUND`       | Card not found, parent deck not owned, or malformed id |

---

## Account

### Delete Account

| Field            | Value                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| **Endpoint**     | `DELETE /api/account`                                                                                    |
| **Description**  | Permanently delete the current user and cascade-delete all their decks and cards; clears the auth cookie |
| **Auth**         | Required                                                                                                 |
| **Content-Type** | —                                                                                                        |

#### Success Responses

| Status           | Body                                                            |
| ---------------- | --------------------------------------------------------------- |
| `204 No Content` | _(empty)_ — clears `token` cookie; account and all data removed |

#### Error Responses

| Status | Code              | Description       |
| ------ | ----------------- | ----------------- |
| `401`  | `UNAUTHENTICATED` | Not logged in     |
| `404`  | `NOT_FOUND`       | Account not found |

---

## Validation Error Shape

`400 VALIDATION_ERROR` responses include a `details` array describing each
failed field:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body failed validation.",
    "details": [
      {
        "path": ["password"],
        "message": "String must contain at least 8 character(s)"
      }
    ]
  }
}
```
