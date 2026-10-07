---
title: Opgaver — SELECT
module: select
order: 10
kind: exercise
objectives:
  - Hente og filtrere data
  - Aggregere med GROUP BY
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-01/checks.json
  starterSql: -- 1) Vis alle kunder fra Viborg
SELECT name, city FROM customers WHERE city = 'Viborg';
---

# Opgaver — SELECT

Databasen indeholder `customers`, `products` og `orders` (café-data).

## Del 1

Vis `name` og `city` for alle kunder i **Viborg**.

## Del 2

Find produkter i kategorien **Drikke** sorteret med dyreste først (`name`, `price`).

## Del 3

Vis antal ordrer pr. kunde: `customer_id` og `antal` (brug `COUNT` + `GROUP BY`).

Når du er færdig, tryk **Tjek svar**. Checks kører assertions mod din database — sørg for at dine resultater er korrekte (du behøver ikke gemme midlertidige views; checks validerer forventede forespørgsler på dataene).
