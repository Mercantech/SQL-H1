---
title: "2. Code-first — byg GameHub fra C#"
slug: orm-02-code-first
module: orm
order: 2
kind: theory
objectives:
  - Modellere entiteter, nøgler, relationer og constraints i EF Core
  - Generere og gennemgå migrationer før de anvendes
  - Ændre en model uden at slette eksisterende data
---

# Code-first — byg GameHub fra C#

![Raymond arbejder med objektmodeller](/raymond/course/orm.webp)

Raymond kommer med GameHubs første krav: **En turnering har mange tilmeldinger. Samme spillertag må kun tilmeldes én gang til den samme turnering.** Han vil kunne pege på reglen både i C#-modellen og i den kørende database. Dit job er at forbinde de to.

## Hvem bestemmer strukturen?

Ved **code-first** er objektmodellen og dens mapping udgangspunktet for skemaets udvikling. En migration beskriver et trin fra den gamle version til den nye. Databasen gemmer, hvilke migrationer der er anvendt.

```text
C#-model + mapping → migration → gennemgået SQL → PostgreSQL
```

Hent [GameHub-laboratoriet](/downloads/orm-lab.zip), pak det ud og følg README'ens første trin. Du skal kun have Docker til at køre. Alle kommandoer i denne lektion køres fra den udpakkede mappe.

## Kortet og reglerne

Åbn `CodeFirst/Models.cs`. Find `Tournament`, `Registration`, primærnøglerne og FK-egenskaben `TournamentId`. Navigationerne gør relationen behagelig at bruge i C#, men FK'en beskytter forbindelsen i databasen.

I `GameHubContext.cs` finder du blandt andet:

```csharp
entity.HasIndex(r => new { r.TournamentId, r.PlayerTag }).IsUnique();
entity.HasOne(r => r.Tournament)
    .WithMany(t => t.Registrations)
    .HasForeignKey(r => r.TournamentId)
    .OnDelete(DeleteBehavior.Restrict);
```

Den første regel forhindrer en dublet **i samme turnering**. Den anden fastholder relationen og afviser sletning af en turnering med tilmeldinger. Det er stadig de SQL-regler, du kender.

> [!RAYMOND:question] Hvilken dublet forbyder reglen?
>
> Må spillertagget `Raymond` findes i to forskellige turneringer? Peg på **begge kolonner** i det unikke indeks, og forudsig udfaldet af to tilmeldinger til samme turnering. Forklar også, hvad `Restrict` betyder for en sletning.

## Tryk ikke bare på næste

```bash
docker compose run --rm workshop dotnet restore CodeFirst
docker compose run --rm workshop dotnet ef migrations add InitialGameHub --project CodeFirst
docker compose run --rm workshop dotnet ef migrations script --project CodeFirst
```

Åbn de genererede filer under `CodeFirst/Migrations`. Find `Up`, som beskriver ændringen, og `Down`, som beskriver tilbagerulningen. Find nu den samme PK, FK og UNIQUE-regel i SQL-scriptet.

**Checkpoint:** Fortæl din makker, hvilke tabeller kommandoen vil oprette. Anvend derefter migrationen og start demoen:

```bash
docker compose run --rm workshop dotnet ef database update --project CodeFirst
docker compose run --rm workshop dotnet run --project CodeFirst
```

På en frisk lab vises **3 turneringer og 3 tilmeldinger**. Fredagsfinalen har 8 ledige pladser, og Natteholdets revanche har 10. Kør demoen igen: tallene vokser ikke, fordi den kun opretter startdata i en tom turneringstabel.

## Raymond bestiller præmier

Tilføj `decimal PrizePool` til `Tournament`. Giv kolonnen præcision `numeric(10,2)` og en CHECK, som afviser negative beløb. Gamle turneringer skal fortsat findes med beløbet 0.

```bash
docker compose run --rm workshop dotnet ef migrations add AddPrizePool --project CodeFirst
docker compose run --rm workshop dotnet ef migrations script InitialGameHub AddPrizePool --project CodeFirst
```

Raymond godkender ikke ændringen ud fra migrationsnavnet alene. Forudsig SQL'en, og gennemgå det faktiske script sammen: tilføjer det en kolonne, eller sletter det noget? Hvor kommer værdien 0 i de gamle rækker fra? Anvend først migrationen, når I kan følge konsekvensen for de eksisterende data.

Brug migrationer konsekvent i dette projekt. `EnsureCreated` er en anden oprettelsesmekanisme og skal ikke blandes ind som en genvej. I en rigtig produktion skal ændringer desuden gennemgås og udrulles kontrolleret.

## Dit bevis

Gem en kort forklaring af kravet, modelændringen, migrations-SQL og antal rækker før/efter. Det viser **#19** bedre end et skærmbillede af en succesbesked alene. Byg videre i [GameHub-projektet](/learn/orm-project-01).

> [!RAYMOND:testing] Bevis at præmierne ikke kostede tilmeldinger
>
> Sammenlign **antal rækker før og efter** migrationen. Vis en gammel turnering med beløbet 0, og prøv et negativt præmiebeløb. Hvilket resultat beviser henholdsvis databevarelse og den nye CHECK-regel?

Se [EF Cores migrationsforløb](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/) og [relationer og fremmednøgler](https://learn.microsoft.com/en-us/ef/core/modeling/relationships).
