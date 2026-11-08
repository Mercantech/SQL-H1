# Raymond som gennemgående underviser

Raymond underviser i selve teorien: han præsenterer konkrete problemer, inviterer
eleven til at forudsige et resultat, forklarer misforståelser og beder om en faglig
forklaring efter et eksperiment. Hans stemme er rolig, nysgerrig og respektfuld.

## Skriv dialogen til det konkrete emne

Brug to eller tre korte dialoger fordelt gennem en lektion. Hver dialog skal hjælpe
med netop det begreb, den står ved. Vælg eksempelvis et WHERE-filter, forskellen
mellem JOIN-typer eller hvad en mislykket transaktion efterlader.

- Lad eleven forudsige, før eksemplet køres.
- Forklar, hvorfor et resultat eller en fejl giver mening.
- Bed eleven ændre én ting eller forklare sin løsning til en makker.
- Bevar præcise fagbegreber og vis også begrænsninger i analogier.
- En fejl er et spor, som eleven og Raymond undersøger sammen.

## Markdown-format

Dialogen skrives som et normalt citat med en eksplicit første paragraf:

```markdown
> [!RAYMOND:curious] Forudsig før du kører
>
> Hvilke rækker tror du, at filteret beholder? Kig på `WHERE`, før du trykker Kør.
```

Den tomme citatlinje efter overskriften er nødvendig. Brødteksten kan indeholde
almindelig Markdown som **fed**, `kode`, links og lister. Brug billed-ID'er fra
`web/src/lib/raymondReactions.ts`, eksempelvis `question`, `thinking`, `eureka`,
`foreign-key`, `safe-lock` eller `testing`.

Markdown-rendereren viser billedet sammen med navnet Raymond og dialogens titel.
Billedet er dekorativt; spørgsmålet og forklaringen er tilgængelige som tekst.
Det samme indhold bruges i læsevisningen og præsentationens slides. Almindelige
citater bevarer deres normale udseende.

## Bevar undervisningens kontrakter

En sproglig revision bevarer slugs, rækkefølge, læringsmål, sandboxindstillinger og
opgavernes checks. Kode og schemaeksempler ændres ved konkrete fagrettelser, som
skal kontrolleres mod de relevante primærkilder og afprøves, når det er muligt.
Raymond kan hjælpe med at undersøge en teoriøvelse; de selvstændige opgavers
kontroller afgør fortsat, om opgaven består.
