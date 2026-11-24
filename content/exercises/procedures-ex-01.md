---
title: Opgave — Funktionsbaseret linjebeløb
slug: procedures-ex-01
module: procedures
order: 10
kind: exercise
objectives:
  - CREATE FUNCTION
  - Kalde funktionen i SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/procedures-ex-01/checks.json
  starterSql: |
    -- Hent antal og produktpris for en ordre. Brug derefter beregningen i din funktion.
---

# Opgave — Funktionsbaseret linjebeløb

## Krav

1. Opret funktionen **`order_line_total(p_order_id INT)`**, der returnerer `NUMERIC`:  
   `quantity * price` for den angivne ordre.

2. Funktionen skal virke for eksisterende ordrer (join `orders` + `products`).

Tryk **Tjek svar**.

Inden du kører funktionen, så beregn selv beløbet på ordre 1 og 3 ved at se på deres antal og stykpris. Brug begge ordrer som modprøve, hvis en række giver et overraskende resultat.
