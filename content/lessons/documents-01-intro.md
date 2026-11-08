---
title: 1. GameHub-profiler der ikke passer i samme kasse
slug: documents-01-intro
module: documents
order: 1
kind: theory
objectives:
  - Forklare dokument, collection og BSON
  - Skelne dokumentdatabase fra JSON i en SQL-database
  - Beskrive hvorfor fleksible dokumenter stadig kræver et design
---

# GameHub-profiler der ikke passer i samme kasse

![Raymond undersøger GameHubs dokumenter](/raymond/course/documents.webp)

**Mission · 20 minutter · Målpind #21**

Raymond åbner skolens GameHub. Nogle spiller turneringer, andre bygger verdener, og én vil kun vise sine speedruns. Skal alle profiler have præcis de samme felter?

> Raymond: »Fleksibilitet er fedt. Men hvis dit program ikke ved, hvad et felt betyder, har du bare flyttet problemet.«

## Et dokument er en samlet lille verden

En dokumentdatabase som **MongoDB** gemmer dokumenter i **collections**. MongoDB bruger **BSON**, et binært format med blandt andet strenge, tal, arrays, indlejrede dokumenter, datoer og ObjectId. Eksemplerne ligner JSON; datoer og ObjectId har flere typer end almindelig JSON.

```json
{
  "_id": 1,
  "handle": "Nova",
  "region": "EU",
  "rating": 1450,
  "settings": { "theme": "dark" },
  "games": [
    { "slug": "rocket", "hours": 24 },
    { "slug": "valorant", "hours": 12 }
  ]
}
```

Her er `_id` identiteten, `settings` et indlejret dokument og `games` et array. MongoDB opretter normalt ObjectId, hvis `_id` udelades; vi vælger små heltal i labben for at gøre resultater lette at sammenligne.

| Relationel verden | Dokumentverden |
|---|---|
| Tabel | Collection |
| Række | Dokument |
| Kolonne | Felt |
| PK | `_id` med unikt indeks |
| FK/relation | Reference eller indlejret data, som vi designer |

Det er en huskeregel, ikke en fuldstændig oversættelse. MongoDB håndhæver eksempelvis ikke en SQL-lignende fremmednøgle mellem collections.

## Fleksibel betyder ikke uden regler

To dokumenter kan have forskellige felter. Men hvis `rating` nogle gange er et tal og andre gange teksten `"mega god"`, bliver filtrering og sortering upræcis. Aftal felter, typer og fravær; MongoDB kan også håndhæve schema validation.

Et manglende felt og et felt med `null` er forskellige tilstande. En MongoDB-forespørgsel `{ badge: null }` matcher som udgangspunkt begge. Brug blandt andet `$exists`, når fravær er det, du undersøger.

## Stop og gæt

1. Hvilke oplysninger fra profilen viser GameHub normalt på samme skærm?
2. Hvad bør ske, hvis en import sender `rating` som tekst?
3. Vil du gemme ét dokument med en spillers **alle** chatbeskeder for altid? Hvorfor?

Parøvelse: Byt profil med en makker. Find én uklar datatype og én oplysning, som måske bør ligge et andet sted.

**Dit checkpoint:** Du kan tegne et dokument med array og indlejret objekt og forklare dets identitet. Næste mission handler om, hvor dokumentets grænse bør gå.

Kilde: [MongoDBs officielle introduktion til datamodellering](https://www.mongodb.com/docs/manual/data-modeling/).
