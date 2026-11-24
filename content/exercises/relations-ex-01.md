---
title: Opgave — Skema-indsigt med SQL
slug: relations-ex-01
module: relations
order: 10
kind: exercise
objectives:
  - Analysere skema via forespørgsler
  - Se konsekvensen af flatet ordre-model
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/relations-ex-01/checks.json
  starterSql: |
    -- Afgør først, hvad én resultatrække skal repræsentere.
---

# Opgave — Skema-indsigt med SQL

Tegn de tre cafétabeller. Sæt en ring om den nøgle, der identificerer en vare, og vis en makker, hvor den samme værdi bruges i en ordre.

## Del 1

Vis hver `category` og antal produkter (`antal`). Sorter på `category`.

## Del 2

Vis produkter der **indgår i mindst én ordre**: `name` og `antal_linjer` (antal ordrerækker). Sorter på `name`.

(Det er produkter, hvor en prisændring *også* påvirker historiske linjebeløb, hvis I joiner live til `products.price`.)

Udvid skitsen, så en bon bevarer købsprisen. Peg på, hvor du ændrer morgendagens pris, og hvor du læser gårsdagens. Byt skitse med en makker, og brug [mønsteropslaget](/modules/relations#opslag) som facit til jeres begrundelser.
