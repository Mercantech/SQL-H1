---
title: "4. Database-first — red den gamle turneringsserver"
slug: orm-04-database-first
module: orm
order: 4
kind: theory
objectives:
  - Generere en domain-model og DbContext fra en eksisterende PostgreSQL-database
  - Bevare egne udvidelser ved gentagen scaffolding
  - Forklare forskellen på skemaejerskab ved code-first og database-first
---

# Database-first — red den gamle turneringsserver

![Raymond arbejder med objektmodeller](/raymond/course/orm.webp)

“God nyhed,” siger Raymond. “Vi har allerede en turneringsdatabase. Mindre god nyhed: Programmet, der brugte den, er væk.”

Du får **eksisterende tabeller og data**. Du skal bygge C#-adgang til dem uden at opfinde skemaet igen. Det er database-first og **reverse engineering**, også kaldet scaffolding.

```text
Eksisterende PostgreSQL-skema → EF-scaffolding → entiteter og DbContext → C#-forespørgsler
```

## Start med bevismaterialet

[GameHub-laboratoriet](/downloads/orm-lab.zip) har en separat database, `gamehub_legacy`. Åbn `database/init.sql`. Find tabellerne `tournament` og `registration`, FK'en og unikheden på turnering + spillertag.

**Forudsig før generation:** Hvilke C#-klasser vil du forvente? Hvilke egenskaber må være `null`? Hvilken navigation vil forbinde en tilmelding med en turnering?

## Lad databasen tegne første udkast

Når du har startet labben som beskrevet i README:

```bash
docker compose run --rm workshop sh tools/scaffold.sh
docker compose run --rm workshop dotnet run --project LegacyDemo
```

Scriptet kalder `dotnet ef dbcontext scaffold` med Npgsql-provideren. Det læser **det faktiske skema** og genererer filer i `DatabaseFirst/Generated`. Connection string kommer fra miljøet; `--no-onconfiguring` forhindrer, at den skrives ind i den genererede kontekst.

Find nu `Tournament`, `Registration` og `LegacyContext`. Sammenlign de genererede nøgler og relationer med SQL-filen. Demoen bør vise to turneringer og tre registreringer.

## Hvad kan EF ikke læse i dine tanker?

Skemaet kan vise kolonner, nøgler, nullability og relationer. Det indeholder ikke nødvendigvis din applikations workflow, brugergrænseflade eller alle forretningsregler. Scaffolding er et startpunkt, som du skal gennemgå. Ikke alle databasespecifikke regler kan repræsenteres som modelkonfiguration.

**Makkercheck:** Kan en `CHECK (max_players > 0)` fortælle, at holdkaptajnen skal godkende en spiller før tilmelding? Hvilken regel bor hvor?

## Dine egne filer skal overleve

Labben placerer Raymonds egen visningstekst i `DatabaseFirst/Extensions/Tournament.Display.cs`:

```csharp
public partial class Tournament
{
    [NotMapped]
    public string DisplayName => $"{Title} · {GameTitle}";
}
```

`partial` lader den genererede klasse og din egen fil bidrage til samme type. `[NotMapped]` fortæller EF, at den beregnede visningstekst ikke er en databasekolonne. **Skriv ikke dine egne rettelser inde i `Generated`.** Labscriptets `--force` må overskrive de genererede filer næste gang.

## Nu kommer ændringen fra databasen

Raymond tilføjer en `platform`-kolonne med SQL. Følg README'ens trin med `database/add-platform.sql`, kør ændringen i `gamehub_legacy`, og scaffold igen.

Dit bevis er tredelt:

1. Den faktiske database har `platform`.
2. Den regenererede C#-model har `Platform`.
3. Din `DisplayName` virker stadig, og de gamle rækker er bevaret.

Gennemse diffen. På et senere projekt kan man vælge at skifte til migrationsstyret skema, men det skal være en bevidst overgang. **I denne lab ændres legacy-skemaet med SQL, og C#-modellen følger efter.**

## Hvem starter næste ændring?

| Arbejdsgang | Første ændring | Derefter |
|---|---|---|
| Code-first i labben | C#-model og mapping | Migration og databaseopdatering |
| Database-first i labben | Eksisterende databaseskema | Ny scaffolding og gennemgang af kode |

**Målpind:** #20. Afprøv hele forløbet i [legacy-projektet](/learn/orm-project-02). Den officielle beskrivelse af muligheder og begrænsninger findes i [EF Core-scaffolding](https://learn.microsoft.com/en-us/ef/core/managing-schemas/scaffolding/).
