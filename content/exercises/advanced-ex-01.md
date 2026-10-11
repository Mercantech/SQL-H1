---
title: Opgave — View + GRANT
slug: advanced-ex-01
module: advanced
order: 10
kind: exercise
objectives:
  - CREATE VIEW
  - GRANT SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/advanced-ex-01/checks.json
  starterSql: |
    CREATE OR REPLACE VIEW v_menu AS
    SELECT name, category, price FROM products WHERE in_stock = TRUE;
    GRANT SELECT ON v_menu TO PUBLIC;
---

# Opgave — View + GRANT

## Krav

1. Opret view **`v_menu`** med `name`, `category`, `price` for produkter hvor `in_stock = TRUE`.

2. Giv **`GRANT SELECT ON v_menu TO PUBLIC`**.

Tryk **Tjek svar**.
