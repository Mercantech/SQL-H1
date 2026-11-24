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
    -- Skriv menuens SELECT, kontrollér resultatet og opret dernæst view og grant.
---

# Opgave — View + GRANT

## Krav

1. Opret view **`v_menu`** med `name`, `category`, `price` for produkter hvor `in_stock = TRUE`.

2. Giv **`GRANT SELECT ON v_menu TO PUBLIC`**.

Tryk **Tjek svar**.

Forudsig om en ejer stadig kan læse products efter en tilbagekaldelse fra PUBLIC. Efter kontrollen kan du afprøve rolleforskellen i [GameHubs sikkerhedsprojekt](/learn/security-project-01), hvor samme læsning køres med en begrænset rolle.
