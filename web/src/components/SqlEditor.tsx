import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import type { ExecuteResult, ResultSet } from "../api";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  onReset?: () => void;
  onCheck?: () => void;
  running?: boolean;
  result?: ExecuteResult | null;
  checkMessages?: string[] | null;
  checkPassed?: boolean | null;
  allowWrite?: boolean;
};

function normalizeSets(result: ExecuteResult): ResultSet[] {
  if (result.sets && result.sets.length > 0) return result.sets;
  if (result.rowsAffected != null && result.columns.length === 0) {
    return [{ label: "Resultat", columns: [], rows: [], rowsAffected: result.rowsAffected }];
  }
  if (result.columns.length > 0 || result.rows.length > 0) {
    return [
      {
        label: "SELECT 1",
        columns: result.columns,
        rows: result.rows,
        truncated: result.truncated,
      },
    ];
  }
  return [];
}

function ResultTable({ set }: { set: ResultSet }) {
  if (set.rowsAffected != null && set.columns.length === 0) {
    return <p>{set.rowsAffected} række(r) påvirket.</p>;
  }

  return (
    <>
      {set.truncated && <p className="muted">Viser max antal rækker.</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {set.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {set.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell == null ? "NULL" : String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SqlEditor({
  value,
  onChange,
  onRun,
  onReset,
  onCheck,
  running,
  result,
  checkMessages,
  checkPassed,
  allowWrite,
}: Props) {
  const [tab, setTab] = useState(0);
  const sets = result && !result.error ? normalizeSets(result) : [];

  useEffect(() => {
    setTab(0);
  }, [result]);

  const active = sets[Math.min(tab, Math.max(sets.length - 1, 0))];

  return (
    <div className="sql-panel">
      <div className="sql-toolbar">
        <button type="button" className="btn primary" onClick={onRun} disabled={running}>
          {running ? "Kører…" : "Kør SQL"}
        </button>
        {onReset && (
          <button type="button" className="btn" onClick={onReset} disabled={running}>
            Nulstil data
          </button>
        )}
        {onCheck && (
          <button type="button" className="btn accent" onClick={onCheck} disabled={running}>
            Tjek svar
          </button>
        )}
        <span className="sql-hint">
          {allowWrite ? "Skrivning tilladt" : "Kun SELECT"}
        </span>
      </div>
      <CodeMirror
        value={value}
        height="100%"
        extensions={[sql()]}
        onChange={onChange}
        basicSetup={{ lineNumbers: true }}
        className="sql-editor"
      />
      {result && (
        <div className={`sql-result ${result.ok ? "ok" : "err"}`}>
          {result.error ? (
            <p className="error-text">{result.error}</p>
          ) : (
            <>
              {sets.length > 1 && (
                <div className="result-tabs" role="tablist" aria-label="Resultatsæt">
                  {sets.map((s, i) => (
                    <button
                      key={`${s.label}-${i}`}
                      type="button"
                      role="tab"
                      aria-selected={i === tab}
                      className={`result-tab ${i === tab ? "active" : ""}`}
                      onClick={() => setTab(i)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              {active && <ResultTable set={active} />}
            </>
          )}
        </div>
      )}
      {checkMessages && (
        <div className={`check-box ${checkPassed ? "pass" : "fail"}`}>
          <strong>{checkPassed ? "Bestået" : "Ikke bestået endnu"}</strong>
          <ul>
            {checkMessages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
