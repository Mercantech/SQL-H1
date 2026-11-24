# Testkort til databasen

En god testcase har starttilstand, handling, forventet udfald, kontrol af sluttilstand og oprydning.

| Regel | Gyldigt | Skal afvises |
| ---|---|--- |
| Billetantal 1–4 | 1 og 4 | 0 og 5 (23514), NULL (23502). |
| Unik billetkode | Ny kode | Eksisterende kode (23505). |
| Spilleren eksisterer | Kendt spiller-id | Manglende spiller (23503). |
| Én plads tilbage | Én reservation | To samtidige reservationer må ikke begge lykkes. |

## Prøv opslaget

Kør én testcase fra frisk fixture, vis fejlen når reglen fjernes i labben, og gentag efter gendannelse. Kontrollér altid den faktiske sluttilstand.

[Øv dig i forløbet](/learn/testing-project-01) · [PostgreSQL om constraints](https://www.postgresql.org/docs/16/ddl-constraints.html)
