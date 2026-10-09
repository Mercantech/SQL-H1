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

Indtil nu har du primært **læst** data med `SELECT`. I dette modul **ændrer** du data — og det er en anden disciplin: fejl kan ødelægge rækker, bryde relationer eller ramme hele tabellen, hvis du glemmer et filter.

## Hvad er DML?

**DML** (*Data Manipulation Language*) er den del af SQL, der **manipulerer rækker** i eksisterende tabeller:

| Kommando | Retning | Typisk brug |
|----------|---------|-------------|
| `INSERT` | skriver nye rækker | oprette kunde, produkt, ordre |
| `UPDATE` | ændrer eksisterende rækker | prisændring, status, rettelse |
| `DELETE` | fjerner rækker | annullér ordre, fjern test-data |

`SELECT` hører ofte under **DQL** (*Data Query Language*) — det **læser** uden at ændre. I daglig tale siger mange stadig “SQL”, men skellet er vigtigt: læsning er ufarlig at gentage; skrivning er det ikke.

### DML er ikke DDL

| Familie | Eksempler | Gør |
|---------|-----------|-----|
| **DML** | `INSERT`, `UPDATE`, `DELETE` | ændrer *data* |
| **DDL** | `CREATE TABLE`, `ALTER`, `DROP` | ændrer *struktur* |
| **DCL** | `GRANT`, `REVOKE` | rettigheder |

I SQL-H1’s MVP må du **ikke** køre DDL. Du skal mestre DML oven på det skema, caféen allerede har.

## CRUD — broen til applikationer

I software taler man om **CRUD**:

| CRUD | Betydning | SQL (typisk) |
|------|-----------|--------------|
| **C**reate | opret | `INSERT` |
| **R**ead | læs | `SELECT` |
| **U**pdate | opdatér | `UPDATE` |
| **D**elete | slet | `DELETE` |

Når du senere bygger en .NET-API, mapper endpoints næsten 1:1:

- `POST /products` → `INSERT`
- `GET /products/1` → `SELECT … WHERE id = 1`
- `PUT` / `PATCH /products/1` → `UPDATE … WHERE id = 1`
- `DELETE /products/1` → `DELETE … WHERE id = 1`

**DML er databasenes sprog for CRUD.** Forstår du DML sikkert, forstår du også, hvad din API egentlig gør under motorhjelmen.

```sql
-- Read: overblik før du skriver
SELECT 'products' AS tabel, COUNT(*) AS antal FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
```

## Hvorfor DML føles “farligere” end SELECT

1. **Varighed** — en `UPDATE` uden `WHERE` rammer *alle* rækker med det samme.
2. **Relationer** — en `DELETE` på en kunde kan fejle (eller i andre systemer kaskade-slette ordrer), fordi `orders` peger på kunden.
3. **Constraints** — `NOT NULL`, fremmednøgler og typer afviser dårlige data. Det er en feature, ikke en bug.
4. **Gentagelse** — at køre samme `INSERT` to gange kan give dubletter (medmindre du har unikhedsregler).

Derfor er den vigtigste vane i hele modulet:

> **Læs først (`SELECT`), skriv bagefter (`INSERT`/`UPDATE`/`DELETE`), læs igen.**

## Tre vaner der redder dig

1. **Preview** — skriv `SELECT` med samme `WHERE`, som du vil bruge i `UPDATE`/`DELETE`. Ser resultatet rigtigt ud?
2. **Smal `WHERE`** — brug primærnøgle (`id`) når du kan. Undgå vage filtre som `WHERE city = 'Viborg'` på `DELETE`, medmindre du *mener* alle i Viborg.
3. **Nulstil data** — emulatoren kan genskabe café-seed’et. Brug det aktivt, når du eksperimenterer.

## Café-modellen (kort)

| Tabel | Rolle i CRUD |
|-------|----------------|
| `customers` | Create/Read/Update/Delete på kunder |
| `products` | Create/Read/Update/Delete på menu |
| `orders` | Create/Read/Delete på ordrer (ofte færre “rette produkt”-updates) |

`orders.customer_id` og `orders.product_id` er **fremmednøgler**. Det betyder: du kan ikke (gyldigt) pege på en kunde eller et produkt, der ikke findes — og du kan ofte ikke slette en kunde, der stadig har ordrer.

## Transaktioner — idéen (uden tung syntaks)

I produktion pakkes flere DML-sætninger ofte i en **transaktion**: enten lykkes *alt*, eller *intet* gemmes. Tænk “bestilling = indsæt ordre + opdater lager” — begge eller ingen.

I emulatoren kører hver kørsel typisk som sit eget lille hop. Mentalt skal du stadig tænke: *hvilke rækker ændrer jeg, og i hvilken rækkefølge?*

## Hvad du mestrer i dette modul

1. **INSERT** — Create: én/flere rækker, `DEFAULT`, `INSERT … SELECT`, `RETURNING`
2. **UPDATE** — Update: sikre filtre, udtryk, subqueries, `RETURNING`
3. **DELETE** — Delete: sikre filtre, FK-fejl, rækkefølge, `RETURNING`

Næste lektion: **INSERT** som Create i dybden.
