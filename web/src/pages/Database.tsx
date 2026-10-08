import { useCallback, useEffect, useState } from "react";
import {
  fetchSandboxInspect,
  provisionSandbox,
  resetSandbox,
  type InspectResult,
  type InspectTable,
} from "../api";
import { beginLogin, isLoggedIn } from "../auth";
import { ErDiagram } from "../components/ErDiagram";
import postgresLogo from "../assets/postgresql.svg";

function DiffBadge({ status }: { status: string }) {
  const label =
    status === "unchanged"
      ? "Uændret"
      : status === "changed"
        ? "Ændret"
        : status === "extra"
          ? "Ny tabel"
          : status;
  return <span className={`db-diff-badge ${status}`}>{label}</span>;
}

function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: unknown[][];
  empty?: string;
}) {
  if (!columns.length) return <p className="muted">{empty || "Ingen data."}</p>;
  return (
    <div className="table-wrap db-table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="muted">
                {empty || "Ingen rækker."}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell == null ? "NULL" : String(cell)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableDetail({ table }: { table: InspectTable }) {
  return (
    <div className="db-detail">
      <header className="db-detail-head">
        <h2>
          <code>{table.name}</code>
        </h2>
        <DiffBadge status={table.diffStatus} />
      </header>

      <p className="db-meta">
        <strong>{table.rowCount}</strong> rækker nu
        {table.baselineRowCount != null && (
          <>
            {" · "}
            <strong>{table.baselineRowCount}</strong> ved start
            {table.rowCount !== table.baselineRowCount && (
              <span className="db-delta">
                {" "}
                ({table.rowCount - table.baselineRowCount >= 0 ? "+" : ""}
                {table.rowCount - table.baselineRowCount})
              </span>
            )}
          </>
        )}
      </p>

      <h3>Kolonner</h3>
      <ul className="db-col-list">
        {table.columns.map((c) => (
          <li key={c.name}>
            <code>{c.name}</code>
            <span className="muted">
              {c.dataType}
              {c.nullable ? "" : " · NOT NULL"}
            </span>
          </li>
        ))}
      </ul>

      <h3>Indhold nu</h3>
      <DataTable columns={table.previewColumns} rows={table.previewRows} />
      {table.previewTruncated && <p className="muted">Viser de første rækker.</p>}

      {table.diffStatus === "changed" && (
        <>
          <h3>Tilføjet ift. start</h3>
          <DataTable
            columns={table.addedColumns || []}
            rows={table.addedRows || []}
            empty="Ingen nye rækker."
          />
          <h3>Fjernet ift. start</h3>
          <DataTable
            columns={table.removedColumns || []}
            rows={table.removedRows || []}
            empty="Ingen fjernede rækker."
          />
        </>
      )}
    </div>
  );
}

export function Database() {
  const [data, setData] = useState<InspectResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let inspect: InspectResult;
      try {
        inspect = await fetchSandboxInspect();
      } catch {
        await provisionSandbox();
        inspect = await fetchSandboxInspect();
      }
      setData(inspect);
      setSelected((prev) => {
        if (prev && inspect.tables.some((t) => t.name === prev)) return prev;
        return inspect.tables[0]?.name ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  async function onReset() {
    setBusy(true);
    setError(null);
    try {
      await resetSandbox();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nulstil fejlede");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoggedIn()) {
    return (
      <section className="page">
        <h1>Database</h1>
        <p>Log ind for at se din elev-database, tabeller og ændringer fra starten.</p>
        <button type="button" className="btn primary" onClick={() => beginLogin()}>
          Log ind
        </button>
      </section>
    );
  }

  const active = data?.tables.find((t) => t.name === selected) || null;
  const changedCount = data?.tables.filter((t) => t.diffStatus !== "unchanged").length ?? 0;

  return (
    <section className="page db-page">
      <header className="page-head db-page-head">
        <div className="db-title-row">
          <img src={postgresLogo} alt="" width={36} height={36} />
          <div>
            <h1>Database</h1>
            <p className="muted">
              {data ? (
                <>
                  Forbundet til <code>{data.dbName}</code>
                  {" · "}
                  baseline: {data.baselineLabel}
                </>
              ) : (
                "Overblik over tabeller og diff fra start-seed"
              )}
            </p>
          </div>
        </div>
        <div className="db-actions">
          <button type="button" className="btn" onClick={() => load()} disabled={loading || busy}>
            Opdater
          </button>
          <button type="button" className="btn" onClick={onReset} disabled={loading || busy}>
            Nulstil til start
          </button>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}
      {loading && !data && <p className="muted">Henter database…</p>}

      {data && (
        <>
          <div className="db-summary">
            <span className={`db-summary-pill ${data.matchesBaseline ? "ok" : "warn"}`}>
              {data.matchesBaseline
                ? "Matcher start-seed"
                : `${changedCount} tabel(ler) afviger fra start`}
            </span>
            <span className="db-summary-pill">{data.tables.length} tabeller</span>
            {data.baselineOnlyTables.length > 0 && (
              <span className="db-summary-pill warn">
                Mangler: {data.baselineOnlyTables.join(", ")}
              </span>
            )}
          </div>

          <ErDiagram
            tables={data.tables}
            relations={data.relations || []}
            selected={selected}
            onSelectTable={setSelected}
          />

          <div className="db-layout">
            <aside className="db-tables">
              <h2>Tabeller</h2>
              <ul>
                {data.tables.map((t) => (
                  <li key={t.name}>
                    <button
                      type="button"
                      className={`db-table-btn ${selected === t.name ? "active" : ""}`}
                      onClick={() => setSelected(t.name)}
                    >
                      <span className="db-table-name">{t.name}</span>
                      <span className="db-table-count">{t.rowCount}</span>
                      <DiffBadge status={t.diffStatus} />
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
            <div className="db-main">{active ? <TableDetail table={active} /> : <p className="muted">Vælg en tabel.</p>}</div>
          </div>

          <WhyPostgres />
        </>
      )}
    </section>
  );
}

function WhyPostgres() {
  return (
    <section className="db-why" aria-labelledby="why-postgres-title">
      <h2 id="why-postgres-title">Hvorfor PostgreSQL?</h2>
      <p>
        SQL-H1 kører på <strong>PostgreSQL</strong> — ikke fordi de andre er “forkerte”, men fordi Postgres
        passer ekstra godt til undervisning, cloud og moderne backend-arbejde.
      </p>
      <div className="db-why-grid">
        <article>
          <h3>Standard-SQL tæt på</h3>
          <p>
            Postgres følger SQL-standarden tættere end mange alternativer. Det du lærer her (
            <code>SELECT</code>, <code>JOIN</code>, <code>WITH</code>, vinduesfunktioner) overføres nemt til
            andre systemer.
          </p>
        </article>
        <article>
          <h3>Frem for Microsoft SQL Server</h3>
          <p>
            MSSQL er stærkt i Windows/.NET-miljøer, men er proprietært og tungere at hoste. Postgres er
            open source, kører overalt (Docker, Linux, cloud) og giver dig samme relationelle kerne uden
            licensbarriere — praktisk når hver elev får sin egen database.
          </p>
        </article>
        <article>
          <h3>Frem for MySQL / MariaDB</h3>
          <p>
            MySQL er populært til websider, men har historisk været mere “løs” med typer, constraints og
            standard-SQL. Postgres er kendt for strengere dataintegritet, rige datatyper og avancerede
            forespørgsler — nyttigt når målet er at lære <em>rigtig</em> relationel SQL.
          </p>
        </article>
        <article>
          <h3>Klar til erhvervet</h3>
          <p>
            Postgres bruges bredt i produktion (startups, offentlige systemer, SaaS). Samme motor som her
            møder du i mange .NET-API’er med Npgsql — så undervisningen matcher det, du senere bygger med.
          </p>
        </article>
      </div>
      <p className="db-why-note muted">
        Bundlinjen: lær SQL-tankegangen først. Dialekt-forskelle (T-SQL, MySQL-specifikke funktioner) er
        små justeringer, når du forstår relationer, nøgler og forespørgsler.
      </p>
    </section>
  );
}
