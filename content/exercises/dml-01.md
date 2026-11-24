---
title: Opgave A — Grundlæggende DML
slug: dml-ex-01
module: dml
order: 10
kind: exercise
objectives:
  - Indsætte, opdatere og slette data
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/dml-01/checks.json
  starterSql: |
    -- Vælg kunder, produkter og ordrer med et præcist filter før ændringerne.
---

# Opgave A — Grundlæggende DML

Caféens testdatabase skal have tre ændringer. Forudsig før hver kommando, hvilken tabel og hvor mange rækker den berører.

Udgangspunktet er café-databasen. Udfør ændringerne nedenfor, og tryk **Tjek svar**.

1. Indsæt kunden **Eva Møller** i byen **Aarhus**.
2. Sæt prisen på **Te** til **27.00**.
3. Slet ordren med `id = 8`.

Tip: Brug `SELECT` undervejs for at kontrollere dine ændringer.

Find Eva Møller, Te og ordre 8 enkeltvis efter kørslen. Vis en makker, hvordan resultatet af hver kontrol afslører, om du indsatte, opdaterede eller slettede.
