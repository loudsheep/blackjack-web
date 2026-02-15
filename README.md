# Blackjack Web Frontend

A modern, responsive frontend for the Blackjack multiplayer game, built with [Next.js 15](https://nextjs.org/) and Tailwind CSS.

## Features
- Real-time multiplayer gameplay via WebSockets
- Admin panel for game management (kicking players, adjusting limits, modifying specific game rules on the fly)
- Responsive design for mobile and desktop
- Chat system
- Robust error handling and reconnection logic

## Frontend Setup

### 1. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configuration (.env.local)
Create a `.env.local` file in the root directory to configure the connection to your backend.

```env
# URL of the Blackjack Backend WebSocket Server
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:3000/ws

# URL of the Blackjack Backend REST API (to create games, etc.)
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001

# Timeout for player turns in seconds (used for UI progress bar visualization)
NEXT_PUBLIC_TURN_TIMEOUT_SECONDS=30

# WebSocket ping interval in milliseconds to keep connection alive
NEXT_PUBLIC_PING_INTERVAL_MS=5000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

# Backend Documentation (Reference)

Below is the documentation for the backend server that this frontend is designed to interact with.

## Blackjack Backend

A robust, real-time multiplayer Blackjack game server written in Rust. This backend powers the game logic, state management, and communication for a Blackjack platform.

### Tech Stack
*   **Language:** Rust (2021 Edition)
*   **Framework:** Axum (Web & WebSockets)
*   **Runtime:** Tokio
*   **Serialization:** Serde JSON

### Setup & Running

1.  **Clone & Run:**
    ```bash
    cargo run
    ```
    Server starts at `http://127.0.0.1:3000`.

2.  **Configuration (.env):**
    ```env
    APP_ADDRESS=0.0.0.0:3000
    RUST_LOG=blackjack_backend=debug
    ```

### Frontend Integration Guide

This backend uses a persistent WebSocket connection. State is authoritative on the server.

#### 1. Game Creation (REST)
**POST** `/game/create`  
Create a new room before connecting.

**Request:**
```json
{
  "settings": {
    "initial_chips": 1000,
    "max_players": 5,
    "deck_count": 6,
    "approval_required": false,
    "chat_enabled": true
  }
}
```

**Response:**
```json
{ "game_id": "849201" }
```

#### 2. Connection & Reconnection (WebSocket)
**Endpoint:** `ws://<host>/ws/<game_id>`

The server supports session persistence. You **must** store the credentials received in `JoinedLobby` to allow players to refresh the page without losing their spot.

*   **New Session:**
    Connect to `ws://localhost:3000/ws/849201`.
*   **Reconnection:**
    Append credentials to the URL:
    `ws://localhost:3000/ws/849201?player_id=<UUID>&secret=<SECRET>`

**Status Codes:**
*   `101`: Connected.
*   `404`: Game not found (ended or wrong ID).
*   `403`: Game is full (and you are not reconnecting).

#### 3. Client Implementation Flow
1.  **Connect** via WebSocket.
2.  If this is a fresh session, send `JoinGame`.
3.  Listen for `JoinedLobby`. **Save `your_id` and `secret` to LocalStorage immediately.**
4.  Listen for `GameStateSnapshot` to render the UI.
5.  On page reload, read LocalStorage. If keys exist, connect using the Reconnection URL.
6.  If reconnection fails (socket closes or Error received), clear LocalStorage and connect normally.

### Protocol Reference

All WebSocket messages are JSON.

#### Data Structures

**Card**
```json
{ "suit": "Hearts", "rank": "Ace" }
```

**Player**
```json
{
  "id": "uuid-string",
  "name": "Alice",
  "chips": 1000,
  "hands": [ ... ],       // See Hand structure
  "active_hand_index": 0, // Index of the hand currently being acted on
  "status": "Playing",    // Spectating, Sitting, Playing, PendingApproval
  "is_admin": true,       // Can perform admin actions
  "is_connected": true    // True if connected, false if offline/disconnected
}
```

**Hand**
```json
{
  "cards": [ { "suit": "Spades", "rank": "Ten" }, ... ],
  "bet": 100,
  "status": "Playing" // Playing, Stood, Busted, Blackjack, Doubled
}
```

**GameSettings**
```json
{
  "initial_chips": 1000,
  "max_players": 5,
  "deck_count": 1,
  "approval_required": false,
  "chat_enabled": true
}
```

#### Client Messages (Send)

Wrap all messages in: `{ "action": "Name", "payload": { ... } }`

| Action | Payload JSON | Description |
| :--- | :--- | :--- |
| **JoinGame** | `{ "username": "Bob" }` | Register as a player. Required if not reconnecting. |
| **PlaceBet** | `{ "amount": 50 }` | Bet chips. Valid only in `Betting` phase. |
| **GameAction** | `{ "action_type": "Hit" }` | Types: `Hit`, `Stand`, `Double`, `Split`. Valid in `Playing` phase. |
| **Chat** | `{ "message": "Hi" }` | Broadcast text to all players. |
| **StartGame** | `null` | **(Admin)** Force start the game or skipped current player turn. |
| **NextRound** | `null` | **(Admin)** Phase: `Payout` -> `Betting`. |
| **ApprovePlayer**| `{ "player_id": "..." }` | **(Admin)** Allow a `PendingApproval` player to join. |
| **KickPlayer** | `{ "player_id": "..." }` | **(Admin)** Remove a player. |
| **UpdateSettings**| `{ "settings": { ... } }` | **(Admin)** Change rules mid-game. |
| **AdminUpdateBalance** | `{ "target_id": "...", "change_chips": 500 }` | **(Admin)** Modify player chips (use negative to deduct). |
| **Ping** | `null` | Check latency/connection. Server replies with `Pong`. |

#### Server Messages (Receive)

Wrapped in: `{ "event": "Name", "data": { ... } }`

*   **GameStateSnapshot**: Sent on any state change.
*   **JoinedLobby**: Sent on successful join/reconnect. Contains credentials.
*   **ChatBroadcast**: New chat message.
*   **PlayerRequest**: Admin notification for approval needed.
*   **Error**: Action failed.
