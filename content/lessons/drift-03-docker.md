---
title: 3. Postgres i Docker Compose (H1)
slug: drift-03-docker
module: drift
order: 3
kind: theory
objectives:
  - Koble SQL-H1 til Docker Compose-tænkning
  - Kende service, volume, env og porte
  - Skelne app-DB, elev-DB og seed
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT current_database(), current_user;
---

# Postgres i Docker Compose (H1)

På H1 kører databasen typisk som en **service** i Docker Compose — samme mønster som SQL-H1 på Dokploy.

## Byggesten

| Begreb | Betydning |
|--------|-----------|
| **Service** `db` | Container med `postgres:16` |
| **Volume** | Disk til datafiler (overlever `docker compose down` uden `-v`) |
| **Env** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| **Netværk** | `api` taler til `db:5432` internt — ikke via localhost fra browser |
| **Port-mapping** | Kun til lokal debug (`5432:5432`) — i prod ofte lukket udadtil |

## Connection string

Appen bruger noget i stil med:

```text
postgres://bruger:kode@db:5432/databasenavn
```

- Host **`db`** = servicenavn på Docker-netværket
- Fra din PC (hvis port er mapped): `localhost:5432`

## SQL-H1’s model

```text
[Browser] → web → api → (admin) opretter elev-database
                      → elev forbinder til sin egen DB + seed
```

Når du trykker **Nulstil**, genindlæses seed-SQL (caféen) i *din* database — ikke i andres.

## God driftspraksis (kort)

1. **Hemmeligheder i env** — ikke i git
2. **Backup før store ændringer** (`pg_dump`)
3. **Migrationer** (eller seed-scripts) i stedet for manuel klik-DDL i prod
4. **Mindst mulige rettigheder** til app-rollen (GRANT-modulet)

## Refleksion til projektet

Skriv (i README eller aflevering):

- Hvilken Compose-service er Postgres?
- Hvor ligger volume?
- Hvordan får API’en connection string?
- Hvordan genskaber I tom DB + start-data?

Når I kan svare på det, har I koblet SQL-pensum til **Serverteknologi – Databaseserver** på H1.

## Typisk Compose-udsnit (forståelse)

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: cafe
    volumes:
      - pgdata:/var/lib/postgresql/data
    # ports: ["5432:5432"]  # kun lokalt / debug

  api:
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/cafe
```

## Sundhed og logs

- `docker compose ps` — kører `db`?  
- `docker compose logs db` — migration/seed-fejl?  
- Healthcheck på Postgres (`pg_isready`) i seriøse setups  

## Prøv selv

1. Find Compose-filen i jeres projekt og udpeg `db`-servicen.  
2. Peg på volume og env.  
3. Forklar forskellen på host `db` vs `localhost` fra API vs PC.
