---
title: Projekt — GameHubs arkitektduel
slug: database-choice-project-01
module: database-choice
order: 10
kind: project
objectives:
  - Sammenholde relationel database, dokumentdatabase og ORM med et performancebehov
  - Dokumentere reproducerbare målinger og deres begrænsninger
  - Skrive en beslutning med fordele, ulemper og en plan for genvurdering
---

# GameHubs arkitektduel

**Mission · 90 minutter · Målpind #22 · Grupper på 2–3**

Kunden behøver en beslutning, ikke en reklame. Jeres hold skal anbefale database og adgangslag til GameHub og forsvare valget med korrekthed, planer og krav.

## Kundens tre krav

1. En EU-topliste skal returnere 20 profiler med id, handle og rating i rækkefølgen rating faldende, id stigende. Det lokale øvelsesmål er under 100 ms pr. serverkørsel; I skal dokumentere målemetoden.
2. En turneringsplads må ikke reserveres to gange. Forklar den nødvendige konsistensmekanisme; dette projekt beder ikke om at implementere et helt bookingsystem.
3. Teamet skal kunne ændre modellen og genskabe data uden manuelle klik.

## Klargør de samme data

Brug [dokumentlabben](/downloads/documents-lab.zip) og dens README. Den indeholder 10.000 deterministiske profiler i både normaliseret PostgreSQL, JSONB og MongoDB.

```bash
docker compose up -d --wait
docker compose exec mongo mongosh --quiet gamehub /lab/seed.js
docker compose exec postgres sh -c 'psql -U gamehub -d gamehub -v ON_ERROR_STOP=1 -f /lab/seed.sql'
```

Kontrollér de samme 20 id'er i alle tre løsninger **før** I diskuterer hastighed. Scripts med kontroloutput og planer følger med. Data er konstruerede; resultatet kan ikke uden videre overføres til en rigtig GameHub.

## Jeres undersøgelse

Kør `plans.js` i MongoDB og `plans.sql` i PostgreSQL som beskrevet i README. Gem én opvarmning og mindst syv gentagelser før/efter indeks. Registrér alle servermålinger, antal returnerede rækker/dokumenter, undersøgt arbejde og relevante indeks. Nulstil forsøgets indeks mellem før/efter-serierne.

| Repræsentation | Korrekte 20 id'er? | Indeks | 7 målinger | Median | Arbejde i planen | Begrænsning |
|---|---|---|---|---|---|---|
| Normaliseret PostgreSQL | | | | | | |
| PostgreSQL JSONB | | | | | | |
| MongoDB | | | | | | |

Explain-målingerne viser serverarbejde med forskellige metoder. De kan begrunde indeksvalg inden for hver løsning, men giver alene **ikke** en retfærdig tværgående hastighedsrangering. En måling på 0 ms kan være afrunding. Hvis målet skal være hele applikationens svartid, skal I tilføje samme klient, resultatfelter og målegrænse for alle løsninger og tydeligt mærke den måleserie.

## ORM er det andet valg

Gennemgå GameHubs EF Core-kode fra [ORM-forløbet](/modules/orm). Indsæt én LINQ-forespørgsel og dens genererede SQL i rapporten. Forklar, hvad mapping, change tracking og migrationer giver, samt hvad I selv skal kontrollere: antal kald, felter, parametre og planer.

Hvis I har ORM-labben kørende: mål en fuld entitet og en projektion med `AsNoTracking` i en **separat måleserie**, og gem både SQL og antal databasekald. Det sammenligner adgangslagets brug, ikke PostgreSQL mod MongoDB.

## Beslutningskortet

Aflevér højst to sider plus målebilag:

- **Valg:** database/model og adgangslag hver for sig.
- **Evidens:** korrekthedscheck, målte planer og relevante egne tal.
- **Afvejning:** integritet, ændringer, læsninger, skrivninger og drift.
- **Fravalg:** hvorfor et relevant alternativ passer dårligere til netop kravene.
- **Usikkerhed:** hvad målingerne ikke viser, og hvornår valget skal genvurderes.

Hold en pitch på to minutter. Et andet hold udfordrer én antagelse; ret kortet, hvis indvendingen holder.

Underviseren vurderer præcisionen i jeres argumenter og målinger. Ingen bestemt database er facit, og projektet bliver ikke automatisk bestået i SQL-H1.
