---
title: Opgave C — Aggregater og funktioner
slug: select-ex-03
module: select
order: 12
kind: exercise
objectives:
  - GROUP BY og COUNT
  - Aggregater og HAVING
  - Strengfunktioner
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-03/checks.json
  starterSql: |
    -- Begynd med at vælge grupper og den værdi, som skal tælles.
---

# Opgave C — Aggregater og funktioner

Raymond sammenholder tre rapporter. Beslut først, hvad én række skal repræsentere i hver rapport.


## Del 1

Vis `customer_id` og antal ordrer som `antal` pr. `customer_id` (inkl. walk-in med `NULL`), sorteret med `ORDER BY customer_id NULLS LAST`.

## Del 2

Vis antal produkter pr. kategori (`category`, `antal`), men **kun** kategorier med mindst **3** produkter.

## Del 3

Vis kundenavne i **store bogstaver** som kolonnen `navn` for kunder i **Aarhus**, sorteret på `navn`.

Om en uge kan du vende tilbage til [rapporten over ordrer pr. produkt](/learn/joins-ex-02). Forklar dér, hvilken forskel `COUNT(*)` og `COUNT(o.id)` gør for en vare uden ordrer.
