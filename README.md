# SQL-H1

SQL-læringsplatform til H1: teori, praktiske opgaver og egen Postgres-database pr. elev.

## Stack

- **web** — Vite + React (TypeScript), nginx
- **api** — .NET Web API, Mercantec Auth (JWT/JWKS), content-as-code
- **db** — Postgres 16 (platform-DB `sqlh1` + elev-DB’er `s_<hash>`)

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

Redirect-URIs der skal være registreret:

- `http://localhost:5173/auth/callback`
- `http://localhost:3000/auth/callback`
- `https://sqlh1.mercantec.tech/auth/callback`

## Indhold

Markdown under [`content/`](content/):

- `modules.json` — modulkatalog
- `lessons/` — teori
- `exercises/` — opgaver + `checks.json` + `seeds/`

MVP har fuldt indhold for **SELECT** og **DML**. Øvrige målpinde er modul-skaller.

## Deploy (Dokploy)

```bash
docker compose up -d --build
```

Kun `web` eksponeres via Traefik (`sqlh1.mercantec.tech`). Sæt env i Dokploy fra `.env.example`.

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
