# GameHub: sikkerhed og rigtige databasetests

Denne lokale .NET 10/Npgsql-lab bruger PostgreSQL 16. Docker bygger C#-koden; ingen .NET-installation på host er nødvendig. Der er ingen loginløsning eller eksterne endpoints. Data er fiktive.

## Start

1. Kopiér `.env.example` til `.env` og indsæt et selvvalgt, tilfældigt `LAB_DB_PASSWORD`. Filen må ikke i Git.
2. Fra denne mappe:

```sh
docker compose build lab
docker compose up -d --wait db
docker compose run --rm lab
```

Forvent **14/14 tests bestod** og exitkode 0. En fejl giver exitkode 1. Hver kørsel opretter et isoleret schema og en midlertidig begrænset rolle, som slettes igen. Kør testene sekventielt under ændringsarbejde; to kørsler har separate navne og data, men deler databasekapacitet.

Testprogrammet bruger en enkel console-runner, ikke et xUnit-projekt. `docker compose run --rm lab` er testkommandoen; `dotnet test` er ikke denne labs runner.

Databasen har ingen hostport. Den er kun på labbens private interne net. Adminkontoen bruges til fixtures og `SET LOCAL ROLE`-afprøvning; en rigtig app skal have en separat loginrolle med minimumsrettigheder. TLS er slået fra i netop denne isolerede lokale øvelse. Det er ikke en produktionskonfiguration.

## Sikkerhedsvagten

Find `FindPlayers` i Program.cs. Programmet tester almindeligt navn, legitim apostrof og en tekst, der ligner injection. Tilføj en ekstra case i samme stil. Hold værdier adskilt med Npgsql-parametre.

Følg rollen i de to rettighedstests. Den har adgang til et view og ingen adgang til private e-mails. Der bruges en `NOLOGIN`-rolle for at kunne afprøve rettigheder i den lokale fixture uden at oprette endnu et password.

## Bevis at databasen holder

Find constraint-, rollback- og samtidighedstestene. Tilføj en positiv grænsetest og en negativ test med den præcise SQLSTATE. Vis at en fjernet constraint gør den relevante test rød, og gendan derefter reglen. Ændringer i Program.cs kræver nyt `docker compose build lab` før næste kørsel.

## Restore-øvelse i separat database

Følgende kommandoer køres kun mod denne labs lokale database. Demo-fixturen bevares til restore-øvelsen og indeholder én række med `quantity=2`.

```sh
docker compose run --rm lab --prepare-restore
docker compose exec db pg_dump -U lab_admin -d gamehub_lab -Fc -f /tmp/gamehub.dump
docker compose exec db createdb -U lab_admin gamehub_restored
docker compose exec db pg_restore -U lab_admin -d gamehub_restored --no-owner /tmp/gamehub.dump
docker compose exec db psql -U lab_admin -d gamehub_restored -c "SELECT * FROM gamehub_demo.restore_probe;"
```

Forvent `id=1`, `quantity=2`. Kontroller også reglen:

```sh
docker compose exec db psql -U lab_admin -d gamehub_restored -v ON_ERROR_STOP=1 -c "INSERT INTO gamehub_demo.restore_probe VALUES(2,0);"
```

Forvent CHECK-fejl og en ikke-nul exitkode. Kontroller derefter at der stadig er én række. Det er en forventet negativ test, ikke en instruktion om at ignorere øvrige fejl. Originalen er bevaret. Ved gentagelse: vælg et nyt restoredatabasenavn og brug det i alle de efterfølgende kommandoer. Brug ikke `--clean` eller produktionsdatabaser.

Dumpet er ikke krypteret i denne øvelse; det bliver i containerens /tmp og indeholder kun syntetiske labdata. Beskriv i afleveringen, hvordan backup-kryptering og nøgler skulle håndteres i drift. En upload til Git er ikke en backupstrategi.

## Stop

```sh
docker compose down
```

Labbens volume bevares. Slet det kun, når du bevidst vil kassere alle labdata. Nye passwordværdier i `.env` ændrer ikke automatisk en allerede initialiseret PostgreSQL-kontos password.

## Faglige kilder

- [Npgsql: basic usage og parametre](https://www.npgsql.org/doc/basic-usage.html)
- [OWASP: SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Microsoft: teststrategi med rigtig database](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy)
- [PostgreSQL: transaktionsisolation](https://www.postgresql.org/docs/16/transaction-iso.html)

Ved direkte udviklerkørsel med installeret SDK læses også `PGPORT` (standard 5432); Docker-flowet kræver ingen hostinstallation.
