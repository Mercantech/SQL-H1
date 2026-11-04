# SQL-H1

SQL-læringsplatform til H1: teori, praktiske opgaver og egen Postgres-database pr. elev.

## SQL Murder Mystery — `/murder`

**Mordet på Datatopmødet** er en selvstændig dansk kriminalgåde inspireret af [Knight Labs SQL Murder Mystery](https://mystery.knightlab.com/), med egen historie og egne data. Elever følger sagsrapporter, vidneudsagn, adgangslogs, workshoptilmeldinger, betalinger og beskeder gennem ni relaterede tabeller for at finde både gerningspersonen og bagmanden.

Spillet kører ægte SQLite med `sql.js` i en separat browser-worker og kræver hverken login, en API-forbindelse eller en elevdatabase. WASM-filen leveres med Vite-/Docker-buildet. Data er skrivebeskyttede; SQL-kørsler stoppes efter tre sekunder og store resultater begrænses. SQL, notesbog, de seneste 15 vellykkede forespørgsler og løste trin gemmes lokalt i browseren. Nulstilling gælder kun mysteriet.

De kendte danske IT-profiler optræder i tydeligt fiktive konferenceroller; alle forbrydelser involverer opdigtede personer. Faktakort linker til primære kilder om profilernes virkelige bidrag. Tabeloversigten viser kolonner og relationer, SQL-guiden forklarer SQLite/PostgreSQL-forskellen, og hints afsløres gradvist. Indgangen findes også i navigationen og på forsiden.

En centreret introduktion i tre trin præsenterer sagen, arbejdsformen og det første spor ved første besøg. Derefter fylder SQL-arbejdsbordet fra sidens top. Introduktionen kan åbnes igen fra **Introduktion**, huskes separat fra sagens fremskridt og vises igen efter **Start sagen forfra**. Dialogen holder tastaturfokus, understøtter Escape og bevarer editor, noter og resultater under genåbning.

**Vis databaseskema** åbner et interaktivt ER-diagram med ni tabeller og ni relationer. Valgte tabeller fremhæver forbindelserne og viser kolonner, PK/FK, kardinalitet og den oprindelige, formaterede `CREATE TABLE`. Zoom, tilpasning og en separat tabeloversigt understøtter store og små skærme. `tilmeldinger` viser sin sammensatte primærnøgle, `afhoeringer` vises som 1:1, og `sagsrapporter` står selvstændigt. Skemaet bruger samme metadata og DDL som spillets database; tests sammenligner dem med SQLite. SQL-editoren ændres kun ved et eksplicit valg af **Indsæt SELECT**.

Kør `npm test` fra `web/` for at kontrollere den entydige beviskæde mod rigtig SQLite, SQL-funktioner, skrivebeskyttelse og workerens genstart efter timeout.

## Raymond — platformens SQL-guide

**Raymond Stonebraker Codd** er den gennemgående elefantprofessor: "Jeg er Professor Codd, men I kan kalde mig Raymond."

- En firetrins rundvisning åbnes fra forsiden, Raymonds hjælp eller elevprofilen. Velkomstinvitationen huskes i denne browser.
- Raymond-knappen følger siderne med en AI-samtale samt emneforklaringer, eksempler, refleksionsspørgsmål og links til PostgreSQLs dokumentation.
- Alle 28 opgaver har tre gradvise hints under **Guide** i det flydende Raymond-panel. Teori- og modulindholdet vises uden en ekstra Raymond-boks.
- Editorens ansigtsudtryk følger den faktiske kørsel og opgavekontrol. En vellykket kørsel adskilles fra en bestået opgave.
- Kendte Postgres-fejlkoder forklares med næste skridt. Den faste guide og SQL-hjælp er fortsat tilgængelige uden AI og uden login.

### Raymond AI

Log ind med Mercantec Auth og åbn **Spørg Raymond**. Samtalen bruger OpenAI fra .NET-API'et. Nøglen sættes kun som `OPENAI_API_KEY` i API'ets runtime-miljø, fx Dokploy. Model og svargrænse styres af `OPENAI_MODEL` og `OPENAI_MAX_OUTPUT_TOKENS` (standard: `gpt-5.4-mini`, 1800 outputtokens).

Raymond læser den aktuelle lektion og kan slå op i platformens offentlige teori og opgavetekster. Når eleven vælger **Medtag mit aktuelle SQL-arbejde**, medtages også SQL fra editoren, resultatmetadata, seneste fejl, opgavetjek samt højst fem af elevens egne seneste kørsler og 12 fremgangsposter. Resultatcellernes værdier, elevprofil, andre elevers data og skjulte opgavechecks hentes ikke. Tidligere beskeder kan fortsat indeholde arbejde, som eleven allerede har delt; **Ny samtale** rydder samtalen i browseren.

Samtalen ligger kun i den aktuelle browserfane, adskilt efter bruger. Serveren sender til OpenAI med `store: false` og bruger højst tre Responses-kald pr. spørgsmål til forklaring og skrivebeskyttede pensumopslag. Ingen værktøjer kan køre SQL, ændre data eller godkende opgaver. Eleven får vist, at spørgsmål og valgt kontekst sendes til OpenAI, og kan fravælge aktuelt SQL-arbejde. AI kan tage fejl; de faktiske databasekontroller bestemmer fortsat, om opgaven består.

`POST /api/raymond/chat` kræver en gyldig bruger med GUID-`sub`. Input, kontekststørrelser, svartid og opslag er begrænset. `RAYMOND_REQUESTS_PER_MINUTE` styrer grænsen pr. bruger (standard 12). `GET /api/raymond/status` viser kun, om en servernøgle er konfigureret. Uden en nøgle fungerer resten af platformen fortsat.

Backendregressioner med falsk OpenAI-transport køres med `dotnet run --project api.tests/SqlH1.Api.Tests.csproj`; ingen rigtig nøgle kræves. OpenAI-kontrakten følger [Responses API og function calling](https://developers.openai.com/api/docs/guides/function-calling).

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
