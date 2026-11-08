---
title: 1. Introduktion til DML og CRUD
slug: dml-01-intro
module: dml
order: 1
kind: theory
objectives:
  - Skelne DML fra SELECT (og DDL)
  - Koble INSERT/SELECT/UPDATE/DELETE til CRUD
  - Forstå hvorfor skrivning kræver forsigtighed
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    SELECT 'products' AS tabel, COUNT(*) AS antal FROM products
    UNION ALL
    SELECT 'customers', COUNT(*) FROM customers
    UNION ALL
    SELECT 'orders', COUNT(*) FROM orders;
---

# Introduktion til DML og CRUD

Raymond har opdaget en forkert pris på caféens menukort. En `SELECT` kan vise fejlen, men den retter den ikke. Nu skal du hjælpe ham med at **ændre data** og bagefter kontrollere, at kun de ønskede rækker blev ramt.

## Hvad er DML?

**DML** (*Data Manipulation Language*) er den del af SQL, der **manipulerer rækker** i eksisterende tabeller:

| Kommando | Retning | Typisk brug |
|----------|---------|-------------|
| `INSERT` | skriver nye rækker | oprette kunde, produkt, ordre |
| `UPDATE` | ændrer eksisterende rækker | prisændring, status, rettelse |
| `DELETE` | fjerner rækker | annullér ordre, fjern test-data |

I undervisning kaldes forespørgsler ofte **DQL** (*Data Query Language*); andre inddelinger regner `SELECT` med til DML. Raymond bruger her skellet **læse rækker / ændre rækker / ændre struktur**. Det hjælper dig med at forudsige, hvad de konkrete kommandoer gør.

### DML er ikke DDL

| Familie | Eksempler | Gør |
|---------|-----------|-----|
| **DML** | `INSERT`, `UPDATE`, `DELETE` | ændrer *data* |
| **DDL** | `CREATE TABLE`, `ALTER`, `DROP` | ændrer *struktur* |
| **DCL** | `GRANT`, `REVOKE` | rettigheder |

DDL (`CREATE TABLE` m.m.) ligger i modulet *Tabeller og E/R*. Her mestrer du **DML** oven på café-skemaet — senere må du gerne ændre strukturen i din egen database.

> [!RAYMOND:question] En ny kunde eller en rettelse?
>
> En gæst besøger caféen for første gang; en anden har skiftet e-mail. Hvilken handling opretter en ny række, og hvilken skal finde en eksisterende? Beskriv forskellen, før du vælger kommando.

## CRUD — broen til applikationer

I software taler man om **CRUD**:

| CRUD | Betydning | SQL (typisk) |
|------|-----------|--------------|
| **C**reate | opret | `INSERT` |
| **R**ead | læs | `SELECT` |
| **U**pdate | opdatér | `UPDATE` |
| **D**elete | slet | `DELETE` |

Raymond viser en enkel CRUD-API som eksempel. De konkrete HTTP-endpoints kan være:

- `POST /products` → `INSERT`
- `GET /products/1` → `SELECT … WHERE id = 1`
- `PUT` / `PATCH /products/1` → `UPDATE … WHERE id = 1`
- `DELETE /products/1` → `DELETE … WHERE id = 1`

**SQL forbinder CRUD med databasen.** Når du læser en API-metode, så spørg med Raymond: Hvilke rækker læser eller ændrer den, og hvad forventer den tilbage?

```sql
-- Read: overblik før du skriver
SELECT 'products' AS tabel, COUNT(*) AS antal FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
```

## Hvorfor DML føles “farligere” end SELECT

1. **Omfang** — en `UPDATE` uden `WHERE` forsøger at ændre *alle* rækker.
2. **Relationer** — en `DELETE` på en kunde kan fejle (eller i andre systemer kaskade-slette ordrer), fordi `orders` peger på kunden.
3. **Constraints** — `NOT NULL`, fremmednøgler og typer afviser dårlige data. Det er en feature, ikke en bug.
4. **Gentagelse** — at køre samme `INSERT` to gange kan give dubletter (medmindre du har unikhedsregler).

Derfor er den vigtigste vane i hele modulet:

> **Læs først (`SELECT`), skriv bagefter (`INSERT`/`UPDATE`/`DELETE`), læs igen.**

## Tre vaner der redder dig

1. **Preview** — skriv `SELECT` med samme `WHERE`, som du vil bruge i `UPDATE`/`DELETE`. Ser resultatet rigtigt ud?
2. **Smal `WHERE`** — brug primærnøgle (`id`) når du kan. Undgå vage filtre som `WHERE city = 'Viborg'` på `DELETE`, medmindre du *mener* alle i Viborg.
3. **Nulstil data** — emulatoren kan genskabe café-seed’et. Brug det aktivt, når du eksperimenterer.

> [!RAYMOND:warning] Se før og efter
>
> Jeg vil kunne pege på de rækker, jeg forventer at ændre. Brug samme filter i din kontrol-`SELECT`, udfør ændringen, og læs igen. Et godt filter beskytter ikke mod alle samtidighedsproblemer, men det afslører mange fejl i din hensigt.

## Café-modellen (kort)

| Tabel | Rolle i CRUD |
|-------|----------------|
| `customers` | Create/Read/Update/Delete på kunder |
| `products` | Create/Read/Update/Delete på menu |
| `orders` | Create/Read/Delete på ordrer (ofte færre “rette produkt”-updates) |

`orders.customer_id` og `orders.product_id` er **fremmednøgler**. Det betyder: du kan ikke (gyldigt) pege på en kunde eller et produkt, der ikke findes — og du kan ofte ikke slette en kunde, der stadig har ordrer.

## Transaktioner — idéen (uden tung syntaks)

I produktion pakkes flere DML-sætninger ofte i en **transaktion**: enten lykkes *alt*, eller *intet* gemmes. Tænk “bestilling = indsæt ordre + opdater lager” — begge eller ingen.

I SQL-H1 bruger hver kørsel en ny forbindelse. Skal flere trin dele en eksplicit transaktion, skal hele `BEGIN` … `COMMIT` eller `ROLLBACK` sendes i samme kørsel. Raymond vender tilbage til den arbejdsgang i transaktionslektionen.

## Hvad du mestrer i dette modul

1. **INSERT** — Create: én/flere rækker, `DEFAULT`, `INSERT … SELECT`, `RETURNING`
2. **UPDATE** — Update: sikre filtre, udtryk, subqueries, `RETURNING`
3. **DELETE** — Delete: sikre filtre, FK-fejl, rækkefølge, `RETURNING`

Næste lektion: **INSERT** som Create i dybden.

> [!RAYMOND:idea-notes] Forklar caféens næste ændring
>
> Vælg én handling: opret et produkt, ret en pris eller fjern en testordre. Sig først **kommando**, **mål-rækker** og **kontrol bagefter**. Kan en makker forklare planen tilbage til dig?
