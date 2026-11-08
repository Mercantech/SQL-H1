---
title: 5. Designmønstre til databaser
slug: relations-05-design-patterns
module: relations
order: 5
kind: theory
objectives:
  - Genkende og vælge almindelige skema-mønstre
  - Modellere n:n med koblingstabel
  - Kende pragmatiske mønstre (lookup, soft delete, audit)
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT p.category, COUNT(*) AS antal_produkter, ROUND(AVG(p.price), 2) AS snitpris
    FROM products p
    GROUP BY p.category
    ORDER BY p.category;
---

# Designmønstre til databaser

Raymond lægger forskellige skitser på bordet: en lookup-tabel, en koblingstabel og en historisk pris på en ordrelinje. **Designmønstre** er genbrugelige løsninger på bestemte behov. Du skal kunne vælge og begrunde et mønster, ikke presse alle tabeller ned i samme opskrift.

> [!RAYMOND:idea-notes] Start med behovet
>
> Kategorien skal have fælles stavning, og ordren skal huske købets pris. Det er to forskellige problemer. Hvilket mønster nedenfor adresserer hvert af dem, og hvilken regel vil du kunne teste bagefter?

## 1) Surrogatnøgle (`id`)

**Mønster:** En entitet får et teknisk SERIAL-/IDENTITY-id som PK. Det er et valg; koblingstabeller kan også have en passende sammensat nøgle.

```sql
SELECT id, name FROM customers ORDER BY id LIMIT 5;
```

| Fordele | Ulemper |
|---------|---------|
| Stabilt, kort, nemt i FK | siger intet forretningsmæssigt |
| Undgår sammensatte nøgler overalt | kan skjule naturlige unikheder (brug `UNIQUE` ekstra) |

Caféen bruger surrogater i alle tre tabeller. Raymond undersøger stadig de naturlige unikheder, fordi et nyt id ikke forhindrer to forretningsmæssigt ens registreringer.

## 2) Lookup / reference-tabel

**Problem:** `products.category` er fri tekst → stavefejl (“Drikke” vs “drikke”).

**Mønster:** egen tabel `categories (id, name)` og `products.category_id → categories.id`.

I seed’et er kategorier stadig tekst (simpelt til undervisning). Du kan *se* grupperingen:

```sql
SELECT p.category, COUNT(*) AS antal_produkter, ROUND(AVG(p.price), 2) AS snitpris
FROM products p
GROUP BY p.category
ORDER BY p.category;
```

En categories-tabel giver fælles identitet, FK-kontrol og plads til kategoriens egne attributter. Det er ikke kategoriteksten alene, der afgør, om products overholder 3NF.

## 3) Koblingstabel til n:n

**Problem:** kunder ↔ produkter er mange-til-mange.

**Mønster:** en tabel i midten — hos os `orders` (forenklet: én linje = ét produkt). I større systemer:

```text
orders (hoved) 1──< order_lines >── products
```

| Tabel | Indeholder |
|-------|------------|
| `orders` | hvem, hvornår, status |
| `order_lines` | produkt, antal, linjepris |

Undervisningsmodellen samler købet i én orders-række pr. produktlinje. Et system med flere produkter på samme ordre har ofte et separat ordrehoved og tilhørende linjer.

```sql
-- n:n via orders: hvilke produkter har Anna købt?
SELECT DISTINCT p.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
WHERE c.name = 'Anna Jensen'
ORDER BY p.name;
```

## 4) 1:1-udvidelse (extension-tabel)

**Mønster:** kerne i `customers`, sjældne/tunge felter i `customer_profiles` med samme PK/FK 1:1.

Bruges når:

- ikke alle kunder har profil
- store JSON/dokument-felter
- separat sikkerhed/adgang

Caféen har ikke 1:1 endnu — men kardinaliteten kender du fra lektion 2.

## 5) Hierarki / self-reference

**Mønster:** `employees.manager_id → employees.id` (træ).

```sql
-- Mønster-illustration med kunder i samme by (ikke ægte hierarki)
SELECT a.name AS kunde_a, b.name AS kunde_b, a.city
FROM customers a
JOIN customers b ON a.city = b.city AND a.id < b.id
ORDER BY a.city, a.name;
```

Et hierarki kræver en faktisk parent-/manager-henvisning. Self-join-eksemplet ovenfor finder blot par i samme by; det viser to aliaser, men **ikke** en model med forældre og børn.

## 6) Soft delete

**Mønster:** slet ikke rækken — sæt `deleted_at` / `is_active = FALSE`.

```sql
-- "Udfas" i stedet for DELETE (status-mønster)
SELECT id, name, in_stock
FROM products
WHERE in_stock = FALSE;
```

`in_stock` angiver lagerstatus, **ikke** om en række er slettet eller arkiveret. SELECT-eksemplet ændrer intet. Et egentligt soft-delete-design skal også definere, hvilke forespørgsler der skjuler slettede rækker, og hvordan unikhed og relationer håndteres.

> [!RAYMOND:skeptical] Udsolgt er ikke det samme som slettet
>
> En udsolgt vare kan komme på lager igen og stadig være synlig i gamle ordrer. Hvis vi senere tilføjer deleted_at, hvilke to forskellige spørgsmål besvarer de to felter så?

## 7) Audit-kolonner

**Mønster:** `created_at`, `updated_at`, `created_by`, …

```sql
SELECT id, name, created_at
FROM customers
ORDER BY created_at, id;
```

De hjælper med support og fejlsøgning, når betydning, adgang og opbevaring er planlagt. Audit-kolonner alene dokumenterer ikke alle ændringer. De kan sættes i applikationslaget eller via triggers.

## 8) Historisk pris på linjen (snapshot)

**Skeln mellem to forskellige priser:**

- **Kun `products.price`:** prisændring ændrer “historikken” semantisk, hvis du joiner bagud.
- **Snapshot:** `orders.unit_price` gemmer prisen *på købstidspunktet*.

Café-seed’et joiner nutidens pris:

```sql
SELECT c.name, p.name, o.quantity, p.price,
       o.quantity * p.price AS linje_nu
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY o.id
LIMIT 8;
```

Et kassesystem skal normalt kunne dokumentere den aftalte stykpris ved købet. Den er en oplysning om købet og behøver ikke være en kopi af produktets pris **nu**. Raymond kalder den derfor en historisk kendsgerning; den er ikke automatisk denormalisering.

## 9) Stjerne vs. snefnug (analytisk — kendskab)

| Mønster | Idé | Brug |
|---------|-----|------|
| **Star** | faktatabel + denormaliserede dimensioner | BI, data warehouse |
| **Snowflake** | dimensioner normaliseret yderligere | mere 3NF i warehouse |

OLTP (det du bygger i SQL-H1) ≈ normaliserede 3NF-tabeller.  
OLAP/rapporter ≈ stjerne med færre JOIN.

## 10) Walk-in / valgfri FK

**Mønster:** FK må være `NULL` = “ingen forælder”.

```sql
SELECT id, customer_id, product_id, quantity
FROM orders
WHERE customer_id IS NULL;
```

`ON DELETE SET NULL` kan bevare ordren, når kundereferencen fjernes, som i DML-cascading-lektionen. En tom kundereference er dog ikke i sig selv en fuld anonymisering; undersøg også, om andre data stadig kan identificere personen.

## Sådan vælger du mønster

| Spørgsmål | Peger på |
|-----------|----------|
| Gentages samme tekst overalt? | Lookup |
| Er relationen n:n? | Koblingstabel |
| Skal historik overleve sletning? | Soft delete / RESTRICT |
| Skal gamle ordrer huske prisen? | Snapshot-kolonne |
| Er feltet sjældent / tungt? | 1:1-extension |
| Er det et træ? | Self-FK |

## Caféen som mønsterkatalog

| Element | Mønster |
|---------|---------|
| `id`-kolonner | Surrogat-PK |
| `orders` mellem kunde og produkt | Kobling / faktalinje |
| `category` tekst | Lookup-kandidat |
| `in_stock` | Lagerstatus, ikke soft delete |
| `created_at` | Audit |
| `customer_id NULL` | Valgfri FK / walk-in |

## 11) Statusmaskine (state column)

**Mønster:** en kolonne som `status TEXT` eller `status_id` med tilladte værdier (`draft`, `paid`, `shipped`, `cancelled`).

- Ofte kombineret med `CHECK` eller lookup-tabel  
- Undgå “magiske” booleans der overlapper (`is_paid`, `is_shipped` der kan modsige hinanden)

Caféen har kun `in_stock` — et minimalt statusflag.

## 12) Event / outbox (kendskab)

Når API’en skal fortælle andre systemer om en ændring, gemmes begivenheden ofte i en **outbox-tabel** i samme transaktion som forretningsdata. Det er et integrationsmønster oven på relational design — nævn det i projektet, hvis I har flere services.

## Anti-mønstre (undgå)

| Anti-mønster | Hvorfor skidt |
|--------------|---------------|
| Én tabel med blandede, uafhængige entiteter | uklare afhængigheder og vanskelige ændringer |
| Ordre-id’er som CSV/array i stedet for den nødvendige barn-tabel | hver henvisning får ikke en almindelig FK-kontrol |
| Slette PK/FK “for at det skal være nemt” | mister integritet |
| Gemme en vilkårlig objektgraf i JSON uden begrundede regler | centrale relationer og integritetskrav kan blive vanskelige at håndhæve |
| Vælge en ofte skiftende nøgle uden opdateringsstrategi | flere referencer skal opdateres korrekt |

PostgreSQL understøtter arrays og JSONB som rigtige datatyper. Vælg dem efter adgangsmønstre og regler; de fritager ikke modellen for designarbejde. For caféens centrale kunde-, produkt- og købsforbindelser bruger vi almindelige tabeller og FK’er.

> [!RAYMOND:question] Hvad er mønstrets pris?
>
> Vælg ét mønster, og forklar både hvilket problem det løser, og hvilket nyt ansvar det giver. En cache skal fx holdes ajour, mens et historisk snapshot netop skal bevare den gamle oplysning.

## Prøv selv

1. Foreslå en `categories`-tabel (kolonner + FK fra `products`) — skriv den som skitse i en kommentar eller på papir.
2. Skitsér `order_lines` adskilt fra `orders` (hvilke kolonner flytter hvorhen?).
3. Argumentér: hvornår vil du gemme `unit_price` på ordren i stedet for kun at joine `products.price`?
4. Peg på ét anti-mønster, I bevidst *ikke* vil bruge i H1-projektet.

Raymonds afsluttende makkercheck: Kan din makker følge dit valg fra forretningskrav til skema og videre til en konkret kontrol? Så har du mere end blot et navn på et mønster.

Læs videre om [arrays og deres anvendelse i PostgreSQL](https://www.postgresql.org/docs/16/arrays.html).
