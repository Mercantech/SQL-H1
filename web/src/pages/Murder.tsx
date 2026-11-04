import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLanguage, SQLite } from "@codemirror/lang-sql";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { MurderOnboarding } from "../components/MurderOnboarding";
import { createMurderEngine, type MurderQueryResult } from "../lib/murder/engine";
import { checkAccusation, HINTS, MURDER_TABLES, STARTER_SQL } from "../lib/murder/seed";
import "./murder.css";

const STORAGE_KEY = "sqlh1_murder_case_v1";
const INTRO_KEY = "sqlh1_murder_intro_v1";
const EDITOR_SETUP = { lineNumbers: true, foldGutter: false };
type HistoryEntry = { id: number; sql: string; rows: number };
type CaseState = { sql: string; notes: string; killerSolved: boolean; mastermindSolved: boolean; history: HistoryEntry[] };

function freshCase(): CaseState {
  return { sql: STARTER_SQL, notes: "", killerSolved: false, mastermindSolved: false, history: [] };
}

function needsIntroduction() {
  try { return localStorage.getItem(INTRO_KEY) !== "seen"; }
  catch { return true; }
}

function readCase(): CaseState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return freshCase();
    const value = saved as Partial<CaseState>;
    return {
      sql: typeof value.sql === "string" ? value.sql.slice(0, 30000) : STARTER_SQL,
      notes: typeof value.notes === "string" ? value.notes.slice(0, 10000) : "",
      killerSolved: value.killerSolved === true,
      mastermindSolved: value.killerSolved === true && value.mastermindSolved === true,
      history: Array.isArray(value.history) ? value.history.filter((item): item is HistoryEntry =>
        Boolean(item) && typeof item.sql === "string" && item.sql.length <= 30000 &&
        typeof item.id === "number" && typeof item.rows === "number").slice(0, 15) : [],
    };
  } catch { return freshCase(); }
}

const profiles = [
  { name: "Anders Hejlsberg", initials: "AH", field: "C# · TypeScript", bio: "Oprindelig designer af C#, Delphi og Turbo Pascal. Hovedarkitekt bag TypeScript.", url: "https://devblogs.microsoft.com/typescript/author/andersh/", source: "Microsoft" },
  { name: "Mads Torgersen", initials: "MT", field: "C# · .NET", bio: "Ledende designer af C# og arkitekt på Microsofts .NET-hold.", url: "https://devblogs.microsoft.com/dotnet/author/madst/", source: "Microsoft" },
  { name: "Thomas Kejser", initials: "TK", field: "SQL · Databaseperformance", bio: "Dansk databaseekspert med mange års arbejde med SQL og bidrag til Yellowbrick-databasemotoren.", url: "https://database-doctor.com/about", source: "Database Doctor" },
  { name: "Bjarne Stroustrup", initials: "BS", field: "C++", bio: "Designede og implementerede oprindeligt C++. Født i Aarhus og uddannet ved Aarhus Universitet.", url: "https://stroustrup.com/bio.html", source: "Stroustrups biografi" },
  { name: "Rasmus Lerdorf", initials: "RL", field: "PHP", bio: "Skabte de første PHP-værktøjer i 1994 og offentliggjorde kildekoden i 1995.", url: "https://www.php.net/manual/en/history.php.php", source: "PHPs officielle historie" },
  { name: "David Heinemeier Hansson", initials: "DH", field: "Ruby on Rails", bio: "Dansk programmør og skaberen af webframeworket Ruby on Rails.", url: "https://rubyonrails.org/world/2024/speakers/david-hansson", source: "Rails World" },
];

export function Murder() {
  const [caseState, setCaseState] = useState(readCase);
  const [introOpen, setIntroOpen] = useState(needsIntroduction);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MurderQueryResult | null>(null);
  const [error, setError] = useState("");
  const [resultTab, setResultTab] = useState(0);
  const [sideTab, setSideTab] = useState<"schema" | "hints" | "guide">("schema");
  const [hintSteps, setHintSteps] = useState<Record<number, number>>({});
  const [accused, setAccused] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [resetPending, setResetPending] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const engine = useRef<ReturnType<typeof createMurderEngine> | null>(null);
  const editorView = useRef<EditorView | null>(null);
  const runRef = useRef<(sql?: string) => void>(() => undefined);
  const runningRef = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    engine.current = createMurderEngine();
    return () => { generation.current++; engine.current?.dispose(); engine.current = null; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(caseState)); setStorageAvailable(true); }
    catch { setStorageAvailable(false); }
  }, [caseState]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "SQL Murder Mystery · Mordet på Datatopmødet · SQL-H1";
    return () => { document.title = previousTitle; };
  }, []);

  const runQuery = useCallback(async (explicitSql?: string) => {
    if (runningRef.current || !engine.current) return;
    const view = editorView.current;
    const selection = view?.state.selection.main;
    const selected = selection && !selection.empty ? view?.state.sliceDoc(selection.from, selection.to) : "";
    const query = explicitSql ?? (selected?.trim() ? selected : view?.state.doc.toString() || caseState.sql);
    if (!query.trim()) { setError("Skriv en SQL-forespørgsel først."); return; }
    const currentGeneration = generation.current;
    runningRef.current = true;
    setRunning(true);
    setError("");
    try {
      const nextResult = await engine.current.run(query);
      if (currentGeneration !== generation.current) return;
      setResult(nextResult);
      setResultTab(0);
      setCaseState((state) => ({ ...state, history: [{ id: Date.now(), sql: query, rows: nextResult.sets.reduce((sum, set) => sum + set.rows.length, 0) }, ...state.history].slice(0, 15) }));
    } catch (cause) {
      if (currentGeneration !== generation.current) return;
      setResult(null);
      setError(cause instanceof Error ? cause.message : "Forespørgslen kunne ikke køres. Prøv igen.");
    } finally {
      if (currentGeneration === generation.current) { runningRef.current = false; setRunning(false); }
    }
  }, [caseState.sql]);
  useEffect(() => { runRef.current = (query) => { void runQuery(query); }; }, [runQuery]);

  const extensions = useMemo(() => [
    sqlLanguage({ dialect: SQLite, schema: Object.fromEntries(MURDER_TABLES.map((table) => [table.name, table.columns.map((column) => column.name)])) }),
    EditorView.lineWrapping,
    Prec.high(keymap.of([{ key: "Mod-Enter", run: () => { runRef.current(); return true; } }])),
    EditorView.theme({ "&": { fontSize: "13px" }, ".cm-content, .cm-gutters": { fontFamily: "var(--font-mono)" }, ".cm-scroller": { overflow: "auto" } }),
  ], []);

  function insertSql(query: string) {
    const view = editorView.current;
    if (!view) return;
    const end = view.state.doc.length;
    const prefix = end ? "\n\n" : "";
    view.dispatch({ changes: { from: end, insert: prefix + query }, selection: { anchor: end + prefix.length, head: end + prefix.length + query.length }, scrollIntoView: true });
    view.focus();
  }

  function submitAccusation(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const phase = caseState.killerSolved ? "mastermind" : "killer";
    const verdict = checkAccusation(accused, phase);
    setFeedback(verdict);
    if (verdict.correct) {
      setCaseState((state) => ({ ...state, ...(phase === "killer" ? { killerSolved: true } : { mastermindSolved: true }) }));
      setAccused("");
    }
  }

  function resetCase() {
    generation.current++;
    engine.current?.dispose();
    engine.current = createMurderEngine();
    runningRef.current = false;
    setRunning(false);
    setCaseState(freshCase());
    setResult(null);
    setError("");
    setFeedback(null);
    setAccused("");
    setHintSteps({});
    setResetPending(false);
    try { localStorage.removeItem(INTRO_KEY); } catch { /* The introduction works without storage. */ }
    setIntroOpen(true);
  }

  function closeIntroduction() {
    try { localStorage.setItem(INTRO_KEY, "seen"); } catch { /* The current visit can still continue. */ }
    setIntroOpen(false);
  }

  const activeSet = result?.sets[resultTab];
  return (
    <article className="murder-page">
      <MurderOnboarding open={introOpen} onClose={closeIntroduction} hasProgress={caseState.history.length > 0 || caseState.notes.length > 0 || caseState.sql !== STARTER_SQL || caseState.killerSolved} />
      <header className="murder-compact-header">
        <div>
          <p className="murder-eyebrow">Et dansk SQL Murder Mystery</p>
          <h1>Mordet på Datatopmødet.</h1>
        </div>
        <div className="murder-header-actions">
          <span className="murder-case-tag">SAG 014 / {caseState.mastermindSolved ? "OPKLARET" : "ÅBEN"}</span>
          <button className="murder-tool" type="button" onClick={() => setIntroOpen(true)}>Introduktion</button>
        </div>
      </header>

      <div className="murder-workspace" id="murder-workbench">
        <aside className="murder-dossier" aria-label="Sagsmappe og hjælp">
          <section className="murder-case-reminder">
            <span className="murder-eyebrow">Mord · Viborg · 2026-10-14</span>
            <p>Find mordrapporten i <code>sagsrapporter</code>.</p>
          </section>
          <div className="murder-side-nav" role="group" aria-label="Efterforskningshjælp">
            {([["schema", "Tabeller"], ["hints", "Hints"], ["guide", "SQL-guide"]] as const).map(([id, label]) => <button key={id} type="button" className={sideTab === id ? "is-active" : ""} aria-pressed={sideTab === id} onClick={() => setSideTab(id)}>{label}</button>)}
          </div>
          <div className="murder-side-content">
            <div hidden={sideTab !== "schema"}>
              <p className="murder-side-intro">{MURDER_TABLES.length} tabeller. Åbn en tabel for kolonner og relationer.</p>
              {MURDER_TABLES.map((table) => <details className="murder-schema-table" key={table.name}>
                <summary><code>{table.name}</code><span>{table.columns.length}</span></summary>
                <p>{table.description}</p>
                <ul>{table.columns.map((column) => <li key={column.name}><code className={column.key === "PK" ? "murder-column-key" : ""}>{column.name}{column.key ? ` · ${column.key}` : ""}</code><small>{column.type}</small>{column.references && <span className="murder-column-ref">↳ {column.references}</span>}</li>)}</ul>
                <button className="murder-tool" type="button" onClick={() => insertSql(`SELECT * FROM ${table.name}\nLIMIT 10;`)}>Indsæt SELECT</button>
              </details>)}
            </div>
            <div hidden={sideTab !== "hints"}>
              <p className="murder-side-intro">Åbn ét spor ad gangen. Sidste hjælpetrin viser SQL.</p>
              {HINTS.map((hint, index) => <details className="murder-hint" key={hint.title}>
                <summary>{String(index + 1).padStart(2, "0")} / {hint.title}</summary>
                {hint.steps.slice(0, hintSteps[index] || 1).map((step) => <p key={step}>{step}</p>)}
                {(hintSteps[index] || 1) <= hint.steps.length ? <button className="murder-tool" type="button" onClick={() => setHintSteps((steps) => ({ ...steps, [index]: (steps[index] || 1) + 1 }))}>{(hintSteps[index] || 1) === hint.steps.length ? "Vis SQL-eksempel" : "Vis næste hint"}</button> : <><pre><code>{hint.sql}</code></pre><button className="murder-tool" type="button" onClick={() => insertSql(hint.sql)}>Indsæt eksemplet</button></>}
              </details>)}
            </div>
            <div hidden={sideTab !== "guide"} className="murder-guide">
              <h3>Første gang med SQL?</h3>
              <p><code>SELECT</code> vælger kolonner. <code>FROM</code> vælger tabellen. <code>WHERE</code> filtrerer rækker.</p>
              <pre><code>{"SELECT *\nFROM sagsrapporter\nWHERE by = 'Viborg';"}</code></pre>
              <p>Kombinér betingelser med <code>AND</code>. Søg efter dele af en tekst med <code>LIKE '%tekst%'</code>.</p>
              <h3>Forbind dine spor</h3>
              <pre><code>{"SELECT p.navn, a.udskrift\nFROM personer AS p\nJOIN afhoeringer AS a\n  ON a.person_id = p.id\nWHERE p.navn = 'Anders Hejlsberg';"}</code></pre>
              <p>Et <code>JOIN</code> forbinder tabeller via deres nøgler. I tabeloversigten viser ↳, hvilken kolonne en fremmednøgle peger på.</p>
              <p><code>GROUP BY</code> og <code>HAVING</code> finder mønstre. <code>ORDER BY</code> sorterer. <code>LIMIT</code> begrænser antallet af rækker.</p>
              <p>Her bruger du <strong>SQLite</strong>. Resten af SQL-H1 bruger PostgreSQL. Grundlæggende SELECT og JOIN fungerer ens; fx datoer og specialfunktioner kan variere.</p>
              <a href="https://www.sqlite.org/lang_select.html" target="_blank" rel="noreferrer">SQLite: SELECT-dokumentation ↗</a>
              <Link to="/modules/select">Lær mere om SELECT på SQL-H1 →</Link>
            </div>
          </div>
        </aside>

        <section className="murder-editor-pane" aria-label="SQL-arbejdsbord">
          <div className="murder-editor-header"><div><span className="murder-eyebrow">02 / Arbejdsbordet</span><h2>Spørg databasen.</h2></div><span className="murder-db-status">SQLite · lokalt</span></div>
          <div className="murder-editor">
            <CodeMirror value={caseState.sql} onChange={(value) => setCaseState((state) => ({ ...state, sql: value }))} onCreateEditor={(view) => { editorView.current = view; }} extensions={extensions} theme={oneDark} basicSetup={EDITOR_SETUP} height="260px" aria-label="SQL-editor til efterforskningen" />
          </div>
          <div className="murder-toolbar">
            <button className="murder-run" type="button" disabled={running || !caseState.sql.trim()} onClick={() => { void runQuery(); }}>{running ? "Undersøger…" : "Kør SQL"}<span aria-hidden="true">{running ? "…" : "↗"}</span></button>
            <span className="murder-editor-shortcut"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> · markering eller alt</span>
            <button className="murder-tool" type="button" onClick={() => insertSql("SELECT name, sql\nFROM sqlite_master\nWHERE type = 'table'\nORDER BY name;")}>Vis databaseskema</button>
          </div>

          <section className="murder-result-panel" aria-label="Forespørgselsresultat" aria-busy={running}>
            <div className="murder-result-head"><h3>Resultat</h3><span role="status" aria-live="polite">{running ? "Kører forespørgsel…" : error ? "Forespørgslen fejlede" : activeSet ? `${activeSet.rows.length} række${activeSet.rows.length === 1 ? "" : "r"} · ${Math.round(result?.elapsedMs || 0)} ms` : "Afventer din første forespørgsel"}</span></div>
            {error ? <div className="murder-error" role="alert"><strong>SQL kunne ikke køres</strong><p>{error}</p><small>Kontrollér tabelnavne, kolonner og anførselstegn. Din SQL er bevaret i editoren.</small></div> : result ? <>
              {result.sets.length > 1 && <div className="murder-result-tabs" role="group" aria-label="Vælg resultatsæt">{result.sets.map((_, index) => <button key={index} type="button" aria-pressed={index === resultTab} onClick={() => setResultTab(index)}>Resultat {index + 1}</button>)}</div>}
              {activeSet ? <div className="murder-results-scroll" tabIndex={0} role="region" aria-label="SQL-resultattabel"><table><thead><tr>{activeSet.columns.map((column, index) => <th key={`${column}-${index}`} scope="col">{column}</th>)}</tr></thead><tbody>{activeSet.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell === null ? <span className="murder-null">NULL</span> : String(cell)}</td>)}</tr>)}</tbody></table>{activeSet.rows.length === 0 && <p className="murder-no-rows">Ingen rækker matcher. Prøv at løsne dit filter.</p>}</div> : <p className="murder-no-rows">Ingen resultatsæt. Prøv en SELECT-forespørgsel.</p>}
              {result.truncated && <p className="murder-result-limit">Resultatet er begrænset. Brug WHERE eller LIMIT for at indsnævre søgningen.</p>}
            </> : <div className="murder-empty-state"><h3>Kør din første forespørgsel.</h3><p>Resultaterne vises her.</p></div>}
          </section>

          {caseState.history.length > 0 && <details className="murder-history"><summary>Tidligere forespørgsler <span>{caseState.history.length}</span></summary><ol className="murder-history-list">{caseState.history.map((entry) => <li key={entry.id}><code>{entry.sql}</code><span>{entry.rows} rækker</span><button className="murder-tool" type="button" onClick={() => insertSql(entry.sql)}>Indsæt</button></li>)}</ol></details>}

          <div className="murder-bottom-grid">
            <section className="murder-notebook"><div className="murder-section-head"><h3>Din notesbog</h3><span>Kun i denne browser</span></div><label htmlFor="murder-notes">Spor, id'er og forbindelser</label><textarea id="murder-notes" value={caseState.notes} maxLength={10000} onChange={(event) => setCaseState((state) => ({ ...state, notes: event.target.value }))} placeholder={"Hvem så noget?\nHvilket kort passer til tidsrummet?\nHvad kan jeg dokumentere?"} rows={6} /></section>
            <section className="murder-accusation"><span className="murder-eyebrow">03 / Din konklusion</span><h3>{caseState.mastermindSolved ? "Sagen er opklaret." : caseState.killerSolved ? "Hvem stod bag?" : "Hvem er morderen?"}</h3><ol className="murder-progress"><li className={caseState.killerSolved ? "is-done" : ""}>{caseState.killerSolved ? "✓" : "01"} Gerningspersonen</li><li className={caseState.mastermindSolved ? "is-done" : ""}>{caseState.mastermindSolved ? "✓" : "02"} Bagmanden</li></ol>
              {caseState.mastermindSolved ? <p>Du har fundet både gerningspersonen og bagmanden. Kan du forklare beviskæden med dine egne ord — og samle den i én forespørgsel?</p> : <><p>{caseState.killerSolved ? "Godt arbejde. Læs nu gerningspersonens afhøring, og følg pengene og beskederne." : "Forbind sporene, før du afgiver din konklusion. Skriv personens fulde navn."}</p><form onSubmit={submitAccusation}><label className="murder-sr-only" htmlFor="murder-accused">{caseState.killerSolved ? "Bagmandens fulde navn" : "Gerningspersonens fulde navn"}</label><input id="murder-accused" value={accused} onChange={(event) => setAccused(event.target.value)} placeholder="Fulde navn" maxLength={100} autoComplete="off" required /><button className="murder-run" type="submit">Tjek svar <span aria-hidden="true">→</span></button></form></>}
              {feedback && <p className={`murder-feedback ${feedback.correct ? "is-correct" : "is-wrong"}`} role="status">{feedback.message}</p>}
            </section>
          </div>
        </section>
      </div>

      <details className="murder-profiles"><summary><div><span className="murder-eyebrow">Mød navnene i databasen</span><h2>Danske aftryk på IT-historien.</h2></div><span>6 profiler + kilder ↗</span></summary><p>Virkelige bidrag, opdigtede roller. Biografierne nedenfor er fakta; deltagelsen på Datatopmødet og alle udsagn i spillet er fiktion.</p><div className="murder-profile-grid">{profiles.map((profile) => <article className="murder-profile-card" key={profile.name}><header><span className="murder-profile-initials" aria-hidden="true">{profile.initials}</span><div><h3>{profile.name}</h3><span className="murder-profile-field">{profile.field}</span></div></header><p>{profile.bio}</p><a href={profile.url} target="_blank" rel="noreferrer">Kilde: {profile.source} ↗</a></article>)}</div></details>

      <footer className="murder-footer"><p>Inspireret af <a href="https://mystery.knightlab.com/" target="_blank" rel="noreferrer">SQL Murder Mystery fra Knight Lab ↗</a><br />Egen dansk historie og database · <a href="https://www.sqlite.org/lang.html" target="_blank" rel="noreferrer">SQLite SQL</a></p><div><span role="status">{storageAvailable ? "SQL, noter og fremskridt gemmes i denne browser." : "Browseren tillader ikke lagring. Arbejdet bevares kun, mens siden er åben."}</span><button className="murder-tool" type="button" onClick={() => setResetPending((pending) => !pending)} aria-expanded={resetPending}>Start sagen forfra</button>{resetPending && <div className="murder-reset-confirm"><p>Ryd SQL, noter, historik og løste trin for denne sag?</p><button className="murder-tool" type="button" onClick={resetCase}>Ja, start forfra</button><button className="murder-tool" type="button" onClick={() => setResetPending(false)}>Behold mit arbejde</button></div>}</div></footer>
    </article>
  );
}
