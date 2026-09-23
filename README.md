# Horas: time tracking for small teams

A minimalist web app to track how much time each person spends on each project: a timer that floats over your other apps, weekly views, and metrics. It's built for a small team running several projects in parallel.

> **Status:** batch 2 of 4 (sign-in, workspace access, admin panel). The timer, weekly view and metrics land in the next batches.

## Quick path

1. Install dependencies: `pnpm install`.
2. Create a free [Neon](https://neon.com) project in **AWS US East 1**, next to Vercel's default region. Copy the pooled and direct connection strings.
3. Create `.env.local` from the [template below](#environment-variables).
4. Create the tables: `pnpm db:migrate`.
5. Start the app: `pnpm dev`, then open <http://localhost:3000> and continue with Google. The people listed in `ADMIN_EMAILS` enter as admins; the first one creates the workspace.
6. Verify: `pnpm lint && pnpm typecheck && pnpm test`.

## How access works

| Who | What happens on sign-in |
| --- | --- |
| Email in `ADMIN_EMAILS` | Active admin of the workspace (created by the first one to sign in) |
| Email invited from **Admin → Members** | Active member with the invited role, immediately |
| Anyone else | A pending request. They see nothing until an admin approves it |

Access is checked on the server for every request (`lib/dal.ts`), never only in the UI.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, strict TypeScript |
| Styling | Tailwind CSS v4, CSS-first tokens in `app/globals.css` |
| i18n | next-intl, a single locale (`es-AR`) with no URL prefix |
| Icons | lucide-react |
| Tests | Vitest (unit) and Playwright (end-to-end) |
| Data | PostgreSQL on Neon, Prisma 7 with the Neon driver adapter |
| Auth | Better Auth with Google, sessions in the database |

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` / `pnpm lint:fix` | ESLint (flat config) |
| `pnpm typecheck` | Generates route types, then runs `tsc --noEmit` |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm db:migrate` | Applies pending migrations to the database in `.env.local` |
| `pnpm db:migrate:dev` | Creates a new migration from `prisma/schema.prisma` (development) |
| `pnpm db:studio` | Opens Prisma Studio |
| `pnpm noise` | Rebuilds the grain textures in `public/` |

## Environment variables

Create `.env.local` in the project root. It's git-ignored; never commit real values.

```bash
# Database (Neon Postgres)
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require"   # pooled, used by the app
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DB?sslmode=require" # direct, used by migrations

# Better Auth
BETTER_AUTH_SECRET=""                    # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"  # must match the origin registered in Google Cloud

# Google OAuth (Google Auth Platform > Clients > Web application)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Comma-separated emails that become workspace admins on first sign-in
ADMIN_EMAILS="admin1@gmail.com,admin2@gmail.com"
```

## Google sign-in setup

1. In [Google Cloud Console](https://console.cloud.google.com), create a project and open **Google Auth Platform**.
2. Register the app. Choose **External** as the audience, and add every team member's email under **Audience → Test users**.
3. Under **Clients**, create a **Web application** client:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the client secret right away: Google shows it only once. Put the ID and secret in `.env.local`.
5. For production, add the deployed origin and `https://<domain>/api/auth/callback/google`, and set `BETTER_AUTH_URL` to that domain.

## End-to-end tests

Playwright browsers aren't downloaded automatically. Install Chromium once, then run the suite:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Where things live

| Path | Holds |
| --- | --- |
| `app/` | Routing only: pages, layouts, route handlers |
| `features/<feature>/` | Everything for one feature: components, actions, queries, schemas |
| `components/common/` | Domain-free UI primitives (e.g. `RadioGroup`) |
| `components/global/` | App chrome (navigation, shell) |
| `lib/` | Cross-cutting helpers that never mention a business entity |
| `messages/` | All UI copy, one file per locale |
| `e2e/` | Playwright specs |
| `openspec/changes/time-tracking-mvp/` | Product discovery and technical decision records |

Conventions for contributors (human or AI) are in [AGENTS.md](AGENTS.md).
