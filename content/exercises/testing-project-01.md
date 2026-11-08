---
title: Projekt — Bevis at databasen holder
slug: testing-project-01
module: testing
order: 11
kind: project
objectives:
  - Udføre gentagelige integrationstests mod PostgreSQL
  - Afprøve rollback og samtidige reservationer
  - Dokumentere testplan og en verificeret backup/restore
---

# Bevis at databasen holder

![Raymond fejrer en database der består sine tests](/raymond/course/testing.webp)

**Mission · Målpind 24 · 75–120 minutter · Makkerpar.** GameHubs sidste billet må kun sælges én gang. I skal aflevere beviser på både de almindelige regler og de fejl, som en glad demo overser.

Arbejd lokalt fra [labpakken](/downloads/security-testing-lab.zip). Følg README'ens Docker-kommandoer. Opgaven er en projektopgave med underviserbedømmelse; SQL-H1 kan ikke se eller godkende jeres lokale C#-tests.

## 1. Kør, læs og udfordr

Kør integrationstests og find hvor programmet kontrollerer NOT NULL, UNIQUE, FK og CHECK. Skriv mindst otte testcases med starttilstand, handling, forventning og oprydning. Medtag begge gyldige grænser for billetantal og mindst tre negative cases.

Tilføj selv to automatiske tests: én positiv eller grænsetest og én negativ test med den præcise SQLSTATE. Fjern kortvarigt en relevant constraint i din lokale kopi og vis, at en test opdager fejlen. Gendan reglen og gentag.

## 2. Fremprovokér det svære

Forklar rollback-testen og demonstrér, at en afbrudt transaktion ikke efterlader en halv reservation. Kør sidste-plads-testen med to forbindelser. Vis én vinder og ingen negativ beholdning. Gentag kørslen; bemærk at en enkelt kontrolleret samtidighedstest ikke udgør en fuld belastningstest.

## 3. Gendan en backup

Følg README'ens særskilte restore-øvelse. Den opretter en vedvarende demo-fixture, dumper labdatabasen inde i containeren og gendanner til en ny lokal database. Kontrollér rækkeantal, en constraint og en prøveforespørgsel efter restore. Bevar originalen. Beskriv hvordan et krypteret dump også kræver nøgle og værktøj for at være gendanneligt.

## Aflevering og rubrik

Aflever testplan, kodeændringer, output fra før/efter en afsløret fejl og en restore-log. Brug kun syntetiske data. Loggen må ikke indeholde credentials.

| Kriterium | Bevis |
|---|---|
| Relevante cases | Positive, negative og grænser med tydelige forventninger |
| Rigtig provider | Gentagelig kørsel mod PostgreSQL; ingen InMemory-erstatning |
| Testen kan fejle | En kort mutation giver rød test; gendannet regel giver grøn |
| Atomaritet og samtidighed | Rollback samt to forbindelser om én plads |
| Gendannelse | Separat restoredatabase og verificerede data/regler |
| Forklaring | Hvilke fejl dækker testene, og hvilke dækker de ikke? |

Underviseren kan vælge en test fra planen og bede jer ændre input. Når I kan forudsige udfaldet og vise det, har I noget stærkere end en tilfældig grøn skærm.
