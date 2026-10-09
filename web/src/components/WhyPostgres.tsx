import { useState } from "react";
import postgresLogo from "../assets/postgresql.svg";

/** DB-Engines Ranking, juni 2026 (db-engines.com). Score er deres popularitetsindeks — ikke markedsandel. */
type RankRow = {
  id: string;
  name: string;
  score: number;
  yoy: number;
  license: string;
  accent: string;
  highlight?: boolean;
};

const RANKING: RankRow[] = [
  { id: "oracle", name: "Oracle", score: 1140, yoy: -90, license: "Proprietær", accent: "#c45c26" },
  { id: "mysql", name: "MySQL", score: 856, yoy: -97, license: "Open source", accent: "#3d7ea6" },
  { id: "mssql", name: "SQL Server", score: 698, yoy: -79, license: "Proprietær", accent: "#5a6b8c" },
  {
    id: "postgres",
    name: "PostgreSQL",
    score: 688,
    yoy: 8,
    license: "Open source",
    accent: "#1f6b4a",
    highlight: true,
  },
];

const MAX_SCORE = Math.max(...RANKING.map((r) => r.score));

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
    title: "Den der stadig stiger",
    teaser: "Top-4 relationel — og den eneste i vækst.",
    body: "Ifølge DB-Engines (juni 2026) ligger Postgres lige under SQL Server, men er den eneste blandt de store relationelle der stiger år-til-år. MySQL og SQL Server falder i indeks — Postgres vokser stille og roligt.",
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

export function WhyPostgres() {
  const [hoverRank, setHoverRank] = useState<string | null>("postgres");
  const [activeArg, setActiveArg] = useState<(typeof ARGUMENTS)[number]["id"]>("students");
  const active = ARGUMENTS.find((a) => a.id === activeArg) ?? ARGUMENTS[0];
  const focused = RANKING.find((r) => r.id === (hoverRank ?? "postgres")) ?? RANKING[3];

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
            <h3>Popularitet (DB-Engines)</h3>
            <span className="db-why-source">Juni 2026</span>
          </div>
          <p className="db-why-panel-lead">
            Hold musen over en søjle. Postgres er #4 blandt alle DBMS — og den eneste af de store
            relationelle der stiger år-til-år.
          </p>

          <ul className="db-why-bars" onMouseLeave={() => setHoverRank("postgres")}>
            {RANKING.map((r) => {
              const pct = Math.max(8, Math.round((r.score / MAX_SCORE) * 100));
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
                    <span className="db-why-bar-name">{r.name}</span>
                    <span className="db-why-bar-track">
                      <span
                        className="db-why-bar-fill"
                        style={{ width: `${pct}%`, background: r.accent }}
                      />
                    </span>
                    <span className="db-why-bar-score">{r.score}</span>
                    <span className={`db-why-bar-yoy ${r.yoy >= 0 ? "up" : "down"}`}>
                      {r.yoy >= 0 ? "+" : ""}
                      {r.yoy}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="db-why-rank-focus" aria-live="polite">
            <strong>{focused.name}</strong>
            <span>
              Score {focused.score} · år-til-år {focused.yoy >= 0 ? "+" : ""}
              {focused.yoy} · {focused.license}
            </span>
            {focused.highlight && (
              <span className="db-why-rank-tag">Vores valg til SQL-H1</span>
            )}
          </div>

          <p className="db-why-cite muted">
            Kilde:{" "}
            <a href="https://db-engines.com/en/ranking" target="_blank" rel="noreferrer">
              DB-Engines Ranking
            </a>
            , juni 2026 (score afrundet). Indeks baseret på omtale, jobs og søgninger — ikke ren
            markedsandel. År-til-år er afrundet fra samme kilde.
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
