import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import hljs from "highlight.js/lib/core";
import sqlLang from "highlight.js/lib/languages/sql";
import {
  deleteQueryHistoryItem,
  fetchQueryHistory,
  type ExecuteResult,
  type QueryHistoryItem,
  type ResultSet,
} from "../api";

hljs.registerLanguage("sql", sqlLang);

type Props = {
  value: string;
  onChange: (v: string) => void;
  /** Kør SQL. Uden argument = hele editoren; med argument = det markerede (eller eksplicit tekst). */
  onRun: (sqlToRun?: string) => void | Promise<void>;
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

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("da-DK", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function previewSql(sqlText: string) {
  const trimmed = sqlText.replace(/\r\n/g, "\n").trim();
  const lines = trimmed.split("\n");
  const clipped = lines.length > 6 ? `${lines.slice(0, 6).join("\n")}\n…` : trimmed;
  return clipped.length > 280 ? `${clipped.slice(0, 280)}…` : clipped;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightSqlPreview(sqlText: string) {
  const preview = previewSql(sqlText);
  try {
    return hljs.highlight(preview, { language: "sql" }).value;
  } catch {
    return escapeHtml(preview);
  }
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const sets = result && !result.error ? normalizeSets(result) : [];
  const onRunRef = useRef(onRun);
  const runningRef = useRef(running);

  const loadHistory = useCallback(async () => {
    if (onLogin) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      setHistory(await fetchQueryHistory(40));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [onLogin]);

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

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!running && !onLogin) {
      const t = window.setTimeout(() => loadHistory(), 250);
      return () => window.clearTimeout(t);
    }
  }, [running, result, onLogin, loadHistory]);

  const bumpZoom = (delta: number) => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
  };

  async function runSql(sqlText?: string) {
    await onRun(sqlText);
  }

  async function copyHistory(item: QueryHistoryItem) {
    try {
      await navigator.clipboard.writeText(item.sql);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId((id) => (id === item.id ? null : id)), 1400);
    } catch {
      /* ignore */
    }
  }

  async function removeHistory(id: number) {
    try {
      await deleteQueryHistoryItem(id);
      setHistory((rows) => rows.filter((r) => r.id !== id));
    } catch {
      /* ignore */
    }
  }

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
              const selected = sel.empty ? "" : view.state.sliceDoc(sel.from, sel.to);
              const sqlText = selected.trim().length > 0 ? selected : view.state.doc.toString();
              void onRunRef.current(sqlText);
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
          <button type="button" className="btn primary" onClick={() => void runSql()} disabled={running}>
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
        {!onLogin && (
          <button
            type="button"
            className={`btn sql-history-toggle ${historyOpen ? "active" : ""}`}
            onClick={() => {
              setHistoryOpen((v) => !v);
              if (!historyOpen) void loadHistory();
            }}
            aria-expanded={historyOpen}
          >
            Historik{history.length > 0 ? ` (${history.length})` : ""}
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

      {historyOpen && !onLogin && (
        <div className="sql-history">
          <div className="sql-history-head">
            <strong>Tidligere SQL</strong>
            <button type="button" className="btn ghost sql-history-refresh" onClick={() => void loadHistory()}>
              Opdater
            </button>
          </div>
          {historyLoading && <p className="muted sql-history-empty">Henter historik…</p>}
          {!historyLoading && history.length === 0 && (
            <p className="muted sql-history-empty">Ingen kørsler endnu — kør noget SQL for at fylde historikken.</p>
          )}
          {!historyLoading && history.length > 0 && (
            <ul className="sql-history-list">
              {history.map((item) => (
                <li key={item.id} className={`sql-history-item ${item.ok ? "ok" : "err"}`}>
                  <div className="sql-history-meta">
                    <span className={`sql-history-status ${item.ok ? "ok" : "err"}`}>
                      {item.ok ? "OK" : "Fejl"}
                    </span>
                    <time dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
                    {item.contentSlug && <span className="muted">{item.contentSlug}</span>}
                  </div>
                  <pre className="sql-history-sql">
                    <code
                      className="hljs language-sql"
                      dangerouslySetInnerHTML={{ __html: highlightSqlPreview(item.sql) }}
                    />
                  </pre>
                  {item.error && <p className="sql-history-error">{item.error}</p>}
                  <div className="sql-history-actions">
                    <button
                      type="button"
                      className="btn primary"
                      disabled={running}
                      onClick={() => {
                        onChange(item.sql);
                        void runSql(item.sql);
                      }}
                    >
                      Kør igen
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => onChange(item.sql)}
                      title="Erstat editorens indhold"
                    >
                      Indsæt i editor
                    </button>
                    <button type="button" className="btn" onClick={() => void copyHistory(item)}>
                      {copiedId === item.id ? "Kopieret" : "Kopiér"}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => void removeHistory(item.id)}
                      aria-label="Slet fra historik"
                    >
                      Slet
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
