# Raymonds GameHub — ORM-laboratoriet

**Målpinde 18, 19 og 20.** Du får en lille turneringsservice og to forskellige veje mellem C# og PostgreSQL. Det hele kan køres i Docker; du behøver ikke installere .NET, PostgreSQL eller EF-værktøjer på din computer.

Databaserne indeholder kun fiktive spillertags. Dette er et lokalt undervisningslaboratorium uden login eller offentlige endpoints. Når GameHub senere bliver en rigtig app, skal den anvende Mercantec Auth.

## 1. Start laboratoriet

Pak zip-filen ud, og åbn en terminal **i mappen med `compose.yml`**.

Kopiér `.env.example` til `.env`, og vælg dit eget lokale `DB_PASSWORD`. Brug bogstaver, tal og bindestreger i denne lab, så værdien kan indgå i en connection string uden ekstra escaping. Commit aldrig `.env`.

I PowerShell kan du kopiere filen med:

```powershell
Copy-Item .env.example .env
```

I bash kan du bruge `cp .env.example .env`. Derefter er kommandoerne ens:

```bash
docker compose up -d --wait db
docker compose build workshop
```

`db` har **ingen offentlig port**. Værktøjerne i `workshop` forbinder via det private Compose-net. På første start oprettes to databaser:

| Database | Ejer af skemaet i denne øvelse |
|---|---|
| `gamehub_codefirst` | C#-modellen og EF-migrationerne |
| `gamehub_legacy` | De eksisterende SQL-scripts |

Labrollen `workshop` er ejer/admin, fordi den skal oprette og ændre skemaer. Det er en undervisningsrolle til migration og scaffolding, ikke et mønster for en produktionsapps runtime-rettigheder.

## 2. Code-first: model → migration → database

Læs først `CodeFirst/Models.cs` og `GameHubContext.cs`. Tjek især 1:mange-relationen og det unikke indeks på turnering + spillertag.

```bash
docker compose run --rm workshop dotnet restore CodeFirst
docker compose run --rm workshop dotnet ef migrations add InitialGameHub --project CodeFirst
docker compose run --rm workshop dotnet ef migrations script --project CodeFirst
docker compose run --rm workshop dotnet ef database update --project CodeFirst
docker compose run --rm workshop dotnet run --project CodeFirst
```

Den første kommando **genererer** migrationen på din computer via bind-mountet. Læs den genererede `Up`, inden du kører `database update`. Kør kun `migrations add InitialGameHub` én gang; senere modelændringer får nye migrationsnavne.

Første demo forventes at vise:

```text
GameHub: 3 turneringer, 3 tilmeldinger
Rapport for Counter-Strike 2:
Fredagsfinalen | 2/10 tilmeldte | 8 ledige
Natteholdets revanche | 0/10 tilmeldte | 10 ledige
```

Demoen seed'er kun, når der ingen turneringer er. Den sletter eller nulstiller ikke dine ændringer ved næste kørsel.

Se den SQL, som LINQ bliver oversat til, uden at udføre den:

```bash
docker compose run --rm workshop dotnet run --project CodeFirst -- sql
docker compose run --rm workshop dotnet run --project CodeFirst -- sql "Rocket League"
```

Undersøg den faktiske database:

```bash
docker compose exec db psql -U workshop -d gamehub_codefirst -c '\dt'
docker compose exec db psql -U workshop -d gamehub_codefirst -c 'SELECT * FROM tournaments;'
```

### Din viderebygning

Tilføj `decimal PrizePool` til `Tournament`, giv den præcision `numeric(10,2)`, og lad gamle rækker få værdien 0. Tilføj en database-CHECK, som afviser negative værdier. Lav migrationen `AddPrizePool`, læs scriptet, og anvend det. Vis med en ny kørsel, at de oprindelige rækker stadig findes.

Tilføj derefter din egen `Team`-klasse med primærnøgle og påkrævet navn. En tilmelding skal valgfrit kunne høre til ét team via en FK. Lav endnu en migration, indsæt mindst to teams, og skriv en LINQ-rapport med teamnavn og antal tilmeldinger. Forklar, hvordan en tilmelding uden team vises.

## 3. Database-first: database → genereret C#-model

Læs `database/init.sql`: legacy-tabellerne indeholder allerede to turneringer og tre tilmeldinger. Der er endnu ingen håndskrevne C#-entiteter til dem. Modelbiblioteket `DatabaseFirst` kan bygges tomt; `LegacyDemo` bliver først klar, når modellerne er genereret.

```bash
docker compose run --rm workshop sh tools/scaffold.sh
docker compose run --rm workshop dotnet run --project LegacyDemo
```

Scriptet kører `dotnet ef dbcontext scaffold` mod `gamehub_legacy`. Se selve kommandoen i `tools/scaffold.sh`.

- `--no-onconfiguring` holder connection string ude af den genererede C#-kode.
- `--force` må kun overskrive den afgrænsede `DatabaseFirst/Generated`-mappe i denne øvelse. Gennemse git-diff efter hver generation.
- `Extensions/Tournament.Display.cs` kopieres kun første gang. Det er en egen `partial`-klasse med en `[NotMapped]`-property; den bliver ikke overskrevet næste gang.
- Scriptet bygger derefter demoen. EF genskaber modeller, ikke forretningsregler fra Raymonds hoved.

Du bør se begge legacy-turneringer, teksten fra `DisplayName` samt `Registreringer: 3`.

### Lad legacy-databasen ændre sig

Opret `database/add-platform.sql` med:

```sql
ALTER TABLE tournament ADD COLUMN platform varchar(30) NOT NULL DEFAULT 'PC';
```

Kør filen **én gang** i legacy-databasen og scaffold igen. Kommandoerne er ens på PowerShell og bash:

```bash
docker compose cp database/add-platform.sql db:/tmp/add-platform.sql
docker compose exec db psql -v ON_ERROR_STOP=1 -U workshop -d gamehub_legacy -f /tmp/add-platform.sql
docker compose run --rm workshop sh tools/scaffold.sh
```

Kontrollér, at den genererede `Tournament` nu har `Platform`, og at din egen `DisplayName` stadig findes. Tilføj `Platform` til demoens output. Kør **ikke** `database update` mod legacy-databasen; i denne del ændres skemaet med SQL og modellerne opdateres med scaffolding.

## 4. Aflevering

Aflever kildetekst og migrationer, et lille E/R-diagram samt `beviser.md` med:

1. Den genererede migrations-SQL og forklaring af PK, FK, UNIQUE og CHECK.
2. LINQ + genereret SQL + det faktiske resultat for din teamrapport.
3. Antal eksisterende rækker før og efter schemaændringen.
4. Database-first-klasser før/efter `platform` og bevis på bevaret partial-klasse.
5. En kort forklaring af, hvem der ejer skemaet i de to arbejdsgange.

Underviseren vurderer projektet. SQL-H1-editoren kører ikke C#, og åbning af en lektion er ikke dokumentation for en fungerende ORM-løsning.

## Stop og fejlsøgning

`docker compose down` stopper kun denne lab og bevarer data i volumenet. `docker compose logs db` viser databasefejl. Ændring af `.env` ændrer ikke adgangskoden i et allerede initialiseret Postgres-volume; vælg den rigtige værdi fra første start, eller aftal en nulstilling af labdata med underviseren.

Filer i `database/init.sql` kører kun ved første oprettelse af datavolumenet. Brug SQL-ændringsfiler til efterfølgende ændringer. Vælg et andet Compose-projektnavn med `docker compose -p dit-navn ...`, hvis du kører flere kopier samtidig.

## Versioner og officielle kilder

.NET 10, EF Core og EF Core Design 10.0.4, Npgsql EF-provider 10.0.3 og lokalt `dotnet-ef` 10.0.4. Npgsql-providerens versionsnummer følger ikke nødvendigvis EF's patchnummer; denne provider kræver mindst EF 10.0.4. Brug den medfølgende tool-manifest; undgå tilfældige globalt installerede versioner.

- [EF Core-migrationer](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [EF Core-scaffolding og partial-klasser](https://learn.microsoft.com/en-us/ef/core/managing-schemas/scaffolding/)
- [Npgsqls PostgreSQL-provider](https://www.npgsql.org/efcore/)
- [LINQ og genererede forespørgsler](https://learn.microsoft.com/en-us/ef/core/querying/)
