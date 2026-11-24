---
title: Opgave A — INNER JOIN
slug: joins-ex-01
module: joins-subqueries
order: 10
kind: exercise
objectives:
  - Joine customers, orders og products
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/joins-ex-01/checks.json
  starterSql: |
    -- Angiv de to forbindelser mellem ordre, kunde og produkt.
---

# Opgave A — INNER JOIN

Tegn den første bon fra ordre via kunde til vare. Beslut, hvilke to nøgler der afgør, om de tre rækker hører sammen.

## Del 1

Vis `name` (kunde), `produkt` (produktnavn) og `quantity` for alle ordrer med `quantity >= 2`. Sorter på kundenavn, derefter produktnavn.

## Del 2

Vis `kunde`, `produkt` og `linje_total` (`quantity * price`) for ordrer fra kunder i **Aarhus**. Sorter på `linje_total` faldende, derefter `kunde`.

Hvis et varenavn overrasker dig, følg den samme ordre gennem [minicaféens to forbindelser](/forloeb/joins/lessons/0003-foelg-en-ordre.html). Her i editoren arbejder du videre på caféens større datasæt.
