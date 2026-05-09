# ♠ OpenSpades — Judgment Card Game

Multiplayer Judgment (Estimation) for your hostel batch.  
**Up to 7 players · real-time WebSockets · group voice chat · no login needed**

---

## How to play

| Thing | Rule |
|---|---|
| Rounds | Round 1 = 1 card each → Round 2 = 2 cards each → … |
| Trump (Joker suit) | One random suit picked fresh each round. Beats everything |
| Lead suit | First card played sets the lead suit. You **must** follow it if you can |
| Can't follow? | Play trump or any card (it won't win though) |
| Trick winner | Highest trump wins. No trump? Highest lead-suit card wins. Tie? First played wins |
| Bidding | Before each round, every player bids 0–N (how many tricks they'll win) |
| Score — success | `10 × bid + overtricks` |
| Score — fail | `−10 × shortfall` |
| Bid 0, win 0 | `+10` bonus |

---

## Quick start (local)

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
# Start server with WebSocket support:
.venv/bin/daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Frontend
```bash
cd frontend
npm install
# set your Agora App ID for voice (see below)
npm run dev   # → http://localhost:3000
```

### Voice chat setup (free, 2 min)
1. Sign up at **https://console.agora.io** — free, no credit card
2. Create a project → copy the **App ID**
3. In `frontend/.env.local` set:
   ```
   NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
   ```
4. Restart frontend → everyone in a room can hear each other, with mute toggle

> Voice works in Agora testing mode (no token), which is fine forever for a private group.

---

## Free deployment (public URL for the batch)

### Backend → Render.com (free tier)
1. Push this repo to GitHub
2. Go to **render.com** → New → Web Service → connect your repo
3. Set root directory to `backend`
4. Build command: `pip install -r requirements.txt && python manage.py migrate --no-input`
5. Start command: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
6. Add these env vars in Render dashboard:
   - `SECRET_KEY` — any random string
   - `DEBUG` → `False`
   - `ALLOWED_HOSTS` → `*`
   - `CORS_ALLOW_ALL_ORIGINS` → `True`
   - `DATABASE_URL` — your Supabase connection string (see below)

### Database → Supabase (free PostgreSQL)
1. Go to **supabase.com** → New project
2. Settings → Database → Connection string → **URI** mode
3. Copy the URL and paste it as `DATABASE_URL` in Render

### Frontend → Vercel (free)
1. Go to **vercel.com** → New Project → import your repo
2. Set root directory to `frontend`
3. Add env vars:
   - `NEXT_PUBLIC_API_URL` → `https://your-render-app.onrender.com`
   - `NEXT_PUBLIC_WS_URL` → `wss://your-render-app.onrender.com`
   - `NEXT_PUBLIC_AGORA_APP_ID` → your Agora App ID
4. Deploy → share the Vercel URL with the batch

---

## Project layout

```
OpenSpades/
├── backend/
│   ├── game/
│   │   ├── models.py     — Game, Player, Round, Trick, TrickCard
│   │   ├── engine.py     — deal, determine_winner, calculate_round_scores
│   │   ├── consumers.py  — WebSocket game loop
│   │   └── views.py      — create/join REST endpoints
│   └── config/           — Django settings, ASGI, URLs
└── frontend/
    ├── app/
    │   ├── page.tsx          — Name entry (no login)
    │   ├── lobby/page.tsx    — Create / join room
    │   └── game/[code]/      — Live game board
    └── components/
        ├── GameBoard.tsx     — Main table, hand, turn logic
        ├── Card.tsx          — Animated playing card
        ├── BidPanel.tsx      — Bid picker
        ├── Scoreboard.tsx    — Live scores sidebar
        ├── RoundSummary.tsx  — End-of-round overlay
        ├── TrumpIndicator.tsx
        └── VoiceChat.tsx     — Agora RTC voice room
```

---

## Tech
- **Backend** — Django 4.2, Django Channels (WebSockets), DRF, Daphne ASGI
- **Frontend** — Next.js 15, Tailwind CSS, Framer Motion
- **Voice** — Agora RTC SDK (free 10 000 min/month)
- **DB** — SQLite (dev) / Supabase PostgreSQL (prod)
- **Deploy** — Render (backend) + Vercel (frontend), both free tier
