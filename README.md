# Idle Minds

A multi-game idle RPG platform built with **Next.js 15** and **Phaser 3**. Hosts browser-based games with optional Clerk authentication and cloud save sync.

## Games

- **Dungeon Crawl** — Build a guild, recruit heroes, run dungeons, send expeditions, and upgrade your hall.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.example` to `.env.local` and set Clerk keys:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Cloud saves use the filesystem under `SAVE_DIR` (default `/data/saves` in Docker).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (copies games to `public/games/` on build) |
| `npm run build` | Production build |
| `npm start` | Run production server |

## Project structure

```
games/              Phaser game source (copied to public/games on build)
src/app/            Next.js App Router — home, /[gameId], auth, save API
src/components/     Shared React components (PhaserGameClient, GameShellHeader)
```

## Save system

- **Guests** — saves in `localStorage`
- **Signed-in users** — cloud saves at `/api/saves/[gameId]/[slot]`
- List slots: `GET /api/saves/[gameId]`

## Docker

```bash
docker build -t idle-minds .
docker run -p 3000:3000 -v idle-saves:/data/saves idle-minds
```

Coolify (GitHub app, Docker Compose build pack): use `/docker-compose.yaml` as the compose path.

Set build arg `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and runtime env vars from `.env.example`. Mount the `saves` volume at `/data` for persistent cloud saves.

## Adding a game

1. Create `games/my-game/` with `manifest.json`, `index.html`, and `js/main.js`
2. The home page auto-discovers games from manifests
3. Play at `/my-game` via the dynamic `[gameId]` route
