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
    INSERT INTO customers (name, city, email)
    VALUES ('Gina Berg', 'Randers', 'gina@example.com')
    RETURNING id, name;
---

# Opgave D — RETURNING

## Del 1

Indsæt kunden **Gina Berg** i **Randers** med e-mail **`gina@example.com`**. Brug gerne `RETURNING`.

## Del 2

Sæt prisen på **Smoothie** til **45.00**. Brug gerne `RETURNING`.

Tryk **Tjek svar** (checks læser sluttilstanden).
