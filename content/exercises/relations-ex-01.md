---
title: Opgave — Skema-indsigt med SQL
slug: relations-ex-01
module: relations
order: 10
kind: exercise
objectives:
  - Analysere skema via forespørgsler
  - Se konsekvensen af flatet ordre-model
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/relations-ex-01/checks.json
  starterSql: |
    SELECT category, COUNT(*)::int AS antal
    FROM products
    GROUP BY category
    ORDER BY category;
---

# Opgave — Skema-indsigt med SQL

## Del 1

Vis hver `category` og antal produkter (`antal`). Sorter på `category`.

## Del 2

Vis produkter der **indgår i mindst én ordre**: `name` og `antal_linjer` (antal ordrerækker). Sorter på `name`.

(Det er produkter, hvor en prisændring *også* påvirker historiske linjebeløb, hvis I joiner live til `products.price`.)
