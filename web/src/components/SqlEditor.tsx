import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import type { ExecuteResult, ResultSet } from "../api";

type Props = {
  value: string;
  onChange: (v: string) => void;
  /** Kør SQL. Uden argument = hele editoren; med argument = det markerede (eller eksplicit tekst). */
  onRun: (sqlToRun?: string) => void;
  onReset?: () => void;
  onCheck?: () => void;
  /** Når sat, vises "Log ind" i stedet for "Kør SQL". */
  onLogin?: () => void;
  running?: boolean;
  result?: ExecuteResult | null;
  checkMessages?: string[] | null;
  checkPassed?: boolean | null;
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

const ZOOM_KEY = "sqlh1_editor_zoom";
const ZOOM_MIN = 80;
const ZOOM_MAX = 180;
const ZOOM_STEP = 10;
const ZOOM_DEFAULT = 100;

function readZoom() {
  if (typeof window === "undefined") return ZOOM_DEFAULT;
  const n = Number(localStorage.getItem(ZOOM_KEY));
  if (!Number.isFinite(n)) return ZOOM_DEFAULT;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(n / ZOOM_STEP) * ZOOM_STEP));
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
  onLogin,
  running,
  result,
  checkMessages,
  checkPassed,
}: Props) {
  const [tab, setTab] = useState(0);
  const [zoom, setZoom] = useState(readZoom);
  const sets = result && !result.error ? normalizeSets(result) : [];
  const onRunRef = useRef(onRun);
  const runningRef = useRef(running);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    localStorage.setItem(ZOOM_KEY, String(zoom));
  }, [zoom]);

  useEffect(() => {
    setTab(0);
  }, [result]);

  const bumpZoom = (delta: number) => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
  };

  const extensions = useMemo(
    () => [
      sql(),
      Prec.high(
        keymap.of([
          {
            key: "Mod-Enter",
            run: (view) => {
              if (runningRef.current) return true;
              const sel = view.state.selection.main;
              const selected = sel.empty
                ? ""
                : view.state.sliceDoc(sel.from, sel.to);
              const sqlText = selected.trim().length > 0 ? selected : view.state.doc.toString();
              onRunRef.current(sqlText);
              return true;
            },
          },
          {
            key: "Mod-=",
            run: () => {
              bumpZoom(ZOOM_STEP);
              return true;
            },
          },
          {
            key: "Mod-Plus",
            run: () => {
              bumpZoom(ZOOM_STEP);
              return true;
            },
          },
          {
            key: "Mod-",
            run: () => {
              bumpZoom(-ZOOM_STEP);
              return true;
            },
          },
          {
            key: "Mod-0",
            run: () => {
              setZoom(ZOOM_DEFAULT);
              return true;
            },
          },
        ]),
      ),
    ],
    [],
  );

  const active = sets[Math.min(tab, Math.max(sets.length - 1, 0))];
  const fontPx = (14 * zoom) / 100;

  return (
    <div className="sql-panel">
      <div className="sql-toolbar">
        {onLogin ? (
          <button type="button" className="btn primary" onClick={onLogin}>
            Log ind
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={() => onRun()} disabled={running}>
            {running ? "Kører…" : "Kør SQL"}
          </button>
        )}
        {onReset && !onLogin && (
          <button type="button" className="btn" onClick={onReset} disabled={running}>
            Nulstil data
          </button>
        )}
        {onCheck && !onLogin && (
          <button type="button" className="btn accent" onClick={onCheck} disabled={running}>
            Tjek svar
          </button>
        )}
        <div className="sql-zoom" title="Zoom i editor (Ctrl+= / Ctrl+- / Ctrl+0)">
          <span className="sql-zoom-label" aria-hidden="true">
            A
          </span>
          <input
            type="range"
            className="sql-zoom-slider"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            onDoubleClick={() => setZoom(ZOOM_DEFAULT)}
            aria-label={`Editor-zoom ${zoom} procent`}
          />
          <span className="sql-zoom-label sql-zoom-label-lg" aria-hidden="true">
            A
          </span>
          <span className="sql-zoom-value">{zoom}%</span>
        </div>
      </div>
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        onChange={onChange}
        basicSetup={{ lineNumbers: true }}
        className="sql-editor"
        style={{ ["--sql-font-size" as string]: `${fontPx}px` }}
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
