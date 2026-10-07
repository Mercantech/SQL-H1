---
title: Opgave A — Kolonner og WHERE
slug: select-ex-01
module: select
order: 10
kind: exercise
objectives:
  - Vælge kolonner
  - Filtrere med WHERE
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-01/checks.json
  starterSql: -- Del 1: Vis name og city for kunder i Viborg
SELECT name, city
FROM customers
WHERE city = 'Viborg';
---

# Opgave A — Kolonner og WHERE

Brug café-databasen. Tryk **Nulstil data** hvis du er i tvivl om udgangspunktet. Når du er færdig, tryk **Tjek svar**.

## Del 1

Vis `name` og `city` for alle kunder i **Viborg**, sorteret alfabetisk på `name`.

## Del 2

Vis `name` og `price` for produkter i kategorien **Mad**.

## Del 3

Vis `name` og `email` for kunder hvor `email` er `NULL`.
