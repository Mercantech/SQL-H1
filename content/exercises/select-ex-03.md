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
    SELECT customer_id, COUNT(*)::int AS antal
    FROM orders
    GROUP BY customer_id
    ORDER BY customer_id;
---

# Opgave C — Aggregater og funktioner

Afslutningsopgave for SELECT-modulet.

## Del 1

Vis antal ordrer pr. kunde: kolonnerne `customer_id` og `antal`, sorteret på `customer_id`.

## Del 2

Vis antal produkter pr. kategori (`category`, `antal`), men **kun** kategorier med mindst **3** produkter.

## Del 3

Vis kundenavne i **store bogstaver** som kolonnen `navn` for kunder i **Aarhus**, sorteret på `navn`.
