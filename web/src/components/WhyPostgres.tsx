import { useState } from "react";
import postgresLogo from "../assets/postgresql.svg";

/**
 * Stack Overflow Developer Survey 2026 — Databases
 * https://survey.stackoverflow.co/2026/technology
 * Procent = andel af respondenter der brugte databasen (flere valg mulige).
 */
type RankRow = {
  id: string;
  name: string;
  percent: number;
  rank: number;
  kind: string;
  accent: string;
  highlight?: boolean;
};

const RANKING: RankRow[] = [
  {
    id: "postgres",
    name: "PostgreSQL",
    percent: 57.9,
    rank: 1,
    kind: "Relationel · open source",
    accent: "#1f6b4a",
    highlight: true,
  },
  {
    id: "sqlite",
    name: "SQLite",
    percent: 42.1,
    rank: 2,
    kind: "Embedded · open source",
    accent: "#3d6b8c",
  },
  {
    id: "mysql",
    name: "MySQL",
    percent: 35.1,
    rank: 3,
    kind: "Relationel · open source",
    accent: "#3d7ea6",
  },
  {
    id: "redis",
    name: "Redis",
    percent: 28.3,
    rank: 4,
    kind: "Cache / nøgle-værdi",
    accent: "#b84a3a",
  },
  {
    id: "mssql",
    name: "SQL Server",
    percent: 27.1,
    rank: 5,
    kind: "Relationel · proprietær",
    accent: "#5a6b8c",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    percent: 19.0,
    rank: 7,
    kind: "Dokument-DB",
    accent: "#4a7a4a",
  },
];

const MAX_PCT = Math.max(...RANKING.map((r) => r.percent));

const ARGUMENTS = [
  {
    id: "standard",
    title: "Tæt på standard-SQL",
    teaser: "Det du lærer, flytter med dig.",
    body: "Postgres følger SQL-standarden tættere end mange alternativer. SELECT, JOIN, WITH, vinduesfunktioner og constraints overføres nemt til andre systemer — dialekt-forskelle er små justeringer.",
  },
  {
    id: "students",
    title: "Én database pr. elev",
    teaser: "Ingen licensmur i klasselokalet.",
    body: "Open source + Docker betyder, at hver elev kan få sin egen Postgres uden Windows-licenser eller server-cal’er. Det er derfor SQL-H1 kan give dig en personlig sandbox.",
  },
  {
    id: "integrity",
    title: "Strengere integritet",
    teaser: "Typer og constraints der faktisk gælder.",
    body: "Postgres er kendt for at håndhæve datatyper, fremmednøgler og checks konsekvent. Det er guld, når målet er at lære rigtig relationel SQL — ikke “det virker alligevel”.",
  },
  {
    id: "vs-mssql",
    title: "Frem for SQL Server her",
    teaser: "Samme relationelle kerne, lettere at hoste.",
    body: "MSSQL er stærkt i Windows/.NET-miljøer, men er proprietært og tungere at spinne op pr. elev. Postgres giver dig den relationelle model uden licensbarriere — og Npgsql binder det pænt til .NET.",
  },
  {
    id: "vs-mysql",
    title: "Frem for MySQL/MariaDB her",
    teaser: "Mere pedantisk — på den gode måde.",
    body: "MySQL er populært til websites, men har historisk været løsere med typer og standard-SQL. Til undervisning i relationer, nøgler og avancerede forespørgsler vinder Postgres’ strenghed.",
  },
  {
    id: "features",
    title: "Rige byggeklodser",
    teaser: "CTE, vinduer, JSON, arrays…",
    body: "Du får moderne SQL (WITH, vinduesfunktioner), stærke indekser og datatyper som JSON/JSONB — uden at forlade den relationelle model. Det matcher det, du møder i cloud og SaaS.",
  },
  {
    id: "career",
    title: "Klar til erhvervet",
    teaser: "Startups, det offentlige, SaaS.",
    body: "Postgres bruges bredt i produktion. Samme motor som her møder du i mange .NET-API’er med Npgsql — så undervisningen matcher det, du senere bygger med.",
  },
  {
    id: "trend",
    title: "Udviklernes #1 database",
    teaser: "57,9 % i Stack Overflow 2026.",
    body: "I Stack Overflow Developer Survey 2026 er PostgreSQL den mest brugte database blandt respondenterne (57,9 %) — foran SQLite, MySQL og SQL Server. Det understøtter valget af Postgres til både undervisning og moderne backends.",
  },
] as const;

const COMPARE = [
  { feature: "Open source / gratis til undervisning", pg: true, mysql: true, mssql: false },
  { feature: "Nem Docker-hosting pr. elev", pg: true, mysql: true, mssql: false },
  { feature: "Streng FK / constraint-håndhævelse", pg: true, mysql: "delvis", mssql: true },
  { feature: "CTE (WITH) & vinduesfunktioner", pg: true, mysql: true, mssql: true },
  { feature: "JSON som førsteklasses type", pg: true, mysql: true, mssql: "delvis" },
  { feature: "Tæt .NET via Npgsql", pg: true, mysql: "connector", mssql: true },
  { feature: "Ingen licens til klasse-sandbox", pg: true, mysql: true, mssql: false },
] as const;

function Cell({ value }: { value: true | false | string }) {
  if (value === true) return <span className="db-why-yes">Ja</span>;
  if (value === false) return <span className="db-why-no">Nej</span>;
  return <span className="db-why-partial">{value}</span>;
}

function formatPct(n: number) {
  return n.toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %";
}

export function WhyPostgres() {
  const [hoverRank, setHoverRank] = useState<string | null>("postgres");
  const [activeArg, setActiveArg] = useState<(typeof ARGUMENTS)[number]["id"]>("students");
  const active = ARGUMENTS.find((a) => a.id === activeArg) ?? ARGUMENTS[0];
  const focused = RANKING.find((r) => r.id === (hoverRank ?? "postgres")) ?? RANKING[0];

  return (
    <section className="db-why" aria-labelledby="why-postgres-title">
      <header className="db-why-hero">
        <div className="db-why-hero-text">
          <p className="db-why-kicker">Motoren bag SQL-H1</p>
          <h2 id="why-postgres-title">Hvorfor PostgreSQL?</h2>
          <p>
            Ikke fordi andre databaser er “forkerte” — men fordi Postgres rammer undervisning, cloud og
            moderne backend ekstra godt. Her er tallene, argumenterne og sammenligningen.
          </p>
        </div>
        <div className="db-why-hero-mark" aria-hidden="true">
          <img src={postgresLogo} alt="" />
          <span>PostgreSQL</span>
        </div>
      </header>

      <div className="db-why-layout">
        <div className="db-why-panel db-why-rank">
          <div className="db-why-panel-head">
            <h3>Brugt af udviklere (Stack Overflow)</h3>
            <span className="db-why-source">Survey 2026</span>
          </div>
          <p className="db-why-panel-lead">
            Hold musen over en søjle. Postgres er den mest brugte database blandt respondenterne —
            foran SQLite, MySQL og SQL Server.
          </p>

          <ul className="db-why-bars" onMouseLeave={() => setHoverRank("postgres")}>
            {RANKING.map((r) => {
              const pct = Math.max(8, Math.round((r.percent / MAX_PCT) * 100));
              const on = hoverRank === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`db-why-bar-row ${r.highlight ? "highlight" : ""} ${on ? "on" : ""}`}
                    onMouseEnter={() => setHoverRank(r.id)}
                    onFocus={() => setHoverRank(r.id)}
                    aria-pressed={on}
                  >
                    <span className="db-why-bar-name">
                      <span className="db-why-bar-rank">#{r.rank}</span> {r.name}
                    </span>
                    <span className="db-why-bar-track">
                      <span
                        className="db-why-bar-fill"
                        style={{ width: `${pct}%`, background: r.accent }}
                      />
                    </span>
                    <span className="db-why-bar-score">{formatPct(r.percent)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="db-why-rank-focus" aria-live="polite">
            <strong>
              #{focused.rank} {focused.name}
            </strong>
            <span>
              {formatPct(focused.percent)} af respondenterne · {focused.kind}
            </span>
            {focused.highlight && (
              <span className="db-why-rank-tag">Vores valg til SQL-H1</span>
            )}
          </div>

          <p className="db-why-cite muted">
            Kilde:{" "}
            <a
              href="https://survey.stackoverflow.co/2026/technology"
              target="_blank"
              rel="noreferrer"
            >
              Stack Overflow Developer Survey 2026 — Technology
            </a>
            . Procent = andel der har brugt databasen (flere valg mulige). Top-listen er forkortet;
            MariaDB (#6, 20,3 %) er udeladt her for overskuelighed.
          </p>
        </div>

        <div className="db-why-panel db-why-args">
          <div className="db-why-panel-head">
            <h3>Hvorfor lige Postgres her?</h3>
            <span className="db-why-source">{ARGUMENTS.length} argumenter</span>
          </div>
          <div className="db-why-arg-grid">
            {ARGUMENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`db-why-arg ${activeArg === a.id ? "active" : ""}`}
                onMouseEnter={() => setActiveArg(a.id)}
                onFocus={() => setActiveArg(a.id)}
                onClick={() => setActiveArg(a.id)}
              >
                <strong>{a.title}</strong>
                <span>{a.teaser}</span>
              </button>
            ))}
          </div>
          <div className="db-why-arg-detail" aria-live="polite">
            <h4>{active.title}</h4>
            <p>{active.body}</p>
          </div>
        </div>
      </div>

      <div className="db-why-panel db-why-compare">
        <div className="db-why-panel-head">
          <h3>Hurtig sammenligning</h3>
          <span className="db-why-source">Til undervisning & sandbox</span>
        </div>
        <div className="db-why-compare-wrap">
          <table className="db-why-compare-table">
            <thead>
              <tr>
                <th>Emne</th>
                <th>PostgreSQL</th>
                <th>MySQL</th>
                <th>SQL Server</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>
                    <Cell value={row.pg} />
                  </td>
                  <td>
                    <Cell value={row.mysql} />
                  </td>
                  <td>
                    <Cell value={row.mssql} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="db-why-flow" aria-label="Fra undervisning til produktion">
        <span>Undervisning</span>
        <span className="db-why-flow-arrow" aria-hidden="true" />
        <span>Docker-sandbox</span>
        <span className="db-why-flow-arrow" aria-hidden="true" />
        <span className="db-why-flow-pg">PostgreSQL</span>
        <span className="db-why-flow-arrow" aria-hidden="true" />
        <span>Npgsql</span>
        <span className="db-why-flow-arrow" aria-hidden="true" />
        <span>.NET API</span>
      </div>

      <p className="db-why-note">
        Bundlinjen: lær SQL-tankegangen først. Dialekt-forskelle (T-SQL, MySQL-funktioner) er små
        justeringer, når du forstår relationer, nøgler og forespørgsler.
      </p>
    </section>
  );
}
