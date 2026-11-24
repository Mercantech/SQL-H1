---
title: Opgave D — RETURNING
slug: dml-ex-04
module: dml
order: 13
kind: exercise
objectives:
  - INSERT med RETURNING
  - UPDATE med RETURNING
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/dml-ex-04/checks.json
  starterSql: |
    -- Bestem de ønskede resultatkolonner til INSERT og UPDATE.
---

# Opgave D — RETURNING

Forudsig navnene på de to kolonner, du vil se efter hver ændring. Brug editorens returnerede rækker til at kontrollere dit bud, når du kører SQL.

## Del 1

Indsæt kunden **Gina Berg** i **Randers** med e-mail **`gina@example.com`**. Returnér `id` og `name` fra denne indsættelse.

## Del 2

Sæt prisen på **Smoothie** til **45.00**. Returnér `name` og den nye `price` fra denne opdatering.

Notér Ginas faktiske id fra første resultat og Smoothies nye pris fra andet. Forklar en makker, hvordan et API kan bruge de to resultater. **Tjek svar** kontrollerer de gemte ændringer.
