---
title: Opgave — Leaderboard uden datalæk
slug: security-ex-01
module: security
order: 10
kind: exercise
objectives:
  - Begrænse et offentligt view til nødvendige kolonner
  - Fjerne offentlig adgang til private profildata
  - Kontrollere både resultat og rettigheder
sandbox:
  seed: seeds/gamehub-security.sql
  allowWrite: true
  checks: exercises/security-ex-01/checks.json
  starterSql: |
    SELECT display_name, wins FROM player_profiles ORDER BY display_name;
---

# Leaderboard uden datalæk

**Mission · Målpind 23 · 20–30 minutter.** GameHubs leaderboard læser direkte fra `player_profiles`. Alle databaseroller har fået SELECT på tabellen. Red holdet, før de private oplysninger ryger på storskærmen.

Seedet er bevidst fejlkonfigureret i din egen sandbox. Brug **Nulstil** for at indlæse denne opgaves udgangspunkt; det erstatter din nuværende sandbox. Alle personer og adresser er fiktive.

## Dit sikkerhedsarbejde

1. Opret viewet `v_public_leaderboard` fra `player_profiles` med **præcis** kolonnerne `display_name` og `wins`.
2. Fjern alle tabelrettigheder fra `PUBLIC` på `player_profiles`.
3. Giv `PUBLIC` SELECT på viewet; giv ingen skriverettigheder.
4. Læs viewet sorteret på `display_name` og kontrollér de tre spillere.

`PUBLIC` betyder alle databaseroller, ikke »alle på internettet«. I øvelsen er det en enkel modtager af rettigheder. I drift bruger man normalt en konkret rolle med mindst mulige rettigheder.

## Hvordan du beviser løsningen

**Tjek svar** undersøger viewets kolonner, det faktiske resultat, afhængigheden af profiltabellen og PUBLIC-rettigheder. Din sandboxkonto ejer stadig objekterne; en SELECT som ejer beviser derfor ikke, at en anden rolle er afvist. I [Docker-projektet](/learn/security-project-01) afprøver du adgang med en anden rolle.

Forklar til din makker: Hvilke oplysninger mangler med vilje i viewet? Hvorfor skal tabeladgangen også fjernes? Hvad kan kryptering hjælpe med, som viewet ikke løser?

Bonus: foreslå, hvordan en app kan vise den aktuelle spillers private profil uden at give alle spillere adgang til hinandens data.
