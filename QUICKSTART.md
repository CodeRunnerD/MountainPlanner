# MountainPlanner — Quickstart

First-time setup guide to get the local Supabase backend running and the app ready for development.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (recommended) or npm
- [Docker](https://www.docker.com/) (required for local Supabase)

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

The `.env.example` already contains the correct local Supabase keys. You only need to change these if you re-initialize Supabase or switch to a remote project.

## 3. Start Local Supabase

This spins up PostgreSQL, Auth, REST API, Storage, and Studio via Docker:

```bash
pnpm supabase:start
```

Wait until you see the status table with green checkmarks.

**Local endpoints:**
| Service | URL |
|---------|-----|
| API (REST) | http://127.0.0.1:54321 |
| Studio (GUI) | http://127.0.0.1:54323 |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres |

## 4. Apply Migrations & Seed Data

Reset the database (applies all migrations) and then seed it with realistic demo data:

```bash
# Apply schema migrations
pnpm supabase:reset

# Seed with demo users, routes, trips, waypoints, etc.
node scripts/seed-full.js
```

> **Tip:** If you only need minimal seed data (5 users + 4 routes), run `node scripts/seed-database.js` instead.

## 5. Start the Dev Server

```bash
pnpm dev
```

Open http://localhost:3000

## Test Accounts

After seeding, you can log in with these pre-created accounts:

| Email | Password | Role |
|-------|----------|------|
| `carlos@example.com` | `password123` | organizer |
| `ana@example.com` | `password123` | guide |
| `luis@example.com` | `password123` | participant |
| `maria@example.com` | `password123` | participant |
| `pedro@example.com` | `password123` | participant |

## Common Commands

```bash
# Start / stop local Supabase
pnpm supabase:start
pnpm supabase:stop

# Reset DB (migrations only)
pnpm supabase:reset

# Regenerate TypeScript types after schema changes
pnpm db:types

# Seed data
node scripts/seed-full.js

# Dev server
pnpm dev

# Build for production
pnpm build
```

## Troubleshooting

**Port already in use?**
Stop any existing Supabase instances: `pnpm supabase:stop`

**Seeding fails with "User already registered"?**
Run `pnpm supabase:reset` first to clear the database, then seed again.

**Types out of sync?**
After any schema change, run `pnpm db:types` to regenerate `src/types/database.types.ts`.

---

For detailed architecture notes, see the [Obsidian vault](../obsidian-brain/obsidian-brain/MountainPlanner/main/implementation/).
