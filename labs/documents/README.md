# Raymonds GameHub — dokumentlab

Til målpind **#21 dokumentdatabaser** og **#22 begrundet database-/adgangslagsvalg**.
Du skal bruge Docker med Compose. Ingen hostinstallation af MongoDB, PostgreSQL,
mongosh eller psql er nødvendig.

## Start og seed

Åbn terminalen i mappen med `compose.yml`:

```bash
docker compose up -d --wait
docker compose exec mongo mongosh --quiet gamehub /lab/seed.js
docker compose exec postgres sh -c 'psql -U gamehub -d gamehub -v ON_ERROR_STOP=1 -f /lab/seed.sql'
```

Begge seedfiler indeholder udelukkende opdigtede data. Mongo-seed nulstiller
`profiles` og `profiles_bench`; Postgres-seed nulstiller de tre `bench_`-tabeller.
Brug dem kun i denne lab.

Kommandolinjerne virker i PowerShell og almindelig Bash. Image-versioner kan
overstyres med env-variablerne i `.env.example`; kopiér den til `.env`, hvis du
vil ændre dem. De viste hovedversioner er labbens udgangspunkt, ikke en garanti
for at alle image-patches er identiske: notér det faktiske image-id i rapporten.

## Isoleret undervisningsmiljø

Databaserne ligger på et privat `internal` Compose-net uden publicerede porte.
Der er ingen forbindelse til `dokploy-network`. Kommandoer afvikles med
`docker compose exec` inde i containerne. Der ligger ingen credentials i pakken.

MongoDB-autentifikation er slået fra og PostgreSQL bruger `trust` i **denne
disposable lab**. Det gør ikke opsætningen egnet til rigtige brugerdata eller
produktion. Til rigtig hosting kræves autentifikation, begrænsede roller,
secrets via miljø og relevant transportbeskyttelse. Publicér ikke disse porte,
og tilslut ikke labben til et delt netværk.

## MongoDB-missionen

Åbn shell:

```bash
docker compose exec mongo mongosh gamehub
```

Vis for eksempel den første profil:

```javascript
db.profiles.findOne({ _id: 1 });
```

De fire profiler hedder Nova, Pixel, Rune og Echo. EU-spillere med rating på
mindst 1200 er Nova og Pixel. Der er to collections: `profiles` til historien
og `profiles_bench` til performanceundersøgelsen. Serveren er standalone;
fler-dokument-transaktioner kræver en passende replica-set-/sharded-opsætning.

Skriv dit eget `solution.js` i `mongo/`, og kør det med:

```bash
docker compose exec mongo mongosh --quiet gamehub /lab/solution.js
```

## Samme benchmarkdata, tre repræsentationer

Benchmarkfixture er deterministisk:

- id fra 1 til 10000; handle `Player` plus id med fem cifre.
- region er NA når id er deleligt med tre, ellers EU.
- rating er `(id * 37) % 2000`.
- Kontrolsummer: count **10000**, idSum **50005000**, ratingSum **9995000**.

Normaliseret PostgreSQL bruger `bench_players` med FK til `bench_regions`.
JSONB-varianten bruger `bench_profiles`; MongoDB bruger `profiles_bench`.
Alle benchmarkforespørgsler vælger EU med rating mindst 1200 og returnerer
id, handle og rating, sorteret på rating faldende og id stigende, højst 20.

Kør planforsøg:

```bash
docker compose exec mongo mongosh --quiet gamehub /lab/plans.js
docker compose exec postgres sh -c 'psql -U gamehub -d gamehub -v ON_ERROR_STOP=1 -f /lab/plans.sql'
```

Gem eventuelt output med terminalens `>` i en lokal mappe, eksempelvis
`results/mongo.txt`. Opret mappen først. Scripts viser korrekthedsresultatet,
en opvarmning og syv gentagelser pr. tilstand før og efter ét navngivet indeks.
De fjerner kun deres egne benchmarkindekser ved genkørsel. Hvis planneren stadig
vælger scanning, er det et resultat, I skal forklare; tving ikke en plan for at
få et ønsket screenshot.

For PostgreSQL registreres `Execution Time` fra hver plan samt relevante
scan-/bufferdata. For MongoDB registreres `executionTimeMillis`, `nReturned`,
`totalDocsExamined` og `totalKeysExamined`. Gem alle syv tal og medianen.
Versionsoplysninger findes med `SELECT version();` og `db.version()`.

**Sammenligningsgrænse:** Explain-tider fra forskellige databaser har forskellige
metoder og opløsning; serverplanerne viser heller ikke netværk, C#-mapping eller
HTTP. Brug målingerne til før/efter-analyse inden for hver løsning. En direkte
tværgående hastighedsrangering kræver et yderligere ens klientbenchmark.
En afrundet 0 ms er ikke bevis for øjeblikkeligt arbejde. Denne lab er ikke en
belastningstest med mange samtidige brugere.

## Beslutningskort

Aflevér database/model og adgangslag som to særskilte valg. Angiv krav,
korrekthedscheck, planfund, målegrænse, trade-offs og et tidspunkt for
genvurdering. ORM-delen undersøges med EF Core-labben: genereret SQL, antal kald,
projektion og tracking. Den er ikke et fjerde databaseprodukt.

## Stop eller slet labdata

```bash
docker compose down
```

Bevarer volumes. Når du eksplicit vil slette labbens data:

```bash
docker compose down -v
```

## Officielle kilder

- [MongoDB datamodellering](https://www.mongodb.com/docs/manual/data-modeling/)
- [MongoDB atomicitet](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)
- [MongoDB explain](https://www.mongodb.com/docs/manual/reference/explain-results/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/16/datatype-json.html)
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/16/using-explain.html)
