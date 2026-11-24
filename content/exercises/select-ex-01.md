---
title: Opgave A — Kolonner og WHERE
slug: select-ex-01
module: select
order: 10
kind: exercise
objectives:
  - Vælge kolonner
  - Filtrere med WHERE
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-01/checks.json
  starterSql: |
    -- Hvilke kolonner, hvilken tabel og hvilke rækker skal med?
---

# Opgave A — Kolonner og WHERE

Caféen vil sende lokale kunder en besked. Beslut først, hvilke kolonner der kan identificere en manglende e-mail. Afprøv delene hver for sig.

Brug café-databasen. Tryk **Nulstil data** hvis du er i tvivl om udgangspunktet. Når du er færdig, tryk **Tjek svar**.

## Del 1

Vis `name` og `city` for alle kunder i **Viborg**, sorteret alfabetisk på `name`.

## Del 2

Vis `name` og `price` for produkter i kategorien **Mad**.

## Del 3

Vis `name` og `email` for kunder hvor `email` er `NULL`.

I morgen kan du finde kunder uden e-mail fra hukommelsen. Forklar, hvorfor sammenligning med `= NULL` ikke udvælger dem. [Genbesøg NULL](/learn/select-10-null).
