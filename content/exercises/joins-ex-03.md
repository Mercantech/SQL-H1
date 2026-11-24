---
title: Opgave C — Subquery og WITH
slug: joins-ex-03
module: joins-subqueries
order: 12
kind: exercise
objectives:
  - Subqueries
  - CTE med WITH
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/joins-ex-03/checks.json
  starterSql: |
    -- Hvilken lille forespørgsel leverer sammenligningsværdien?
---

# Opgave C — Subquery og WITH

Giv hver rapport et spørgsmål med almindelige ord. Marker hvilken del, der kræver et samlet tal eller en placering, før du kan vælge den endelige række.

## Del 1

Vis `name` og `price` for produkter dyrere end **gennemsnittet** af alle produkter. Sorter med dyreste først.

## Del 2

Brug en CTE `ranked` med `ROW_NUMBER()` pr. kategori (dyreste først). Vis de produkter hvor `nr = 1` (`name`, `category`, `price`). Sorter på `category`.

## Del 3

Vis kundenavne for kunder hvis **samlede** `quantity` på tværs af ordrer er mindst **4**. Sorter på `name`.

Flyt midlertidigt din CTE's indre SELECT ud i editoren. Læs en kategori igennem fra øverst til nederst, og forklar en makker, hvorfor vinderens placering er 1.
