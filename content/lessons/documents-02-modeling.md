---
title: 2. Én profil eller hundrede referencer?
slug: documents-02-modeling
module: documents
order: 2
kind: theory
objectives:
  - Vælge mellem embedding og referencing ud fra adgangsmønstre
  - Forklare atomicitet for ét dokument og begrænsningen ved flere dokumenter
  - Genkende voksende arrays og kopierede sandheder som designrisici
---

# Én profil eller hundrede referencer?

**Mission · 25 minutter · Målpind #21**

GameHub får en turnering. Spillerens profil skal vise indstillinger med det samme; tilmeldinger skal kunne søges på tværs af tusindvis af spillere. De to behov behøver ikke samme løsning.

> Raymond: »Spørg først: Hvad læser og ændrer vi sammen?«

## Embedding: data bor sammen

`settings` kan ligge i profilen. Den er lille, tilhører én spiller og læses ofte med resten af profilen. En opdatering af ét dokument er atomisk i MongoDB: operationens ændringer i dokumentet lykkes samlet eller bliver ikke anvendt.

```javascript
db.profiles.updateOne(
  { _id: 1 },
  { $set: { "settings.theme": "high-contrast" } }
);
```

Det gør **ikke** en række adskilte `updateOne`-kald til én samlet transaktion. Og `updateMany` er ikke atomisk som helhed, selvom hver enkelt dokumentændring er atomisk.

## Referencing: selvstændige ting får deres eget hjem

En turnering har eget liv. Dens navn skal ikke kopieres ind i hver spillerprofil og bagefter holdes opdateret tusind steder.

```json
{ "_id": 101, "name": "Fredagsfinalen", "capacity": 16 }
```

```json
{ "_id": 501, "playerId": 1, "tournamentId": 101, "status": "confirmed" }
```

Referencer skal valideres af applikationen og det valgte datadesign. MongoDB har `$lookup`, hvis et resultat skal kombinere collections. »NoSQL har aldrig joins« er derfor en dårlig huskeregel.

Hvis én plads og én betaling skal reserveres samlet på tværs af dokumenter, må du designe flowet til det. MongoDB understøtter transaktioner på replica sets og sharded clusters; labbens enkle standalone-server bruges ikke til transaktionsøvelser på tværs af dokumenter.

## Tre fælder i GameHub

| Idé | Risiko | Et muligt valg |
|---|---|---|
| Al chat ind i profilen | Array vokser uden grænse; dokumentet bliver stort | Separat besked-collection med spillerreference |
| Turneringens aktuelle navn i alle profiler | Flere kopier af samme sandhed | Reference; eventuelt et tydeligt historisk snapshot |
| Opdatér balance med læs → plus én → skriv | Samtidige kald kan overskrive hinanden | `$inc` eller betinget opdatering efter behov |

Der er en dokumentgrænse på 16 MiB i MongoDB. Den er en øvre grænse, ikke et designmål. Store dokumenter giver også større læsninger og mere arbejde ved ændringer.

## Arkitektduellen

Tegn to modeller for GameHub: én med mest muligt indlejret og én med flere referencer. En makker spiller kritisk kunde:

- Hvordan finder vi alle deltagere i én turnering?
- Hvad sker der, når turneringen omdøbes?
- Hvad sker der, når en spiller har 50.000 beskeder?

**Dit checkpoint:** Vælg model for profilindstillinger, chatbeskeder og turneringstilmeldinger. Skriv ét adgangsmønster og én ulempe ved hvert valg.

Kilder: [Embedding](https://www.mongodb.com/docs/manual/data-modeling/embedding/), [referencing](https://www.mongodb.com/docs/manual/data-modeling/referencing/) og [atomicitet](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/).
