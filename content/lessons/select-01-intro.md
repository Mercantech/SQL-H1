---
title: 1. Velkommen til SELECT
slug: select-01-intro
module: select
order: 1
kind: theory
objectives:
  - Forstå hvad en forespørgsel er
  - Kende café-databasens tabeller
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: "SELECT * FROM customers;"
---

# Velkommen til SELECT

Raymond har taget caféens database frem. Første spørgsmål er enkelt: Hvem er vores kunder? Med `SELECT` beder du databasen om et resultat, som du kan undersøge. Vi begynder med tre tabeller:

| Tabel | Indhold |
|-------|---------|
| `customers` | Kunder (navn, by, e-mail) |
| `products` | Produkter (navn, kategori, pris) |
| `orders` | Ordrer (kunde, produkt, antal, dato) |

> [!RAYMOND:curious] Hvilken tabel ville du spørge?
>
> Jeg vil finde kundernes navne, ikke de varer de har købt. Kig på tabellerne ovenfor: Hvor vil du starte, og hvilken kolonne forventer du at se?

## Din første forespørgsel

```sql
SELECT * FROM customers;
```

- `SELECT` = hvad du vil have ud
- `*` = alle kolonner
- `FROM customers` = hvilken tabel

Kør SQL’en i editoren. Raymond foreslår, at du først læser kolonnenavnene og derefter én hel række. Prøv også `products` og `orders`: Kan du se, at en række betyder noget forskelligt i hver tabel?

## Tip

Brug `SELECT *` til at **udforske** en tabel. Når du kender kolonnerne, vælger du dem eksplicit. Det gør resultatets indhold tydeligt og kan spare overførsel af unødvendige data; det er ikke i sig selv en garanti for en hurtigere forespørgsel.

> [!RAYMOND:question] Vis mig, at du kan læse svaret
>
> Åbn `orders`, og peg på én række. Hvilke oplysninger kan du allerede forstå, og hvilke id’er kræver et opslag i en anden tabel? Det sidste spørgsmål følger vi op på i JOIN-modulet.
