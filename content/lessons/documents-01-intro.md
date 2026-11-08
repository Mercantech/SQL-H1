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

> [!RAYMOND:curious] Hvad betyder feltet for programmet?
>
> To profiler må gerne have forskellige ekstra felter. Men hvad skal `rating` betyde i begge? Beskriv **én fælles regel** for feltets type, før du beslutter, hvilke dele af profilen der skal være fleksible.

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

Raymond prøver at finde de bedst rangerede spillere. Hvis `rating` nogle gange er et tal og andre gange teksten `"mega god"`, kan han ikke behandle dem som én numerisk rangliste uden yderligere regler. Fleksible felter kræver derfor en aftale om typer, betydning og fravær; MongoDB kan også håndhæve schema validation.

Et manglende felt og et felt med `null` er forskellige tilstande. En MongoDB-forespørgsel `{ badge: null }` matcher som udgangspunkt begge. Brug blandt andet `$exists`, når fravær er det, du undersøger.

## Stop og gæt

1. Hvilke oplysninger fra profilen viser GameHub normalt på samme skærm?
2. Hvad bør ske, hvis en import sender `rating` som tekst?
3. Vil du gemme ét dokument med en spillers **alle** chatbeskeder for altid? Hvorfor?

Parøvelse: Byt profil med en makker. Find én uklar datatype og én oplysning, som måske bør ligge et andet sted.

> [!RAYMOND:thinking] Tegn en profil, der kan forklares
>
> Tegn dit eget profildokument med **identitet**, **array** og **indlejret objekt**. Forklar forskellen på et manglende felt og `null`, og vælg én oplysning, som ikke bør vokse ubegrænset i profilen. Næste lektion undersøger netop dokumentets grænse.

Kilde: [MongoDBs officielle introduktion til datamodellering](https://www.mongodb.com/docs/manual/data-modeling/).
