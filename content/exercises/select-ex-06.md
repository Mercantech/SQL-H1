---
title: Opgave F — NULL og COALESCE
slug: select-ex-06
module: select
order: 15
kind: exercise
objectives:
  - Filtrere på IS NULL
  - Bruge COALESCE i SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-06/checks.json
  starterSql: |
    SELECT name, COALESCE(email, '(ingen e-mail)') AS email_visning
    FROM customers
    WHERE city = 'Viborg'
    ORDER BY name;
---

# Opgave F — NULL og COALESCE

## Del 1

Vis kunder i **Viborg** med kolonnerne `name` og `email_visning`, hvor `email_visning` er e-mailen — eller teksten **`(ingen e-mail)`** hvis `email` er `NULL`. Sorter på `name`.

## Del 2

Tæl hvor mange ordrer der er **walk-in** (`customer_id IS NULL`). Returnér én kolonne `antal`.
