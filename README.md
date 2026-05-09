# ♠ OpenSpades

Multiplayer card game (Judgment / Estimation) for your hostel batch.  
**2–7 players · real-time WebSockets · voice chat · felt-green board**

---

## Rules

| Thing | Rule |
|---|---|
| Rounds | Round 1 = 1 card each, Round 2 = 2 cards, … up to `floor(52×decks / players)` |
| Trump | A random suit ("Joker suit") is picked fresh each round |
| Lead suit | You **must** follow the lead suit if you have it |
| Can't follow? | Play trump or anything else |
| Duplicate tie | Two identical cards played → **first played wins** |
| Score (success) | `10 × bid + overtricks` |
| Score (fail) | `−10 × shortfall` |
| Bid 0 & win 0 | `+10` bonus |

---

## Quick Start (local dev — no Docker needed)

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000   # HTTP + WebSocket via Daphne
```

Or with Daphne directly (needed for WebSockets):
```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:3000
```

### Voice Chat (Agora — free tier, 10 000 min/month)
1. Sign up at **https://console.agora.io** (free)
2. Create a project → copy the **App ID**
3. Paste it in `frontend/.env.local`:
   ```
   NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
   ```
4. Restart the frontend — voice is now live in every game room

> Voice works without a token in testing mode (default). For a private group of 7 this is fine forever.

---

## Docker (one command)

```bash
# add your Agora App ID first (optional but recommended)
echo "NEXT_PUBLIC_AGORA_APP_ID=your_id" >> .env

docker compose up --build
# → frontend: http://localhost:3000
# → backend:  http://localhost:8000
```

---

## How to play

1. One person creates a room (choose 1 or 2 decks)
2. Share the 6-letter room code with friends
3. Everyone joins at `http://<your-ip>:3000`
4. Host clicks **Start Game**
5. Each round: bid → play → score
6. Voice chat is live as soon as everyone loads the page

---

## Project Structure

```
OpenSpades/
├── backend/
│   ├── config/          Django project settings + ASGI
│   ├── game/            models, engine, WebSocket consumer, REST API
│   └── accounts/        register / login / logout
└── frontend/
    ├── app/             Next.js App Router pages
    ├── components/      GameBoard, Card, Scoreboard, VoiceChat, …
    └── lib/             api.ts, useGameSocket.ts, types.ts
```

---

## Tech Stack

- **Backend** — Django 4.2, Django Channels (WebSockets), DRF
- **Frontend** — Next.js 15, Tailwind CSS, Framer Motion
- **Voice** — Agora RTC SDK (free tier)
- **DB** — SQLite (dev) — swap to Postgres for prod
