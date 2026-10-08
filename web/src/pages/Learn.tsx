import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  checkExercise,
  executeSql,
  fetchContent,
  putProgress,
  resetSandbox,
  type ContentDto,
  type ExecuteResult,
} from "../api";
import { beginLogin, isLoggedIn } from "../auth";
import { Markdown } from "../components/Markdown";
import { LearnPager, ModuleNav } from "../components/ModuleNav";
import { SqlEditor } from "../components/SqlEditor";
import { useLearnSplit } from "../hooks/useLearnSplit";
import { useModuleNavOpen } from "../hooks/useModuleNavOpen";

export function Learn() {
  const { slug } = useParams();
  const [item, setItem] = useState<ContentDto | null>(null);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [checkMessages, setCheckMessages] = useState<string[] | null>(null);
  const [checkPassed, setCheckPassed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useModuleNavOpen();
  const split = useLearnSplit();

  useEffect(() => {
    if (!slug) return;
    fetchContent(slug)
      .then((c) => {
        setItem(c);
        setSql(c.sandbox?.starterSql?.trim() || "SELECT 1;");
        setResult(null);
        setCheckMessages(null);
        setCheckPassed(null);
        if (c.kind === "theory" && isLoggedIn()) {
          putProgress(c.slug, "completed").catch(() => undefined);
        }
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  async function ensureReady() {
    if (!isLoggedIn()) {
      beginLogin();
      return false;
    }
    return true;
  }

  async function onRun(sqlToRun?: string) {
    if (!(await ensureReady()) || !item) return;
    const query = (sqlToRun ?? sql).trim();
    if (!query) return;
    setRunning(true);
    setError(null);
    try {
      const res = await executeSql(query, item.slug, item.sandbox?.allowWrite);
      setResult(res);
      await putProgress(item.slug, "started").catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setRunning(false);
    }
  }

  async function onReset() {
    if (!(await ensureReady()) || !item) return;
    setRunning(true);
    try {
      await resetSandbox(item.slug);
      setResult(null);
      setCheckMessages(null);
      setCheckPassed(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setRunning(false);
    }
  }

  async function onCheck() {
    if (!(await ensureReady()) || !item) return;
    setRunning(true);
    try {
      const res = await checkExercise(item.slug);
      setCheckMessages(res.messages);
      setCheckPassed(res.passed);
      if (res.passed) {
        await putProgress(item.slug, "completed").catch(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setRunning(false);
    }
  }

  if (error && !item) return <p className="error-text">{error}</p>;
  if (!item) return <p className="muted learn-loading">Henter lektion…</p>;

  const showSandbox = Boolean(item.sandbox);

  return (
    <div className={`learn-shell ${navOpen ? "nav-open" : "nav-closed"}`}>
      {navOpen && (
        <button
          type="button"
          className="module-nav-backdrop"
          aria-label="Luk menu"
          onClick={() => setNavOpen(false)}
        />
      )}

      <ModuleNav
        moduleSlug={item.module}
        currentSlug={item.slug}
        mobileOpen={navOpen}
        onNavigate={() => {
          if (window.matchMedia("(max-width: 900px)").matches) setNavOpen(false);
        }}
        onToggle={() => setNavOpen((v) => !v)}
      />

      <div className="learn-body">
        <div
          ref={showSandbox ? split.containerRef : undefined}
          className={`learn-main ${showSandbox ? "with-sandbox" : ""}`}
          style={
            showSandbox
              ? {
                  gridTemplateColumns: `minmax(0, ${split.percent}fr) 10px minmax(0, ${100 - split.percent}fr)`,
                }
              : undefined
          }
        >
          <article className="lesson">
            <p className="eyebrow">
              <Link to={`/modules/${item.module}`}>Modul</Link>
              {" · "}
              {item.kind === "exercise" ? "Opgave" : "Teori"}
            </p>
            <h1>{item.title}</h1>
            <div className="md">
              <Markdown>{item.markdown}</Markdown>
            </div>
            {error && <p className="error-text">{error}</p>}
            <LearnPager moduleSlug={item.module} currentSlug={item.slug} />
          </article>

          {showSandbox && (
            <>
              <div
                className="learn-split"
                role="separator"
                aria-orientation="vertical"
                aria-label="Træk for at justere bredde mellem teori og emulator"
                aria-valuenow={Math.round(split.percent)}
                aria-valuemin={22}
                aria-valuemax={78}
                tabIndex={0}
                onPointerDown={split.onPointerDown}
                onKeyDown={split.onKeyDown}
              />
              <aside className="sandbox">
                <h2>Prøv selv</h2>
                {!isLoggedIn() && (
                  <p className="login-nudge">
                    <button type="button" className="btn primary" onClick={() => beginLogin()}>
                      Log ind
                    </button>{" "}
                    for at køre SQL i din egen database.
                  </p>
                )}
                <SqlEditor
                  value={sql}
                  onChange={setSql}
                  onRun={onRun}
                  onReset={onReset}
                  onCheck={item.kind === "exercise" ? onCheck : undefined}
                  running={running}
                  result={result}
                  checkMessages={checkMessages}
                  checkPassed={checkPassed}
                  allowWrite={item.sandbox?.allowWrite}
                />
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
