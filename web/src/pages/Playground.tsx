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

export function Playground() {
  const [sql, setSql] = useState("SELECT * FROM customers LIMIT 10;");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [dbName, setDbName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <section className="page">
        <h1>Playground</h1>
        <p>Log ind for at få din egen Postgres-database.</p>
        <button type="button" className="btn primary" onClick={() => beginLogin()}>
          Log ind
        </button>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1>Playground</h1>
        <p>
          Fri SQL-editor mod din elev-database
          {dbName ? (
            <>
              : <code>{dbName}</code>
            </>
          ) : (
            "…"
          )}
          . MVP tillader SELECT/INSERT/UPDATE/DELETE.
        </p>
      </header>
      {error && <p className="error-text">{error}</p>}
      <SqlEditor
        value={sql}
        onChange={setSql}
        running={running}
        result={result}
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
          setRunning(true);
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
