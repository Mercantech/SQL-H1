---
title: Projekt — Åbn GameHub i en rigtig dokumentdatabase
slug: documents-project-01
module: documents
order: 11
kind: project
objectives:
  - Køre MongoDB i Docker og anvende collections og BSON
  - Udføre CRUD og undersøge en forespørgselsplan
  - Begrunde embedding, referencing og dokumentets konsistensgrænse
---

# Åbn GameHub i en rigtig dokumentdatabase

![Raymond undersøger GameHubs dokumenter](/raymond/course/documents.webp)

**Mission · 60–90 minutter · Målpind #21 · Parprojekt**

Du og en makker overtager hver jeres rolle: én skriver kommandoer, én forudsiger resultatet. Byt efter hver del. Målet er en profilsamling, I kan forklare, ikke flest mulige kommandoer.

## Startpakken

[Hent dokumentlabben](/downloads/documents-lab.zip), pak den ud, og åbn en terminal i mappen med `compose.yml`. Docker med Compose er eneste nødvendige installation.

```bash
docker compose up -d --wait
docker compose exec mongo mongosh --quiet gamehub /lab/seed.js
docker compose exec mongo mongosh gamehub
```

Skriv `exit` for at forlade mongosh. Labben eksponerer ingen databaseporte og indeholder kun opdigtede undervisningsdata. `seed.js` nulstiller kun de to navngivne lab-collections; kør det i labben.

## Mission A — Mød spillerne

Vis profiler, og find EU-spillere med mindst 1200 rating. Returnér kun handle og rating, sorteret på handle. Gem kommando og resultat i `mission.md`; det skal være Nova og Pixel.

## Mission B — Opdatér uden at ødelægge

1. Indsæt en midlertidig profil med `_id: 99`.
2. Opdatér dens rating, og slet profilen igen.
3. Skift Novas tema til `high-contrast` med `$set` på en feltsti.
4. Vis, at Novas spil og rating er bevaret, og at profil 99 er væk.

Gem de fire CRUD-kommandoer i `solution.js`. Test genkørsel ved at indlæse seed på ny, før du kører dit script igen.

## Mission C — Design der holder efter weekenden

Tegn dokumenter/collections for profil, turnering og tilmelding. Begrund, hvad der er embedded, hvad der er referencer, og hvem der sikrer, at referencerne findes. Forklar hvorfor en ubegrænset chatlog ikke bør gemmes som ét array i profilen.

Vis én atomisk ændring af et dokument. Forklar derefter hvorfor to dokumentændringer ikke automatisk udgør én transaktion. Labben er standalone; den skal ikke bruges til en fler-dokument-transaktionsdemo.

## Mission D — Undersøg planen

Kør labbens `plans.js`, og gem planudsnit før og efter indeks. Forklar `nReturned`, `totalDocsExamined` og `totalKeysExamined`. Brug benchmark-collectionens 10.000 profiler; de fire historieprofiler er til korrekthed, ikke hastighed.

```bash
docker compose exec mongo mongosh --quiet gamehub /lab/plans.js
```

## Aflevering og feedback

Aflevér `solution.js`, `mission.md` med outputs/planudsnit og én tegning. I skal kunne genskabe resultatet fra en frisk seed og forklare én ulempe ved jeres design.

| Klar til demonstration | Vis os |
|---|---|
| Dokumentforståelse | BSON, identitet, arrays og collections i jeres egne data |
| Praktisk dataarbejde | Korrekt CRUD med bevarede felter |
| Begrundet model | Embedding/reference og konsistensgrænse |
| Teknisk refleksion | Planudsnit og en forklaring af indeksarbejde |

Projektet gennemføres lokalt og vurderes med underviseren; SQL-H1 kører ikke MongoDB-kommandoerne eller godkender projektet automatisk.

Stop uden at fjerne data med `docker compose down`. **Kun når I vil slette labdata:** `docker compose down -v`.
