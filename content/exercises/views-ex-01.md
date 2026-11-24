---
title: Opgave — Ordreoversigt som view
slug: views-ex-01
module: views
order: 10
kind: exercise
objectives:
  - CREATE VIEW med JOIN
  - Forespørge via view
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/views-ex-01/checks.json
  starterSql: |
    -- Byg et view med én række pr. ordre og bevar walk-in-ordrer.
    -- Begynd med at vælge tabellen, der indeholder alle ordrelinjerne.
---

# Opgave — Ordreoversigt som view

## Krav

1. Opret (eller erstat) view’et **`v_order_lines`** med kolonnerne:
   - `order_id` — `orders.id`
   - `kunde` — kundenavn, eller teksten **`Walk-in`** når `customer_id` er `NULL` (`COALESCE`)
   - `produkt` — produktnavn
   - `quantity`
   - `linje_beloeb` — `quantity * price`
   - `order_date`

2. View’et skal inkludere **walk-in**-ordrer (`LEFT JOIN` på customers).

Tryk **Tjek svar**, når det er på plads.

Prøv ordre 13 som kontrol, før du åbner et eksempel. Den har ingen registreret kunde. Hvis ordren forsvinder, så find det JOIN, der fjernede rækken, og brug ordre 1 til at kontrollere, at beløbet stadig beregnes rigtigt.
