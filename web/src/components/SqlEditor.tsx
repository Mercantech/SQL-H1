import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import type { ExecuteResult } from "../api";

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
        height="220px"
        extensions={[sql()]}
        onChange={onChange}
        basicSetup={{ lineNumbers: true }}
        className="sql-editor"
      />
      {result && (
        <div className={`sql-result ${result.ok ? "ok" : "err"}`}>
          {result.error ? (
            <p className="error-text">{result.error}</p>
          ) : result.rowsAffected != null && result.columns.length === 0 ? (
            <p>{result.rowsAffected} række(r) påvirket.</p>
          ) : (
            <>
              {result.truncated && <p className="muted">Viser max antal rækker.</p>}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {result.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
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
