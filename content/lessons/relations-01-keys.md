---
title: 1. Nøgler og relationer
slug: relations-01-keys
module: relations
order: 1
kind: theory
objectives:
  - Skelne primær- og fremmednøgle
  - Skelne naturlig og surrogatnøgle
  - Læse relationer i et skema
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT
      o.id AS ordre,
      o.customer_id,
      c.name AS kunde,
      o.product_id,
      p.name AS produkt
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    ORDER BY o.id
    LIMIT 8;
---

# Nøgler og relationer

Raymond tegner caféens tre tabeller og spørger, hvordan vi sikkert genkender en bestemt kunde. I den relationelle model betegner en **relation** grundlæggende et tabel-lignende sæt af rækker. En **relation mellem tabeller** er forbindelsen, vi her beskriver med nøgler. De to betydninger skal holdes adskilt.

> [!RAYMOND:primary-key] To kunder kan hedde det samme
>
> Jeg får endnu en kunde ved navn Anna Jensen. Hvilken værdi skal en ordre gemme for stadig at pege på den rigtige Anna? Et navn er læsbart, men behøver hverken være unikt eller stabilt.

## Primærnøgle (PK)

**Primærnøglen** identificerer en række entydigt i tabellen.

I café-databasen:

| Tabel | PK |
|-------|-----|
| `customers` | `id` |
| `products` | `id` |
| `orders` | `id` |

Egenskaber du skal kunne:

1. **Unik** — ingen to rækker deler samme PK  
2. **NOT NULL** — altid udfyldt  
3. **Stabil** — skifter helst ikke over tid (undgå “telefonnummer som PK”)

```sql
SELECT id, name FROM customers ORDER BY id;
```

## Fremmednøgle (FK)

En **fremmednøgle** er en kolonne (eller flere), der **peger på** en PK (eller UNIQUE) i en anden tabel — eller samme tabel (self-FK).

| FK | Peger på |
|----|----------|
| `orders.customer_id` | `customers.id` |
| `orders.product_id` | `products.id` |

Det er det, der:

- gør `JOIN … ON o.customer_id = c.id` meningsfuldt  
- kræver, at en udfyldt fremmednøgle henviser til en eksisterende nøgle; en tilladt NULL-værdi betyder derimod, at henvisningen mangler

```sql
SELECT o.id, c.name, p.name, o.quantity
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY o.id;
```

> [!RAYMOND:foreign-key] En valgfri forbindelse er stadig kontrolleret
>
> En walk-in-ordre kan have NULL som kunde-id, hvis kolonnen tillader det. Men et opdigtet, udfyldt kunde-id bliver ikke lovligt af den grund. Forklar forskellen på ingen henvisning og en ugyldig henvisning.

## Naturlig nøgle vs. surrogatnøgle

| Type | Eksempel | Typisk brug |
|------|----------|-------------|
| **Naturlig** | e-mail, CPR, ISBN | kommer fra forretningen |
| **Surrogat** | `SERIAL` / `IDENTITY` `id` | teknisk, genereret af DB |

Caféen bruger **surrogater** som PK. Raymond behandler det som et designvalg: En teknisk nøgle løser identifikation, men forretningsmæssig unikhed kan stadig kræve en særskilt UNIQUE-regel, fx på en påkrævet e-mail.

| Fordele ved surrogat | Ulemper |
|----------------------|---------|
| Kort, stabil FK | siger intet forretningsmæssigt |
| Nemt at joine | du skal huske ekstra `UNIQUE` på naturlige nøgler |

## Kandidatnøgle og alternativ nøgle

- **Kandidatnøgle:** et minimalt sæt kolonner, der identificerer rækken entydigt
- **Primærnøgle:** den kandidat I vælger som “den officielle”  
- **Alternativ nøgle:** øvrige kandidater — ofte modelleret som `UNIQUE`

Eksempel: `customers.email` *kunne* være naturlig nøgle, men er valgfri (`NULL`) i seed’en — derfor egner den sig ikke som PK.

## Sammensat nøgle

Nogle gange er nøglen **flere kolonner** sammen, fx `(order_id, line_no)` på ordrelinjer. Undervisningsmodellen bruger ét `orders.id` pr. linje. Den har endnu ikke et separat ordrehoved med flere linjer.

## Se relationen i data

Walk-in-ordrer har `customer_id IS NULL` — FK’en er **valgfri**. Det er stadig en relation; bare ikke påkrævet for alle rækker.

```sql
SELECT id, customer_id, product_id, quantity
FROM orders
WHERE customer_id IS NULL;
```

## Metadata: find nøglerne selv

```sql
SELECT tc.table_name, tc.constraint_type, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type, kcu.ordinal_position;
```

På **Database**-siden ser du samme relationer som diagram.

## Tænk som API-udvikler

| Domæne | Typisk PK i C# | FK i SQL |
|--------|----------------|----------|
| `Customer` | `Id` (int/Guid) | — |
| `Order` | `Id` | `CustomerId`, `ProductId` |

I ADO.NET/Dapper mapper I `customer_id` → `CustomerId`. Nøglerne er broen mellem SQL og objekter.

> [!RAYMOND:question] Kan du pege begge veje?
>
> Find et ordre-id og følg dets kunde-id til kundens primærnøgle. Forklar, hvorfor kunden kan have flere ordrer, mens ét udfyldt customer_id på ordren kun peger på én kunde.

## Prøv selv

1. Kør JOIN’en øverst — peg på hvilke kolonner der er PK, og hvilke der er FK.  
2. Find en walk-in-ordre og forklar, hvad `NULL` i FK betyder.  
3. Argumentér: hvorfor er `name` *ikke* en god primærnøgle for kunder?
