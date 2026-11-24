---
title: Opgave C — DELETE og fremmednøgler
slug: dml-ex-03
module: dml
order: 12
kind: exercise
objectives:
  - Slette flere rækker sikkert
  - Rydde op omkring fremmednøgler
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/dml-ex-03/checks.json
  starterSql: |
    -- Slå Latte op først, og find de ordrelinjer, som peger på produktet.
---

# Opgave C — DELETE og fremmednøgler

Følg Latte fra varer til ordrelinjer. Tæl de matchende linjer før sletningen og afgør, i hvilken rækkefølge tabellerne kan ændres.

I dette forsøg rydder du Latte og de tilhørende salg fra caféens testdata.

## Del 1

Slet **alle ordrer** der refererer til produktet **Latte**.

## Del 2

Slet derefter selve produktet **Latte**.

## Del 3

Slet alle ordrer med `order_date = '2024-04-01'`.

I morgen kan du genskabe de to mulige strategier i [lektionen om referencer ved sletning](/learn/dml-05-cascade). Forklar, hvornår du i stedet ville udfase en vare og bevare salgene.
