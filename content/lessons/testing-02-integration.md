---
title: 2. Giv testen en rigtig database
slug: testing-02-integration
module: testing
order: 2
kind: theory
objectives:
  - Skelne unit-, integration- og systemtests
  - Begrunde test med samme databaseprovider som drift
  - Isolere fixtures og gøre tests gentagelige
---

# Giv testen en rigtig database

**Mission · Målpind 24 · 25 minutter.** Raymond får vist en grøn test af GameHubs billetkøb med en liste af C#-objekter. Da samme køb rammer PostgreSQL, fejler det. Han undersøger først, hvad testen overhovedet kørte: en beregning i hukommelsen eller appens rigtige databasekald? En grøn test er et svar på det spørgsmål, den faktisk stillede.

> [!RAYMOND:skeptical] Hvilket lag har givet grønt lys?
>
> Jeres C#-test kan tilføje samme billetkode to gange til en liste. Siger det noget om en `UNIQUE`-regel i PostgreSQL? Peg på **den komponent, testen faktisk bruger**, før I fortolker resultatet.

## Vælg testen efter spørgsmålet

| Type | GameHub-spørgsmål | Hvad den ikke alene beviser |
|---|---|---|
| Unit | Beregner vores præmiefunktion rigtigt? | At SQL kan oversættes eller constraints virker |
| Integration | Kan vores C#-kode indsætte en gyldig billet og afvise dubletter i PostgreSQL? | At hele browserflowet virker |
| System | Kan en autoriseret bruger gennemføre en tilmelding? | Alle tænkelige NULL- og grænsetilfælde |

Raymond bruger tabellen til at vælge et passende forsøg. En unit-test er god til en afgrænset beregning. Når spørgsmålet handler om SQL-oversættelse, datatyper eller constraints, skal den relevante databaseprovider med i forsøget.

EF Core InMemory er ikke en relationel PostgreSQL-motor. SQLite har også andre SQL-funktioner, typer og regler. De kan være nyttige i bestemte tests, men et grønt resultat erstatter ikke provider-specifikke integrationstests. Test mod en separat database af samme type som drift; brug aldrig produktionsdata eller produktionsforbindelsen.

## Lille, tydelig og gentagelig

Raymond starter hver kørsel med kendte data, så et gammelt billetkøb ikke bliver forklaringen på en ny fejl. Labben opretter sit eget tilfældigt navngivne schema. Fixtures indeholder kun fiktive spillere, og alle objekter ryddes op efter kørslen. Den mekanisme isolerer kørsler fra hinanden; en transaktion pr. test kan være en anden strategi. Test af samtidighed kræver mindst to rigtige forbindelser og kan ikke bevises af én delt rollback-transaktion.

I kodeudsnittet nedenfor er forbindelsen og kommandoen allerede sat op med testens ugyldige input. Læs de to mulige fejlveje, før I kører: Udebliver databasefejlen, kaster testen sin egen fejl. Kommer en anden SQLSTATE, bliver den ikke opsnappet af det viste filter.

```csharp
try
{
    // Kør præcis den ugyldige handling.
    await command.ExecuteNonQueryAsync();
    throw new Exception("Forventede en constraintfejl");
}
catch (PostgresException ex) when (ex.SqlState == "23514")
{
    // Den forventede CHECK-regel afviste inputtet.
}
```

Det er en fejlet test, hvis SQL ikke fejler eller fejler med en anden SQLSTATE. Test også den gyldige naboværdi, så en løsning, der afviser alt, ikke får grønt lys.

> [!RAYMOND:question] Hvad sker der uden CHECK-reglen?
>
> Forudsig vejen gennem `try` og `catch`, hvis databasen accepterer det ugyldige input. Hvorfor må testens egen fejl **ikke** blive fanget som en forventet constraintfejl?

## Fra terminal til evidens

Hent [sikkerheds- og testlabben](/downloads/security-testing-lab.zip). Kør `docker compose run --rm lab` efter README'ens opsætning. Raymond læser både testnavn, forventning og udfald; en databasecontainer, der starter, beviser kun, at infrastrukturen kunne starte. Testprogrammet returnerer exitkode 1 ved fejl, så det senere kan køres i CI. Påstanden »vores CHECK virker« skal have et faktisk testresultat.

Parøvelse: fjern CHECK-reglen midlertidigt i labbens fixtures. Hvilken test bliver rød? Gendan reglen og kør igen. Det er en lille mutationstest: I viser, at testen kan opdage den fejl, den hævder at beskytte imod.

> [!RAYMOND:testing] Gør testen rød med vilje
>
> Gem resultatet med reglen, uden reglen og efter gendannelse. Hvis alle tre kørsler er grønne, så undersøg, om testen bruger **jeres ændrede fixture** og faktisk forsøger den ugyldige handling.

Kilde: [Microsoft: valg af teststrategi](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy).
