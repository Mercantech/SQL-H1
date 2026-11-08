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

**Mission · Målpind 23 · 20 minutter.** Raymond finder en gammel databasebackup på en glemt USB-nøgle. Kan I forklare, om en adgangskode på database-serveren også beskytter den fil?

## Beskyt hvert sted data kan læses

| Sted | Beskyttelse | Grænse |
|---|---|---|
| Browser → API | HTTPS med gyldigt certifikat | Beskytter transport, ikke en sårbar API |
| API → database | TLS med certifikat- og værtsnavnevalidering | Beskytter ikke data efter dekryptering i appen |
| Disk og backup | Krypteret lager eller krypteret backup | En lovligt tilkoblet DB kan stadig læse data |
| Særligt følsomt felt | Gennemprøvet applikationskryptering efter behov | Nøgler, søgning og rettigheder bliver mere komplekse |

TLS er en krypteret forbindelse. I Npgsql betyder `SSL Mode=VerifyFull`, at certifikatkæde og værtsnavn verificeres; certifikatets udsteder skal være betroet, eventuelt via en konfigureret rod-CA. Indstillinger, der accepterer ethvert certifikat, er ikke samme beskyttelse. Den lokale Docker-lab bruger et isoleret net uden TLS; det er en øvelsesafgrænsning, ikke en produktionsopskrift.

## Nøglen skal have et andet hjem

Et krypteret dump og dekrypteringsnøglen i samme offentlige mappe er som en cykellås med nøglen i låsen. Brug driftens secret management, begræns nøgleadgang, planlæg rotation og log relevante adgangshændelser uden at logge nøgler eller følsomme data. `.env` er lokal konfiguration, ikke et magisk krypteret pengeskab. Den må ikke i Git; i drift leveres secrets via eksempelvis Dokploy.

Vælg et vedligeholdt bibliotek med autentificeret kryptering, når feltkryptering faktisk kræves. Opfind ikke egen algoritme. Et system skal både kunne opdage ændret ciphertext og kunne gendanne data ved et legitimt nøgleskifte. Gem algoritme/version og nødvendig metadata sammen med ciphertext; hold selve nøglen adskilt.

## Kryptering stopper ikke en autoriseret fejl

Hvis app-rollen kan læse alle e-mails, kan et endpoint med forkert adgangskontrol også lække dem gennem en perfekt krypteret TLS-forbindelse. Dataminimering, rettigheder, parametre og overvågning har hver deres opgave. Saml ikke følsomme oplysninger ind uden et konkret formål.

## Raymonds beredskabskort

Udfyld fire felter for GameHub: **Hvad beskytter vi? Hvor er det krypteret? Hvem har nøglen? Hvordan gendanner vi?**

Afprøv planen med scenariet »backup er stjålet« og derefter »nøglen er mistet«. En backup er først brugbar, når I har verificeret en gendannelse i en separat testdatabase. Medtag filen, værktøjet, nøglen og en kontrol af rækker og integritet i jeres procedure.

Kilder: [OWASP: krypteret lagring](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html), [Npgsql: forbindelsessikkerhed](https://www.npgsql.org/doc/security.html).
