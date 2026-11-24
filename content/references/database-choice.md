# Beslutningskort til databasevalg

Begrund valget med kundens adgangsmønstre og en testbar forventning.

| Skriv | Eksempel fra GameHub |
| ---|--- |
| Krav | 20 korrekte spillere med stabil rækkefølge ved samme rating. |
| Datamodel | Hvilke data læses og ændres samlet? Hvem håndhæver unikke pladser? |
| Adgangslag | Hvem skriver forespørgslen, og hvor mange databasekald udløses? |
| Måling | Identiske data og felter, opvarmning, flere gentagelser, median og plan. |
| Genvurdering | Hvilket nyt adgangsmønster eller hvilken måling kunne ændre valget? |

## Prøv opslaget

Et indeks kan mindske læsearbejdet og samtidig gøre skrivninger dyrere. Forklar begge sider, og vis hvad jeres eget forsøg måler.

[Øv dig i forløbet](/learn/database-choice-project-01) · [PostgreSQL om læsning af planer](https://www.postgresql.org/docs/16/using-explain.html)
