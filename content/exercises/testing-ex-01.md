---
title: Opgave — Billetter uden smuthuller
slug: testing-ex-01
module: testing
order: 10
kind: exercise
objectives:
  - Oversætte billetregler til databaseconstraints
  - Kontrollere positive, negative og grænsetilfælde
  - Forklare præcis hvilken regel en test beviser
sandbox:
  seed: seeds/gamehub-testing.sql
  allowWrite: true
  checks: exercises/testing-ex-01/checks.json
  starterSql: |
    SELECT * FROM tickets;
    -- Tilføj reglerne med ALTER TABLE.
---

# Billetter uden smuthuller

**Mission · Målpind 24 · 30 minutter.** Dørvagten nægter at åbne, før GameHub kan afvise ugyldige billetter. Du får et skema med én gyldig billet og flere manglende regler.

Brug **Nulstil** til at indlæse dette seed i din egen sandbox; det erstatter tidligere sandboxdata. Ændr ikke de medfølgende testfunktioner: de er din testfixture.

## Reglerne du skal håndhæve

- `tickets.player_id` er påkrævet og skal pege på `players.id`.
- `tickets.ticket_code` er påkrævet og unik.
- `tickets.quantity` er påkrævet og skal være mellem **1 og 4 inklusive**.
- Den eksisterende billet med koden `FINAL-1` skal bevares uændret.

Tilføj reglerne med DDL. I denne opgave er tom billetkode og forskel på store/små bogstaver uden for kravene; skriv i din testplan, hvordan I ville specificere dem i et rigtigt projekt.

## Din testplan før Tjek svar

| Input | Forventning |
|---|---|
| quantity 1 og 4 | Accepteres |
| quantity 0 og 5 | CHECK-fejl 23514 |
| quantity NULL | NOT NULL-fejl 23502 |
| player_id 9999 | FK-fejl 23503 |
| Samme kode som FINAL-1 | UNIQUE-fejl 23505 |

Du kan prøve ét fejlagtigt INSERT ad gangen og læse SQLSTATE. Kør ikke flere forventede fejl i en åben transaktion uden at håndtere rollback. De medfølgende probe-funktioner afprøver hver case i en subtransaktion og efterlader ingen prøverækker.

```sql
SELECT gamehub_rejects('quantity_zero') AS afviser_nul,
       gamehub_accepts(1) AS accepterer_en;
```

**Tjek svar** afprøver både ugyldige og gyldige indsatser mod dine constraints. At reglen blot har et bestemt navn er ikke nok. Tag et grønt resultat med til afleveringen sammen med en forklaring af én test, der var rød før din ændring.

Fortsæt i [projektet: bevis at databasen holder](/learn/testing-project-01), hvor C# og en rigtig PostgreSQL-database mødes.
