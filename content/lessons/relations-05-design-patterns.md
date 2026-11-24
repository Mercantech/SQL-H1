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
> Kategorien skal have fælles stavning, og ordren skal huske købets pris. Det er to forskellige problemer. Hvilket mønster vil du bruge til hvert af dem, og hvilken regel vil du kunne teste bagefter?

```teach
{
  "question": "Espresso blev solgt for 28 kr. i går og koster 30 i dag. Hvor skal de to priser bo, hvis en kopi af gårsdagens bon skal kunne udskrives?",
  "answer": "Gem den aftalte stykpris 28 på gårsdagens ordrelinje og dagens menukortpris 30 i products. Så kan prisen på menukortet ændres uden at ændre beløbet på den gamle bon."
}
```

## To krav til din skitse

Tegn først dagens menukort. Alle varer i kategorien Drikke skal pege på den samme kategori, så personalet kan omdøbe kategorien ét sted. Skriv navnene på de to tabeller og sæt en pil fra fremmednøglen til primærnøglen.

Tilføj nu en bonlinje med produkt, antal og den aftalte stykpris. Vis med to tal, hvad der sker med den gamle bon, når menukortets pris ændres.

| Behov | Spor i din skitse | Sådan tester du valget |
|---|---|---|
| Én fælles kategori | En kategorirække og en FK fra hvert produkt | Omdøb kategorien. Alle tilknyttede produkter får det nye kategorinavn i rapporten. |
| En bon med den aftalte pris | En stykpris på den enkelte bonlinje | Hæv prisen på menukortet. Genudskriv gårsdagens bon og sammenlign beløbene. |

> [!RAYMOND:skeptical] Udsolgt er ikke det samme som slettet
>
> I caféen kan en vare blive udsolgt og sælges igen senere. Hvilken af dine tabeller skal stadig kunne fortælle, hvad varen kostede i går?

## Forklar designet til en makker

Byt skitse. Bed din makker udpege det sted, hvor personalet omdøber en kategori, og det sted, hvor kassen læser bonens pris. Hvis en ændring i én række omskriver gårsdagens bon, ret modellen og gentag prisprøven.

> [!RAYMOND:question] Hvad er mønstrets pris?
>
> En ekstra tabel kræver et opslag, og en aftalt pris skal gemmes ved købet. Hvilket ansvar tager din løsning på sig, og hvilket konkret problem løser den?

Find alle [12 mønstre i modulets printvenlige opslag](/modules/relations#opslag).

Fordybelse i PostgreSQL · [Sammensatte nøgler og referencer](https://www.postgresql.org/docs/16/ddl-constraints.html).
