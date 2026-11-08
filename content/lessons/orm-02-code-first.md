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

GameHub får sin første feature: **En turnering har mange tilmeldinger. Samme spillertag må kun tilmeldes én gang til den samme turnering.** Dit job er at omsætte kravet til C#, SQL og noget, der faktisk kører.

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

**Makkercheck:** Må spillertagget `Raymond` findes i to forskellige turneringer? Peg på de kolonner, der afgør svaret.

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

Forudsig det nye SQL, og undersøg derefter det faktiske script. Er det en ny kolonne eller et `DROP TABLE`? Hvad sker der med de eksisterende rækker? Anvend først migrationen, når du kan forklare det.

Brug migrationer konsekvent i dette projekt. `EnsureCreated` er en anden oprettelsesmekanisme og skal ikke blandes ind som en genvej. I en rigtig produktion skal ændringer desuden gennemgås og udrulles kontrolleret.

## Dit bevis

Gem en kort forklaring af kravet, modelændringen, migrations-SQL og antal rækker før/efter. Det viser **#19** bedre end et skærmbillede af en succesbesked alene. Byg videre i [GameHub-projektet](/learn/orm-project-01).

Se [EF Cores migrationsforløb](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/) og [relationer og fremmednøgler](https://learn.microsoft.com/en-us/ef/core/modeling/relationships).
