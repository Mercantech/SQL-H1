# Forudsig og kontrollér en ændring

| Behov i caféen | Kommando | Forventet bevis |
|---|---|---|
| Opret en kunde | `INSERT … RETURNING id, name` | En ny række med det tildelte id. |
| Ret en pris | `UPDATE … WHERE … RETURNING name, price` | Én række pr. berørt vare med den nye pris. |
| Fjern en testordre | `DELETE … WHERE … RETURNING id` | Kommandoen returnerer id'erne fra de slettede rækker. En ny SELECT efter samme id'er finder dem ikke i ordretabellen. |

**Før du ændrer.** Hent målgruppen med samme betingelse i en SELECT. Skriv forventet antal og et id ned. Spørg dig selv, hvad en gentagelse vil gøre. En prisstigning på 2 kr. oven i den nuværende pris bliver til 4 kr. ved to kørsler.

**Når en fremmednøgle blokerer.** Find rækkerne, der peger på det valgte id. Skal historikken bevares, kan varen udfases. Er det testdata, der skal fjernes, kan du slette barnrækker først. Skal en kundereference fjernes og salget bevares, kræver det, at kundekolonnen må være NULL. Vælg ud fra kravet til de efterladte rækker.

**Prøv i morgen.** Forestil dig en prisændring på en ukendt vare. Forudsig antallet af rækker fra RETURNING. Om en uge kan du forklare, hvilke rækker der overlever sletningen af Latte i [FK-opgaven](/learn/dml-ex-03).

[PostgreSQL om RETURNING](https://www.postgresql.org/docs/16/dml-returning.html) · [Handlinger ved sletning](https://www.postgresql.org/docs/16/ddl-constraints.html)
