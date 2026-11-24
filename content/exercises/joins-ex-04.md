---
title: Opgave D — Anti-join
slug: joins-ex-04
module: joins-subqueries
order: 13
kind: exercise
objectives:
  - NOT EXISTS / anti-join
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/joins-ex-04/checks.json
  starterSql: |
    -- Beskriv et match, og find derefter de rækker, som mangler det.
---

# Opgave D — Anti-join

Gæt én kunde eller én vare, der kan mangle i ordrerne. Skriv derefter en undersøgelse, der også kunne finde andre navne i et nyt datasæt.

## Del 1

Find kunder **uden ordrer**. Returnér kun `name`, sorteret alfabetisk.

## Del 2

Find produkter der **aldrig** optræder i `orders`. Returnér `name` sorteret alfabetisk.

Genskab om en uge den første rapport med den anden metode fra [anti-join-lektionen](/learn/joins-08-anti). Sammenlign navnene, og peg på, hvor den manglende ordre bliver opdaget.
