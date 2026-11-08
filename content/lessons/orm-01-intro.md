---
title: "1. ORM — Raymond ansætter en oversætter"
slug: orm-01-intro
module: orm
order: 1
kind: theory
objectives:
  - Forklare hvordan objekter og relationelle tabeller mappes til hinanden
  - Skelne mellem ADO.NET, Dapper og EF Core
  - Forklare at ORM er et adgangslag og ikke en ny databasetype
---

# ORM — Raymond ansætter en oversætter

![Raymond arbejder med objektmodeller](/raymond/course/orm.webp)

Raymond vil åbne **GameHub**: et sted, hvor spillere finder turneringer og tilmelder sig. SQL kan du allerede. Nu skal din C#-kode tale med databasen uden at du manuelt flytter hver eneste kolonne ind i hvert eneste objekt.

> [!RAYMOND:question] Hvem oversætter bestillingen?
>
> “Jeg bestilte en liste af turneringer. Hvorfor sidder jeg stadig og kalder `reader.GetString(1)`?” Følg én **titel** fra resultatkolonne til C#-objekt: hvilket arbejde vil du lade værktøjet overtage?

Et **ORM**, Object Relational Mapper, forbinder en objektmodel med relationelle data. En `Tournament` kan blive til en række, `Id` til en primærnøgle og en liste af tilmeldinger til en relation med fremmednøgler. SQL og PostgreSQL findes stadig under motorhjelmen.

## Samme bestilling, tre værktøjer

| Adgang fra C# | Det skriver du selv | Det hjælper værktøjet med |
|---|---|---|
| ADO.NET/Npgsql | SQL, parametre og aflæsning af hver kolonne | Forbindelse, kommandoer og resultater |
| Dapper | SQL og den C#-type resultatet skal passe til | Mapping fra resultatkolonner til objekter |
| EF Core | Entiteter, mapping og LINQ | SQL-generering, mapping og sporing af ændringer; migrationsværktøjet kan udvikle skemaet |

Dapper er en **micro-ORM**. Raymond kan beholde sin håndskrevne rapport med Dapper eller beskrive en model og forespørgsel i EF Core. Med EF følger nye beslutninger: Hvilke data skal indlæses? Hvad spores? Hvornår rammer forespørgslen serveren? Derfor spørger han både, **hvem der skriver SQL**, og **hvem der ejer skemaets udvikling**.

**EF Core er ikke en database.** PostgreSQL er databasen; Npgsqls EF-provider oversætter mellem EF Core og PostgreSQL. Du kan vælge at beholde din database og skifte adgangslag.

## Se forbindelsen

```csharp
public sealed class Tournament
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public List<Registration> Registrations { get; set; } = [];
}
```

Klassen beskriver objekter i programmet. Databasen skal desuden kende typer, nøgler og regler. En C#-liste er ikke en særlig kolonne med alle tilmeldinger indeni; i en relationel model ligger tilmeldinger normalt i en anden tabel.

| I objektmodellen | I databasen |
|---|---|
| `Tournament` | Turneringstabel |
| `Tournament.Id` | Primærnøgle |
| `Registration.TournamentId` | Fremmednøgle |
| `Tournament.Registrations` | Navigation over relationen |
| `DbContext` | Programmets arbejdssession med databasen |

## Din første forudsigelse

En udvikler skriver dette og forventer, at turneringen straks ligger i PostgreSQL:

```csharp
db.Tournaments.Add(new Tournament { Title = "Fredagsfinalen" });
```

**Stop før du læser videre:** Hvilken handling mangler?

`Add` fortæller EF, at objektet skal indsættes. `await db.SaveChangesAsync()` sender ændringerne til databasen. Raymond skelner derfor mellem et objekt i hukommelsen og en gemt række. Databasens constraints kan stadig afvise ændringen. En `DbContext` er kortlivet og skal frigives korrekt, eksempelvis med `await using`.

## Vælg dit værktøj

I par får I to bestillinger:

1. “Vi har en færdig rapport med kompliceret SQL. API'et skal returnere dens fem kolonner.”
2. “Vores nye applikation har mange objekter og relationer. Skemaet udvikler sig sammen med C#-modellen.”

Argumentér for Dapper eller EF Core i hvert tilfælde. Flere valg kan være fornuftige; forklar, hvem der skriver SQL og ejer skemaet. “EF er altid hurtigere” tæller ikke som begrundelse.

## Klar til at bygge?

Hent [GameHub-laboratoriet](/downloads/orm-lab.zip). Næste lektion får **rigtig C#-kode** til at skabe et skema gennem migrationer. Laboratoriet indeholder også en separat gammel database til database-first; de to arbejdsgange blandes ikke.

**Målpind:** #18. Når du kan forklare tabellen ovenfor med egne ord, har du den basale ORM-forståelse, resten bygger på.

> [!RAYMOND:thinking] Oversæt uden at gemme databasen væk
>
> Forklar forskellen på `Add` og `SaveChangesAsync`. Vis derefter, hvor en **fremmednøgle** beskytter relationen bag `Registrations`. Hvilke dele af GameHub kan bevares, hvis adgangslaget skifter fra Dapper til EF Core?

Læs videre i [Npgsqls EF Core-dokumentation](https://www.npgsql.org/efcore/) og [EF Cores introduktion til relationer](https://learn.microsoft.com/en-us/ef/core/modeling/relationships).
