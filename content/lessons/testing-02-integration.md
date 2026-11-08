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

**Mission · Målpind 24 · 25 minutter.** En test er grøn med en liste af C#-objekter. Appen fejler alligevel med PostgreSQL. Har nogen snydt? Nej: de to tests stillede forskellige spørgsmål.

## Vælg testen efter spørgsmålet

| Type | GameHub-spørgsmål | Hvad den ikke alene beviser |
|---|---|---|
| Unit | Beregner vores præmiefunktion rigtigt? | At SQL kan oversættes eller constraints virker |
| Integration | Kan vores C#-kode indsætte en gyldig billet og afvise dubletter i PostgreSQL? | At hele browserflowet virker |
| System | Kan en autoriseret bruger gennemføre en tilmelding? | Alle tænkelige NULL- og grænsetilfælde |

EF Core InMemory er ikke en relationel PostgreSQL-motor. SQLite har også andre SQL-funktioner, typer og regler. De kan være nyttige i bestemte tests, men et grønt resultat erstatter ikke provider-specifikke integrationstests. Test mod en separat database af samme type som drift; brug aldrig produktionsdata eller produktionsforbindelsen.

## Lille, tydelig og gentagelig

Labben opretter sit eget tilfældigt navngivne schema. Fixtures indeholder kun fiktive spillere, og alle objekter ryddes op efter kørslen. Den mekanisme isolerer kørsler fra hinanden; en transaktion pr. test kan være en anden strategi. Test af samtidighed kræver mindst to rigtige forbindelser og kan ikke bevises af én delt rollback-transaktion.

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

## Fra terminal til evidens

Hent [sikkerheds- og testlabben](/downloads/security-testing-lab.zip). Kør `docker compose run --rm lab` efter README'ens opsætning. Testprogrammet returnerer exitkode 1 ved fejl, så det senere kan køres i CI. Docker-driveren er infrastruktur; påstanden »vores CHECK virker« skal stadig have et faktisk testresultat.

Parøvelse: fjern CHECK-reglen midlertidigt i labbens fixtures. Hvilken test bliver rød? Gendan reglen og kør igen. Det er en lille mutationstest: I viser, at testen kan opdage den fejl, den hævder at beskytte imod.

Kilde: [Microsoft: valg af teststrategi](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy).
