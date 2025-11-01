# Smart Chat Hub

Smart Chat Hub is a Next.js 16 application that delivers a modern, real-time chatting experience inspired by V.CONNECT. It combines authenticated access, AI-powered conversation insights, and Socket.IO live messaging into a glassmorphism-styled interface optimised for desktop and mobile.

## Key Features

- **Authentication & Authorization** – JWT-protected API routes for login, registration, and logout.
- **Real-Time Messaging** – Socket.IO keeps conversations in sync across connected clients.
- **AI Insights** – Summaries and sentiment analysis generated via OpenAI for each conversation.
- **Responsive UI** – Tailored layouts for both large screens and handheld devices using the App Router.

---

## Prerequisites

- **Node.js** 18.17 or higher (Next.js 16 requirement)
- **npm** 9+ (or pnpm / yarn / bun if you prefer)
- **PostgreSQL** 13+ (Supabase or self-hosted)
- **OpenAI API Key** with access to the specified model (defaults to `gpt-4o-mini`)

---

## Environment Variables

Create a `.env.local` (or `.env`) file in the project root with the following entries:

```
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<database>
JWT_SECRET=super-secret-string
OPENAI_API_KEY=sk-...
# Optional overrides
OPENAI_SUMMARY_MODEL=gpt-4o-mini
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

**Notes**

- `DATABASE_URL` should use SSL if required by your provider (the default pool configuration is set to `rejectUnauthorized: false`). 
- Update `NEXT_PUBLIC_SOCKET_URL` when deploying behind a custom domain.

---

## Database Setup

The application expects three core tables. Use the following schema as a baseline (adjust types or extensions as needed by your environment):

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE insights (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(100) NOT NULL,
  summary TEXT,
  sentiment VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Supabase users: run these in the SQL editor and confirm Row Level Security policies as appropriate for your setup.

---

## Installation & Local Development

```bash
# Clone and install
git clone <repository-url>
cd smart-chat-hub
npm install

# Run the combined Next.js + Socket.IO development server
npm run dev
```

By default the app will be available at [http://localhost:3000](http://localhost:3000). The `npm run dev` script starts `server.js`, which wraps Next.js in a Node HTTP server and attaches Socket.IO. Hot reloading works for both the front-end and API routes.

### Production Build

```bash
npm run build     # Compile the Next.js app
npm run start     # Start the production server (also via server.js)
```

Ensure environment variables are configured in your hosting environment before running `npm run start`.

---

## Available npm Scripts

| Script         | Description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| `npm run dev`  | Starts the custom server with hot reload and Socket.IO for development           |
| `npm run build`| Builds the Next.js app for production                                            |
| `npm run start`| Launches the compiled app with the same Socket.IO-aware server used in `dev`     |

---

## API Reference

All endpoints are served under the `/api` namespace. Authenticated routes expect a `Bearer <JWT>` token in the `Authorization` header. Example base URL in development: `http://localhost:3000/api`.

### Authentication

#### `POST /auth/register`
- **Description:** Create a new user account.
- **Body:**  
  ```json
  { "name": "Alex Morgan", "email": "alex@example.com", "password": "secret123" }
  ```
- **Success (200):**  
  ```json
  { "user": { "id": 1, "name": "Alex Morgan", "email": "alex@example.com" }, "message": "User registered" }
  ```
- **Common errors:** `400 Missing fields`, `409 Email already taken`.

#### `POST /auth/login`
- **Description:** Authenticate and retrieve a JWT token.
- **Body:**  
  ```json
  { "email": "alex@example.com", "password": "secret123" }
  ```
- **Success (200):**  
  ```json
  { "token": "<jwt>", "user": { "id": 1, "email": "alex@example.com" } }
  ```
- **Common errors:** `400 Missing fields`, `401 Invalid email or password`.

#### `POST /auth/logout`
- **Description:** Soft logout endpoint. It verifies the token (if provided) and always responds with success to simplify client handling.
- **Headers:** Optional `Authorization: Bearer <jwt>`.
- **Success (200):**  
  ```json
  { "success": true, "message": "Logout successful" }
  ```

### User Directory

#### `GET /users`
- **Description:** Return all teammates except the requesting user.
- **Headers:** `Authorization: Bearer <jwt>` (required).
- **Success (200):**  
  ```json
  { "users": [ { "id": 2, "name": "Jordan", "email": "jordan@example.com" }, ... ] }
  ```
- **Errors:** `401 Unauthorized`, `500 Failed to load users`.

### Messaging

#### `POST /messages/sendmsg`
- **Description:** Send a direct message to another user.
- **Headers:** `Authorization: Bearer <jwt>` (required).
- **Body:**  
  ```json
  { "receiver_id": 2, "text": "Hello there!" }
  ```
- **Success (200):**  
  ```json
  { "message": { "id": 10, "sender_id": 1, "receiver_id": 2, "text": "Hello there!", "timestamp": "2024-06-10T12:30:00Z" } }
  ```
- **Errors:** `400 Missing fields`, `401 Unauthorized`, `500 Server error`.

#### `POST /messages/chathistory`
- **Description:** Fetch chronological messages between the current user and a teammate.
- **Headers:** `Authorization: Bearer <jwt>` (required).
- **Body:**  
  ```json
  { "withUserId": 2 }
  ```
- **Success (200):**  
  ```json
  { "messages": [ { "id": 7, "sender_id": 1, "receiver_id": 2, "text": "Hey!", "timestamp": "..." }, ... ] }
  ```
- **Errors:** `400 Missing chat partner ID`, `401 Unauthorized`, `500 Server error`.

### Insights

#### `POST /insights/generate`
- **Description:** Generate (or retrieve a cached) five-word summary and sentiment for a conversation using OpenAI.
- **Headers:** `Authorization: Bearer <jwt>` (required).
- **Body:**  
  ```json
  { "withUserId": 2 }
  ```
- **Success (200):**  
  ```json
  {
    "ok": true,
    "conversationId": "1:2",
    "summary": "Budget update looks positive",
    "sentiment": "positive",
    "cached": false
  }
  ```
  Subsequent requests return the same shape with `"cached": true`.
- **Errors:** `400 Missing chat partner ID`, `401 Unauthorized`, `500 Insights service is not configured`, `502 Unable to generate insight`.

---

## Real-Time Messaging

The project’s `server.js` bootstraps a custom HTTP server that attaches Socket.IO via `lib/socketServer.js`. Clients connect with the `NEXT_PUBLIC_SOCKET_URL` value and emit/receive `send-message` / `receive-message` events to stay in sync. When scaling horizontally, ensure the Socket.IO instance is clustered (e.g., Redis adapter) so every node receives the same events.

---

## Troubleshooting

- **401 responses** usually indicate a missing or expired JWT. Ensure the client includes `Authorization: Bearer <token>` in protected calls.
- **OpenAI errors** (`500` or `502`) typically mean the API key is absent, invalid, or the model is unavailable. Check environment variables and OpenAI usage quotas.
- **Database SSL issues** can be caused by local PostgreSQL installs that disallow SSL; adjust the `ssl` config in `db/index.js` if needed.

---

