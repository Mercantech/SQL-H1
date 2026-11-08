---
title: 3. Find profilerne — i MongoDB og PostgreSQL
slug: documents-03-query
module: documents
order: 3
kind: theory
objectives:
  - Læse og ændre dokumenter med MongoDBs CRUD-operationer
  - Forklare hvordan filter og indeks hænger sammen
  - Anvende JSONB som bro til dokumenttænkning i PostgreSQL
sandbox:
  seed: seeds/gamehub-documents.sql
  allowWrite: false
  starterSql: |
    SELECT id, profile ->> 'handle' AS handle
    FROM player_profiles
    ORDER BY id;
---

# Find profilerne — i MongoDB og PostgreSQL

**Mission · 25 minutter · Målpind #21**

Raymond vil invitere EU-spillere med mindst 1.200 rating. Nu skal modellen levere et svar.

## MongoDB: samme spørgsmål, nyt sprog

Disse kommandoer hører til **mongosh i Docker-labben**, ikke SQL-editoren:

```javascript
db.profiles.find(
  { region: "EU", rating: { $gte: 1200 } },
  { _id: 0, handle: 1, rating: 1 }
).sort({ handle: 1 });

db.profiles.insertOne({ _id: 99, handle: "Guest", region: "EU", rating: 0 });
db.profiles.updateOne({ _id: 99 }, { $set: { rating: 100 } });
db.profiles.deleteOne({ _id: 99 });
```

Filtrering og projektion er to forskellige beslutninger: **hvilke dokumenter** matcher, og **hvilke felter** vil vi modtage? Projektionen kan udelade `_id` samtidig med, at øvrige felter tilvælges.

```javascript
db.profiles.createIndex({ region: 1, rating: -1 });
db.profiles.find({ region: "EU", rating: { $gte: 1200 } })
  .explain("executionStats");
```

Raymond vil vide, om indekset sparer arbejde, ikke blot om det findes. Undersøg planen og antal undersøgte dokumenter. Et indeks koster lagerplads og arbejde ved skrivning; kontrollér, om den konkrete forespørgsel faktisk får gavn af det.

> [!RAYMOND:question] Filter eller felter?
>
> Hvis `rating` kun står i projektionen, er spillere med lav rating så sorteret fra? Peg på **filteret**, **projektionen** og **sorteringen** i `find`-kaldet, og forudsig hvilke felter de matchende dokumenter afleverer.

## PostgreSQL kan også gemme dokumenter

PostgreSQL er stadig en relationel database, når en kolonne har typen `jsonb`. Vi kan kombinere normale nøgler og constraints med fleksible felter.

**Skift først til GameHub-data med Nulstil database**, hvis du vil afprøve eksemplerne. Det erstatter dine aktuelle sandboxdata; gem SQL, du vil beholde, inden nulstilling.

```sql
SELECT profile ->> 'handle' AS handle,
       (profile ->> 'rating')::integer AS rating
FROM player_profiles
WHERE profile ->> 'region' = 'EU'
  AND (profile ->> 'rating')::integer >= 1200
ORDER BY handle;
```

Raymond oversætter samme spørgsmål til PostgreSQL. `->` giver en JSONB-værdi; `->>` giver tekst, så rating castes til et tal før den numeriske sammenligning. Et manglende felt giver SQL `NULL` ved disse opslag. Det er stadig PostgreSQLs SQL- og typeregler, der styrer denne udgave.

```sql
SELECT profile #>> '{settings,theme}' AS theme
FROM player_profiles
WHERE id = 1;

SELECT profile ->> 'handle' AS handle
FROM player_profiles
WHERE profile @> '{"games":[{"slug":"rocket"}]}'::jsonb;
```

`@>` tester indeholdelse. Et GIN-indeks kan hjælpe visse JSONB-operatorer, men et udtryk som `(profile ->> 'rating')::integer` kan kræve et andet passende indeks. Se planen frem for at gætte.

## Din næste mission

Gennemfør først [JSONB-broen](/learn/documents-ex-01). Fortsæt derefter med [MongoDB-labben](/learn/documents-project-01), hvor du bruger en rigtig dokumentdatabase. De to øvelser supplerer hinanden; JSONB-opgaven alene dækker ikke arbejdet med MongoDB.

> [!RAYMOND:testing] Vis samme spørgsmål i to motorer
>
> Find EU-profiler med mindst 1.200 rating i **mongosh** og med **SQL mod JSONB**. Sammenlign identiteter, filter og valgte felter. Forklar, hvorfor JSONB er en datatype i PostgreSQL og ikke gør SQL-editoren til en MongoDB-terminal.

Kilder: [MongoDB CRUD](https://www.mongodb.com/docs/manual/crud/), [MongoDB-indeks](https://www.mongodb.com/docs/manual/indexes/) og [PostgreSQL JSONB](https://www.postgresql.org/docs/16/datatype-json.html).
