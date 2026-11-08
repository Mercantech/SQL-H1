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

Raymond åbner både profilvisningen og turneringens deltagerliste. Profilen skal vise indstillinger med det samme; tilmeldinger skal kunne søges på tværs af tusindvis af spillere. Han opdager, at de to læsemønstre ikke behøver samme løsning.

> [!RAYMOND:question] Hvad læser og ændrer vi sammen?
>
> Sammenlign **en spillers temaindstilling** med **alle tilmeldinger til en turnering**. Hvilke data hører til én profil, og hvilke skal findes fra mange retninger? Brug de to konkrete opslag til at foreslå dokumentgrænser.

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

Raymond omdøber Fredagsfinalen. Hvis det aktuelle turneringsnavn var kopieret ind i tusind profiler, skulle alle kopier holdes enige. En turnering har derfor sit eget liv og kan have ét autoritativt navn, som tilmeldingerne refererer til. Et historisk snapshot er et andet, bevidst behov.

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

Raymond lader chatbeskeder få deres egen collection, så profilen ikke vokser med hver samtale. MongoDB har en dokumentgrænse på 16 MiB; det er en øvre grænse, ikke et designmål. Også før grænsen kan store dokumenter give større læsninger og mere arbejde ved ændringer.

## Arkitektduellen

Tegn to modeller for GameHub: én med mest muligt indlejret og én med flere referencer. En makker spiller kritisk kunde:

- Hvordan finder vi alle deltagere i én turnering?
- Hvad sker der, når turneringen omdøbes?
- Hvad sker der, når en spiller har 50.000 beskeder?

> [!RAYMOND:thinking] Hvor knækker dit forslag først?
>
> Vælg model for **profilindstillinger**, **chatbeskeder** og **turneringstilmeldinger**. Skriv et adgangsmønster og en ulempe ved hvert valg. Forklar desuden, hvorfor atomicitet i ét dokument ikke gør tre separate opdateringer til én samlet transaktion.

Kilder: [Embedding](https://www.mongodb.com/docs/manual/data-modeling/embedding/), [referencing](https://www.mongodb.com/docs/manual/data-modeling/referencing/) og [atomicitet](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/).
