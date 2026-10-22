# SQL-H1

SQL-læringsplatform til H1: teori, praktiske opgaver og egen Postgres-database pr. elev.

## Stack

- **web** — Vite + React (TypeScript), nginx
- **api** — .NET Web API, Mercantec Auth (JWT/JWKS), content-as-code
- **sqlh1-db** — Postgres 16 (platform-DB `sqlh1` + elev-DB’er `s_<hash>`)

## Lokal udvikling

```bash
# Docker (anbefalet)
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build

# Eller hver for sig:
# 1) Start Postgres (fx via compose kun db)
# 2) api: set CONTENT_ROOT til ../content, kør `dotnet run --project api`
# 3) web: `npm install && npm run dev` (proxy /api → :3001)
```

- Web: http://localhost:3000 (Docker) eller http://localhost:5173 (Vite)
- API: http://localhost:3001/api/health

Kopiér [`.env.example`](.env.example) til `.env` ved behov.

## Auth

Mercantec Auth (authorization code + PKCE). SPA-klient `sqlh1`.

OAuth-klient `sqlh1` er oprettet med følgende redirect-URI'er i [Auth Admin → Klienter](https://auth.mercantec.tech/Admin/Clients):

- `http://localhost:5173/auth/callback`
- `http://localhost:3000/auth/callback`
- `https://sql.mercantec.tech/auth/callback`

Prod: https://sql.mercantec.tech (Dokploy compose `SQL-H1` under Hovedforløb Repos).

## Indhold

Markdown under [`content/`](content/):

- `modules.json` — modulkatalog
- `lessons/` — teori
- `exercises/` — opgaver + `checks.json` + `seeds/`

Fuldt indhold: **SELECT** → **DML** → **JOIN** → **relationer** → **constraints** → **DDL/E/R** → **views** → **rettigheder/transaktioner** → **procedures** → **triggers** → **drift** → **ADO.NET** → **Dapper**.

C#-modulerne (ADO.NET/Dapper) har teori med Npgsql-eksempler; elever øver den tilhørende **SQL** i sandboxen (egen DB).

## Deploy (Dokploy)

```bash
docker compose up -d --build
```

Kun `web` eksponeres via Traefik (`sql.mercantec.tech`). Sæt `APP_HOST` og `CORS_ORIGIN` samt øvrige env i Dokploy fra `.env.example`.

## API (uddrag)

| Endpoint | Auth | Formål |
|----------|------|--------|
| `GET /api/health` | nej | Health |
| `POST /api/auth/token` | nej | Token-proxy |
| `GET /api/me` | ja | Profil + sandbox |
| `GET /api/modules` | nej | Moduler |
| `GET /api/content/{slug}` | nej | Lektion/opgave |
| `POST /api/sandbox/provision` | ja | Opret elev-DB |
| `POST /api/sandbox/execute` | ja | Kør SQL |
| `POST /api/sandbox/reset` | ja | Nulstil seed |
| `POST /api/sandbox/check` | ja | Tjek opgave |
| `GET/PUT /api/progress/...` | ja | Fremskridt |
