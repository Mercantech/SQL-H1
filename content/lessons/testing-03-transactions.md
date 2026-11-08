---
title: 3. Den sidste plads og den brugbare backup
slug: testing-03-transactions
module: testing
order: 3
kind: theory
objectives:
  - Beskrive samtidighedstest med to forbindelser
  - Afprøve transaktioners atomaritet og rollback
  - Planlægge en verificeret backup/restore-regression
---

# Den sidste plads og den brugbare backup

**Mission · Målpind 24 · 25 minutter.** To spillere trykker »Tilmeld« samtidig. Der er én plads tilbage. Raymond vil se et eksperiment, ikke et gæt.

## En læsning er ikke en reservation

Hvis begge klienter først læser `remaining = 1`, kan begge tro, at de må købe. Én robust byggeklods er et betinget UPDATE:

```sql
UPDATE tournaments
SET remaining = remaining - 1
WHERE id = 1 AND remaining > 0
RETURNING remaining;
```

Præcis én af to samtidige købere må få en række tilbage, når starttilstanden har én plads. Nul returnerede rækker betyder udsolgt eller ukendt id og skal håndteres bevidst. Skal reservationen også oprette en billet, hører de to ændringer til i samme transaktion. Unikke nøgler, låsning og isolation er andre byggeklodser afhængigt af reglen.

## Tre tests der afslører mere end en demo

1. **Rollback:** reservér plads og opret billet i en transaktion; fremprovokér en fejl; rul tilbage og kontrollér begge tabeller.
2. **Samtidighed:** brug to forbindelser mod én resterende plads; saml resultater; kontrollér én vinder og nul resterende pladser.
3. **Regression:** gentag efter en modelændring. Test både den nye regel og de gamle regler, der stadig skal gælde.

Labben har en samtidig sidste-plads-test og en rollback-test. Den viser et lille afgrænset tilfælde; den er ikke en fuld belastningstest eller et bevis for alle mulige tidsplaner. En integrationstest må ikke hænge uendeligt: anvend tidsgrænser og undersøg deadlocks som reelle fejlscenarier.

## Backup: gendan før du stoler på den

En fil med et pænt navn beviser ikke, at restore virker. I det lokale projekt skal I:

- Eksportere labdata med `pg_dump` og gemme dumpet privat.
- Gendanne til en **separat** lokal database eller separat Compose-projekt.
- Kontrollere schema, rækkeantal og en forretningsregel.
- Dokumentere kommando, tidspunkt og resultat samt håndtering af krypteringsnøgle, hvis dumpet krypteres.

Slet aldrig originaldatabasen for at afprøve restore. En SQL-H1-nulstilling genindlæser et seed; den er ikke en backup af jeres arbejde.

Gå videre til [projektet: bevis at databasen holder](/learn/testing-project-01). Bonus: bed et andet hold om at finde én manglende test i jeres plan.

Kilder: [PostgreSQL: transaktioner](https://www.postgresql.org/docs/16/tutorial-transactions.html), [PostgreSQL: samtidighed](https://www.postgresql.org/docs/16/transaction-iso.html), [PostgreSQL: pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html).
