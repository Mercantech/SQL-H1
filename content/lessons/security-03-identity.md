---
title: 3. Passwords er ikke almindelige data
slug: security-03-identity
module: security
order: 3
kind: theory
objectives:
  - Skelne password-hashing fra reversibel kryptering
  - Forklare salt og langsomme password-hashfunktioner
  - Skelne brugerlogin, app-rettigheder og databaseadgang
---

# Passwords er ikke almindelige data

**Mission · Målpind 23 · 20 minutter.** En kollega foreslår at kryptere alle brugeres passwords, så supporten kan sende dem tilbage. Raymond ryster på snablen: »Hvilken oplysning har supporten egentlig brug for?«

## Hashing og kryptering løser forskellige problemer

Kryptering kan vendes med en nøgle og bruges, når autoriserede brugere skal kunne læse originalen. Passwords skal normalt kunne **verificeres**, ikke hentes tilbage. Derfor gemmer en identitetsplatform et saltet password-hash lavet med en dedikeret, omkostningsfuld passwordfunktion, eksempelvis Argon2id. Brug et anerkendt bibliotek og vedligeholdte parametre. En hurtig SHA-256 alene er ikke passwordlagring.

Et tilfældigt salt pr. password gør ens passwords forskellige i lagringen og modvirker forudberegnede tabeller; saltet er ikke hemmeligt. En eventuel pepper er en ekstra hemmelighed, der opbevares adskilt og kræver en plan for rotation. Ingen af delene gør svage passwords umulige at gætte, hvis hashes lækkes. Derfor begrænses også loginforsøg, og MFA kan anvendes i identitetsplatformen.

## Tre forskellige adgangsspørgsmål

| Spørgsmål | Ansvar |
|---|---|
| Hvem er brugeren? | Mercantec Auth |
| Må brugeren ændre denne turnering? | API'ets adgangskontrol |
| Må API'et læse eller ændre denne tabel? | Databaserollen |

I vores Mercantec-apps bruger vi **Mercantec Auth**. Vi bygger ikke en lokal passwordtabel eller en ny loginløsning i GameHub. Appen knytter egne data til brugerens stabile `sub`; e-mail er ikke den stabile brugernøgle. Backend validerer token og autoriserer den konkrete handling. Databasens servicekonto er en anden identitet end eleven i browseren.

Central Auth fjerner ikke behovet for at beskytte databasekontoens credential: brug secrets/env, begræns netværksadgang og privilegier, og roter credential efter mistanke om læk. Appen må ikke sende databasepasswords til browseren.

## Kortspil: vælg den rigtige beskyttelse

Match hvert kort med en kontrol og forklar en begrænsning:

- En stjålet databasebackup.
- En angriber forsøger mange loginforsøg.
- En elev ændrer turnerings-id i et API-kald.
- Et databasepassword havner i Git.
- En søgning modtager teksten `Nova' OR '1'='1`.

Svarene bruger flere lag: kryptering og nøglebeskyttelse, identitetsplatformens loginbeskyttelse, server-side adgangskontrol, credentialrotation og parametriserede forespørgsler. Ingen enkelt indstilling løser alle fem.

Fortsæt i [projektet: GameHubs sikkerhedsvagt](/learn/security-project-01), hvor I skal dokumentere og afprøve kontrollerne.

Kilder: [OWASP: passwordlagring](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Mercantec Auth: integrationskilde](https://auth.mercantec.tech/.well-known/mercantec-auth.json).
