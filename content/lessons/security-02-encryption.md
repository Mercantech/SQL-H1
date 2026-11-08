---
title: 2. Låsen, pengeskabet og nøglen
slug: security-02-encryption
module: security
order: 2
kind: theory
objectives:
  - Skelne kryptering under transport og ved lagring
  - Forklare hvad kryptering ikke beskytter imod
  - Planlægge nøglehåndtering og restore
---

# Låsen, pengeskabet og nøglen

**Mission · Målpind 23 · 20 minutter.** Raymond finder en gammel GameHub-backup på en glemt USB-nøgle. Serveren har en adgangskode, men dumpfilen ligger nu et helt andet sted. Han tegner derfor ikke én stor hængelås omkring systemet: han markerer hvert sted, hvor nogen kan læse data, og spørger, hvilken beskyttelse der faktisk gælder dér.

> [!RAYMOND:question] Hvilken lås følger med filen?
>
> USB-nøglen er væk, men databasekontoens password er stadig hemmeligt. Hvad forhindrer en fremmed i at læse **selve backupfilen**? En beskyttelse af forbindelsen følger ikke automatisk med en kopi af data.

## Beskyt hvert sted data kan læses

| Sted | Beskyttelse | Grænse |
|---|---|---|
| Browser → API | HTTPS med gyldigt certifikat | Beskytter transport, ikke en sårbar API |
| API → database | TLS med certifikat- og værtsnavnevalidering | Beskytter ikke data efter dekryptering i appen |
| Disk og backup | Krypteret lager eller krypteret backup | En lovligt tilkoblet DB kan stadig læse data |
| Særligt følsomt felt | Gennemprøvet applikationskryptering efter behov | Nøgler, søgning og rettigheder bliver mere komplekse |

Raymond følger først data under transport. TLS er en krypteret forbindelse, men klienten skal også kontrollere, hvem den forbinder til. I Npgsql betyder `SSL Mode=VerifyFull`, at certifikatkæde og værtsnavn verificeres; certifikatets udsteder skal være betroet, eventuelt via en konfigureret rod-CA. Indstillinger, der accepterer ethvert certifikat, er ikke samme beskyttelse. Den lokale Docker-lab bruger et isoleret net uden TLS; det er en øvelsesafgrænsning, ikke en produktionsopskrift.

Derefter ser han på kopierne: databasefiler, dump og eventuelle eksporter. Krypteret serverdisk gør ikke automatisk et eksporteret dump krypteret. Beskriv derfor både den oprindelige lagring og den kopi, I faktisk flytter eller gemmer.

## Nøglen skal have et andet hjem

Raymond lægger backup og nøgle på hver sin tegning. Et krypteret dump og dekrypteringsnøglen i samme offentlige mappe er som en cykellås med nøglen i låsen. Brug driftens secret management, begræns nøgleadgang, planlæg rotation og log relevante adgangshændelser uden at logge nøgler eller følsomme data. `.env` er lokal konfiguration, ikke et magisk krypteret pengeskab. Den må ikke i Git; i drift leveres secrets via eksempelvis Dokploy.

Vælg et vedligeholdt bibliotek med autentificeret kryptering, når feltkryptering faktisk kræves. Opfind ikke egen algoritme. Et system skal både kunne opdage ændret ciphertext og kunne gendanne data ved et legitimt nøgleskifte. Gem algoritme/version og nødvendig metadata sammen med ciphertext; hold selve nøglen adskilt.

> [!RAYMOND:warning] En mistet nøgle er også et datatab
>
> Backupfilen findes, men den eneste dekrypteringsnøgle lå på en slettet udviklermaskine. Hvem kan nu gendanne GameHub? Planlæg **beskyttet nøgleadgang og genoprettelse**, før I kalder backupplanen færdig.

## Kryptering stopper ikke en autoriseret fejl

Raymond prøver til sidst beskyttelsens grænse: Hvis app-rollen kan læse alle e-mails, kan et endpoint med forkert adgangskontrol også lække dem gennem en perfekt krypteret TLS-forbindelse. Krypteringen kan transportere netop det svar, som appen fejlagtigt har givet lov til. Dataminimering, rettigheder, parametre og overvågning har hver deres opgave. Saml ikke følsomme oplysninger ind uden et konkret formål.

## Raymonds beredskabskort

Udfyld fire felter for GameHub: **Hvad beskytter vi? Hvor er det krypteret? Hvem har nøglen? Hvordan gendanner vi?**

Afprøv planen med scenariet »backup er stjålet« og derefter »nøglen er mistet«. En backup er først brugbar, når I har verificeret en gendannelse i en separat testdatabase. Medtag filen, værktøjet, nøglen og en kontrol af rækker og integritet i jeres procedure.

> [!RAYMOND:restore] Lad en makker følge beredskabskortet
>
> Kan makkeren finde den rigtige backup, få **autoriseret adgang** til nøglen og kontrollere de gendannede rækker ud fra jeres beskrivelse? Notér det første trin, der krævede et gæt, og gør proceduren tydeligere.

Kilder: [OWASP: krypteret lagring](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html), [Npgsql: forbindelsessikkerhed](https://www.npgsql.org/doc/security.html).
