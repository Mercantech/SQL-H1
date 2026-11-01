# SQL-H1

SQL-læringsplatform til H1: teori, praktiske opgaver og egen Postgres-database pr. elev.

## Raymond — platformens SQL-guide

**Raymond Stonebraker Codd** er den gennemgående elefantprofessor: "Jeg er Professor Codd, men I kan kalde mig Raymond."

- En firetrins rundvisning åbnes fra forsiden, Raymonds hjælp eller elevprofilen. Velkomstinvitationen huskes i denne browser.
- Raymond-knappen følger siderne med emneforklaringer, eksempler, refleksionsspørgsmål og links til PostgreSQLs dokumentation.
- Alle 28 opgaver har tre gradvise hints. Hjælpen ændrer eller kører ikke elevens SQL.
- Editorens ansigtsudtryk følger den faktiske kørsel og opgavekontrol. En vellykket kørsel adskilles fra en bestået opgave.
- Kendte Postgres-fejlkoder forklares med næste skridt. Ukendte fejl får en tydelig generel vejledning. Hjælpen bruger faste faglige forklaringer og kræver ingen AI-tjeneste.

De oprindelige illustrationer og navnets historie findes i [maskotpakken](assets/mascot/professor-pack/README.md). Optimerede WebP-filer ligger i `web/public/raymond/` og indgår direkte i Docker-buildet. De kan genskabes med `python web/scripts/prepare-raymond-assets.py` (Pillow).

Validering fra `web/`: `npm test`, `npm run build` og `npm run lint`. Testene kontrollerer emnedækning, hints til alle opgaver, fejlkoder og runtime-billeder.

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

Hvis en anden lokal tjeneste bruger API-porten, kan Vites udviklingsproxy peges mod en anden adresse med `SQLH1_DEV_API_TARGET` (fx `http://127.0.0.1:3301`). Det påvirker kun lokal udvikling.

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
