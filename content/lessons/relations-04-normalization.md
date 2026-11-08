---
title: 4. Database-design og normalisering
slug: relations-04-normalization
module: relations
order: 4
kind: theory
objectives:
  - Forklare formålet med database-design
  - Anvende 1NF, 2NF og 3NF på café-eksempler
  - Genkende opdaterings-, indsættelses- og sletteanomalier
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.name AS kunde, c.city, p.name AS produkt, p.price, o.quantity, o.order_date
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    ORDER BY o.order_date, c.name
    LIMIT 12;
---

# Database-design og normalisering

Raymond får et ark, hvor kundens by står på hver ordrelinje. Anna er flyttet, men kun halvdelen af linjerne er rettet. **Database-design** handler om at vælge tabeller, kolonner, nøgler og forbindelser, så sådanne oplysninger kan vedligeholdes sammenhængende.

Caféens skema adskiller kunder, produkter og køb. Vi bruger det til at undersøge **normalisering**: Hvilke kendsgerninger hører sammen, og hvilke afhængigheder skal modellen udtrykke?

> [!RAYMOND:curious] Hvor mange steder skal Anna flytte?
>
> Hvis kundens aktuelle by gentages på alle ordrelinjer, hvor mange steder skal vi rette den? Find også ud af, om rapporten skal vise kundens by nu eller leveringsbyen ved købet. Det er forskellige oplysninger.

## Hvad prøver vi at undgå?

Hvis alt lå i **én flad “Excel-tabel”**, kunne en “ordre-linje” se sådan ud:

| kunde | by | produkt | pris | antal | dato |
|-------|-----|---------|------|-------|------|
| Anna Jensen | Viborg | Espresso | 28 | 2 | 2024-04-01 |
| Anna Jensen | Viborg | Croissant | 22.50 | 1 | 2024-04-02 |
| Bo Nielsen | Aarhus | Latte | 35 | 1 | 2024-04-02 |

Du kan *simulere* den flade verden med et JOIN (data er stadig normaliseret under motorhjelmen):

```sql
SELECT c.name AS kunde, c.city, p.name AS produkt, p.price, o.quantity, o.order_date
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY o.order_date, c.name
LIMIT 12;
```

Læg mærke til **redundans**: Annas by gentages; Espressos pris gentages på hver linje. Det er udgangspunktet for normalisering.

## Tre klassiske anomalier

| Anomali | Problem i den flade tabel |
|---------|---------------------------|
| **Opdateringsanomali** | Anna flytter til Randers — du skal huske at rette *alle* hendes linjer. Glemmer du én, lyver data. |
| **Indsættelsesanomali** | Du vil registrere et nyt produkt *før* nogen har købt det — men “pris” findes kun på ordrelinjer. |
| **Sletteanomali** | Sidste ordre med “Chokoladebolle” slettes — produktets pris/historik forsvinder med. |

Normalisering splitter data, så hver kendsgerning gemmes **ét sted**.

## Normalformer (det du skal kunne)

Vi fokuserer på **1NF → 2NF → 3NF**. (Der findes BCNF, 4NF, … — kendskab; 3NF er et nyttigt udgangspunkt for mange transaktionssystemer.)

### 1NF — First Normal Form

**Regel (praktisk):**

1. Hver celle har **én værdi for den valgte attribut**. I vores ordrelinjemodel skal produktreferencer ikke pakkes sammen i en liste.
2. Hver række er unik (har en nøgle).
3. Ingen gentagne kolonnegrupper (`produkt1`, `produkt2`, …).

**Dårligt (bryder 1NF):**

| ordre_id | kunde | produkter |
|----------|-------|-----------|
| 1 | Anna | Espresso, Croissant |

**Bedre:** én række pr. ordrelinje (som vores `orders` — forenklet linje-model).

```sql
-- Én værdi pr. celle, én linje pr. køb
SELECT o.id, c.name, p.name, o.quantity
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
WHERE c.name = 'Anna Jensen'
ORDER BY o.id;
```

### 2NF — Second Normal Form

**Forudsætter 1NF.**  
**Arbejdsregel:** Ingen attribut, der står uden for alle kandidatnøgler, må afhænge af kun en del af en sammensat kandidatnøgle. En kandidatnøgle er et minimalt sæt attributter, som identificerer en række; analysen handler ikke kun om den PK, vi tilfældigvis vælger.

Eksempel: Antag, at `(ordre_id, produkt_id)` er en kandidatnøgle, og at hver ordre har én kunde. Så afhænger kundenavnet gennem ordren af `ordre_id`, mens produktnavnet afhænger af `produkt_id`. Begge bliver gentaget på linjerne uden at afhænge af hele nøglen.

**I caféen:** kundenavn og by bor i `customers`, ikke gentaget på hver `orders`-række. Pris og produktnavn bor i `products`.

```sql
-- orders gemmer ID'er — ikke navne/priser
SELECT id, customer_id, product_id, quantity, order_date
FROM orders
ORDER BY id
LIMIT 8;
```

> [!RAYMOND:normalize] Et nyt id løser ikke alle afhængigheder
>
> Hvis vi tilføjer et teknisk id til en flad tabel, forsvinder de gentagne kunde- og produktoplysninger ikke af sig selv. Beskriv stadig kandidatnøglerne og hvilke kendsgerninger, der bestemmer andre værdier.

### 3NF — Third Normal Form

**Forudsætter 2NF.**  
**Arbejdsregel for vores eksempler:** Fjern transitive afhængigheder, hvor en ikke-nøgle-oplysning bestemmer en anden ikke-nøgle-oplysning. Den formelle 3NF-definition tager også højde for kandidatnøgler og attributter, der indgår i dem; her bruger vi den enklere regel på caféens almindelige entiteter.

**Dårligt eksempel:**

| produkt_id | name | category | category_manager |
|------------|------|----------|------------------|
| 1 | Espresso | Drikke | Mia |

Antag, at hver kategori har én ansvarlig. Så bestemmer `category` værdien af `category_manager`. Skifter kategorien ansvarlig, skal mange produktrækker ellers rettes.

**Bedre i dette tilfælde:** Gem kategoriens ansvarlige i en categories-tabel. Seedet har kun en kategoritekst, ikke en kategoriansvarlig. Tekstfeltet alene er derfor ikke et 3NF-brud; en lookup-tabel kan stadig give fælles stavning, identitet og FK-kontrol.

## Fra fladt ark til café-design

| Kendsgerning | Hører hjemme i |
|--------------|----------------|
| Kundens navn og by | `customers` |
| Produktets navn, kategori, pris | `products` |
| At en kunde købte et produkt (antal, dato) | `orders` |

```text
customers (1) ──< orders >── (1) products
```

Det er **normaliseret 1:n / n:1** via en koblingstabel (`orders`).

## Normalisering vs. denormalisering

| | Normaliseret | Denormaliseret |
|--|--------------|----------------|
| Mål | færre problematiske gentagelser og anomalier | enklere læsninger eller mindre gentaget beregningsarbejde |
| Typisk | OLTP (daglig CRUD) | rapporter, data warehouse, cache |
| Risiko | flere JOIN | inkonsistens ved opdatering |

Raymond starter med en sammenhængende model til daglige transaktioner. Hvis læsebehov senere kræver afledte kopier, skal vi beskrive, hvordan de holdes korrekte. Færre JOINs er ikke i sig selv et bevis på bedre performance.

## Designproces (mini-opskrift)

1. Find **substantiver** i forretningen (kunde, produkt, ordre).
2. Find **relationer** (1:n, n:n).
3. Vælg **nøgler** (surrogat `id` er ok og almindeligt).
4. Placér hver attribut dér, hvor den **afhænger af nøglen**.
5. Tjek 1NF → 2NF → 3NF med anomalierne i baghovedet.
6. Tegn E/R (se også Database-siden) og verificér med `SELECT`/`JOIN`.

## Funktionelle afhængigheder (sproget bag normalformerne)

Skriv **A → B** når værdien af A bestemmer B.

I caféen (forenklet):

| Afhængighed | Læsning |
|-------------|---------|
| `customers.id → name, city, email` | kendt kunde-id ⇒ kendt profil |
| `products.id → name, category, price` | kendt produkt ⇒ kendt stamdata |
| `orders.id → customer_id, product_id, quantity, order_date` | kendt ordre ⇒ kendt linje |

2NF/3NF handler om at **ikke** have afhængigheder, der “hænger skævt” ift. nøglen (delnøgle eller transitativt via en ikke-nøgle).

### Hurtig kontrol for vores enkle modeller

I en tabel med én kandidatnøgle K kan du bruge denne kontrol for hver ikke-nøgle-kolonne X:

1. Afhænger X af hele K? (ellers brud på 2NF ved sammensat K)  
2. Afhænger X kun af K — ikke af en anden ikke-nøgle Y? (ellers brud på 3NF: K → Y → X)

Hvis `category_manager` afhænger af `category`, og `category` ikke identificerer produktet, falder produktmodellen ovenfor på test 2. Har tabellen flere overlappende kandidatnøgler, skal I bruge den fulde definition frem for denne genvej.

## BCNF — kort kendskab

**Boyce–Codd Normal Form** er strengere end 3NF: I hver ikke-triviel funktionel afhængighed skal den bestemmende side være en **supernøgle** — et sæt attributter, der identificerer rækken, eventuelt med ekstra attributter. En kandidatnøgle er en minimal supernøgle. Her er BCNF perspektiv; øvelserne fokuserer på at forklare og forbedre caféens design.

## Normalisering i praksis (café-walkthrough)

Start med den flade tabel (kunde, by, produkt, pris, antal, dato):

1. **1NF:** én linje pr. køb — ikke kommaseparerede produkter.  
2. **Afhængigheder:** Gør nøglen tydelig. Under den beskrevne sammensatte nøgle hører ordrehovedets kundeoplysninger og produktets stamdata ikke til på hver linje.
3. **3NF:** Tilføjer I en kategoriansvarlig, som bestemmes af kategorien, så placér den oplysning ved kategorien. En kategoritekst alene gør ikke modellen til "3NF-light".

> [!RAYMOND:skeptical] Hvilken pris er en kendsgerning?
>
> Produktets pris nu og den aftalte stykpris ved et tidligere køb kan være forskellige fakta. At gemme købets stykpris er derfor ikke automatisk et brud på normalisering. Forklar først, hvilket tidspunkt og hvilken hændelse prisen beskriver.

## Prøv selv

1. Kør den flade `SELECT` øverst. Peg på tre steder med **redundans**.
2. Forklar med egne ord: hvad sker der ved opdateringsanomali, hvis Annas by kun fandtes på ordrelinjer?
3. Argumentér for, hvorfor `price` ligger på `products` og ikke på `orders` i vores seed (tip: prisændring vs. historisk linjepris — begge designs findes; kend trade-off).
4. Skriv tre funktionelle afhængigheder for caféen med pil-notation.

Næste lektion: **designmønstre** (lookup, koblingstabel, soft delete, stjerne m.m.).

Kilder: [Microsofts introduktion til normalisering](https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description), [Griffith Universitys normaliseringsdefinitioner](https://www.ict.griffith.edu.au/normalization_tools/normalization/assets/Functional%20Dependencies%20and%20Normalization.pdf) og [PostgreSQLs nøgler og constraints](https://www.postgresql.org/docs/16/ddl-constraints.html).
