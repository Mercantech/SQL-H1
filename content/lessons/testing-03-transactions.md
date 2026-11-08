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

**Mission · Målpind 24 · 25 minutter.** Raymond åbner to forbindelser til GameHubs testdatabase. Begge spillere vil have finalens sidste plads. Et vellykket køb med én forbindelse beviser ikke, hvad der sker med to, så han skriver forventningen først: én billet, én vinder og nul resterende pladser. Bagefter vil han gendanne data og gentage forsøget.

> [!RAYMOND:transaction] To købere, én fælles regel
>
> Begge klienter når at læse `remaining = 1`. Hvilken handling afgør, hvem der får pladsen? En tidligere læsning er ikke et bevis på, at **pladsen stadig er ledig**, når klienten skriver.

## En læsning er ikke en reservation

Raymond samler kontrollen og ændringen i samme SQL-statement. Hvis begge klienter først læser `remaining = 1`, kan begge tro, at de må købe. Én robust byggeklods er et betinget UPDATE:

```sql
UPDATE tournaments
SET remaining = remaining - 1
WHERE id = 1 AND remaining > 0
RETURNING remaining;
```

Ved PostgreSQLs standardniveau **Read Committed** venter en konkurrerende opdatering på den første og vurderer derefter betingelsen på den opdaterede række. Når den første reservation committes, er `remaining > 0` ikke længere sand. Fra starttilstanden én plads skal kun én af de to gennemførte reservationer få en række tilbage.

Raymond tæller derfor returnerede rækker, ikke kun fejl. Nul returnerede rækker betyder udsolgt eller ukendt id og skal håndteres bevidst. Skal reservationen også oprette en billet, hører de to ændringer til i samme transaktion. Fejler billetindsættelsen, skal pladsen gives tilbage gennem rollback. Andre isolationsniveauer kan give en serialiseringsfejl, som appen må håndtere med en passende retry-strategi for hele transaktionen. Unikke nøgler og låsning er også byggeklodser afhængigt af reglen.

> [!RAYMOND:question] SQL lykkedes, men fik du en plads?
>
> Den anden `UPDATE` gennemføres uden SQL-fejl og returnerer **nul rækker**. Må appen nu vise »billet købt«? Beskriv den kontrol, der skal ske, før den opretter en billet eller lover brugeren en plads.

## Tre tests der afslører mere end en demo

1. **Rollback:** reservér plads og opret billet i en transaktion; fremprovokér en fejl; rul tilbage og kontrollér begge tabeller.
2. **Samtidighed:** brug to forbindelser mod én resterende plads; saml resultater; kontrollér én vinder og nul resterende pladser.
3. **Regression:** gentag efter en modelændring. Test både den nye regel og de gamle regler, der stadig skal gælde.

Raymond kontrollerer både svarene fra forbindelserne og den endelige datatilstand. Ét »succes« i loggen er ikke tilstrækkeligt, hvis der bagefter ligger to billetter. Labben har en samtidig sidste-plads-test og en rollback-test. Den viser et lille afgrænset tilfælde; den er ikke en fuld belastningstest eller et bevis for alle mulige tidsplaner. En integrationstest må ikke hænge uendeligt: anvend tidsgrænser og undersøg deadlocks som reelle fejlscenarier.

## Backup: gendan før du stoler på den

Til sidst beder Raymond et andet hold om at få GameHub op at køre fra backup. En fil med et pænt navn beviser ikke, at restore virker. I det lokale projekt skal I:

- Eksportere labdata med `pg_dump` og gemme dumpet privat.
- Gendanne til en **separat** lokal database eller separat Compose-projekt.
- Kontrollere schema, rækkeantal og en forretningsregel.
- Dokumentere kommando, tidspunkt og resultat samt håndtering af krypteringsnøgle, hvis dumpet krypteres.

Slet aldrig originaldatabasen for at afprøve restore. En SQL-H1-nulstilling genindlæser et seed; den er ikke en backup af jeres arbejde.

> [!RAYMOND:restore] Gentag en regel efter gendannelsen
>
> Tabellen og rækkerne er tilbage. Kan den gendannede database stadig afvise en dubletbillet? Vælg **én gyldig og én ugyldig handling** fra testplanen, og gem udfaldet sammen med restore-resultatet.

Gå videre til [projektet: bevis at databasen holder](/learn/testing-project-01). Bonus: bed et andet hold om at finde én manglende test i jeres plan.

Kilder: [PostgreSQL: transaktioner](https://www.postgresql.org/docs/16/tutorial-transactions.html), [PostgreSQL: samtidighed](https://www.postgresql.org/docs/16/transaction-iso.html), [PostgreSQL: pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html).
