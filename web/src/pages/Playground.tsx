import { useEffect, useState } from "react";
import {
  executeSql,
  fetchMe,
  provisionSandbox,
  resetSandbox,
  type ExecuteResult,
} from "../api";
import { beginLogin, isLoggedIn } from "../auth";
import { SqlEditor } from "../components/SqlEditor";
import { useRaymondWork } from "../components/raymond/useRaymondWork";
import { describeSqlResult } from "../lib/raymondWork";

export function Playground() {
  const [sql, setSql] = useState("SELECT * FROM customers LIMIT 10;");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [dbName, setDbName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useRaymondWork({ currentSql: sql, lastError: error || result?.error || undefined, resultSummary: describeSqlResult(result) });

  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchMe()
      .then(async (me) => {
        if (me.sandbox.status !== "ready") {
          const p = await provisionSandbox();
          setDbName(p.dbName);
        } else {
          setDbName(me.sandbox.dbName || null);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  if (!isLoggedIn()) {
    return (
      <section className="page playground-page">
        <header className="playground-head">
          <h1>Playground</h1>
          <p>Log ind for at få din egen Postgres-database.</p>
        </header>
        <button type="button" className="btn primary" onClick={() => beginLogin()}>
          Log ind
        </button>
      </section>
    );
  }

  return (
    <section className="page playground-page">
      <header className="playground-head">
        <h1>Playground</h1>
        <p className="muted">
          {dbName ? <code>{dbName}</code> : "…"}
          <span aria-hidden="true"> · </span>
          SELECT, DML, DDL — ikke cluster-admin
        </p>
      </header>
      <SqlEditor
        value={sql}
        onChange={setSql}
        workspace
        coach="errors"
        running={running}
        result={result}
        error={error}
        onRun={async (sqlToRun) => {
          const query = (sqlToRun ?? sql).trim();
          if (!query) return;
          setRunning(true);
          setError(null);
          try {
            setResult(await executeSql(query, undefined, true));
          } catch (e) {
            setError(e instanceof Error ? e.message : "Fejl");
          } finally {
            setRunning(false);
          }
        }}
        onReset={async () => {
          if (!window.confirm("Nulstil elev-databasen til startdata? Dine egne tabeller og ændringer i data slettes. Din SQL-tekst bevares.")) return;
          setRunning(true);
          setError(null);
          try {
            await resetSandbox();
            setResult(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Fejl");
          } finally {
            setRunning(false);
          }
        }}
      />
    </section>
  );
}
