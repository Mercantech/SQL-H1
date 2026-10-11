import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  checkExercise,
  executeSql,
  fetchContent,
  fetchModules,
  putProgress,
  resetSandbox,
  type ContentDto,
  type ExecuteResult,
  type ModuleDto,
} from "../api";
import { beginLogin, isLoggedIn } from "../auth";
import { ExerciseSchema } from "../components/ExerciseSchema";
import { LearningObjectives } from "../components/LearningObjectives";
import { appendCodeToEditor, Markdown } from "../components/Markdown";
import { LearnPager, ModuleNav } from "../components/ModuleNav";
import { SqlEditor } from "../components/SqlEditor";
import { useLearnSplit } from "../hooks/useLearnSplit";
import { useModuleNavOpen } from "../hooks/useModuleNavOpen";
import { useSandboxOpen } from "../hooks/useSandboxOpen";

export function Learn() {
  const { slug } = useParams();
  const [item, setItem] = useState<ContentDto | null>(null);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [checkMessages, setCheckMessages] = useState<string[] | null>(null);
  const [checkPassed, setCheckPassed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useModuleNavOpen();
  const [sandboxOpen, setSandboxOpen] = useSandboxOpen();
  const split = useLearnSplit();

  useEffect(() => {
    fetchModules().then(setModules).catch(() => setModules([]));
  }, []);

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

  const moduleIntro = useMemo(() => {
    if (!item) return null;
    const mod = modules.find((m) => m.slug === item.module);
    if (!mod?.objectives?.length) return null;
    const firstTheory = [...mod.items]
      .filter((i) => i.kind === "theory")
      .sort((a, b) => a.order - b.order)[0];
    if (!firstTheory || firstTheory.slug !== item.slug) return null;
    return mod;
  }, [item, modules]);

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
  const editorVisible = showSandbox && sandboxOpen;

  function openSandbox() {
    setSandboxOpen(true);
  }

  return (
    <div
      className={`learn-shell ${navOpen ? "nav-open" : "nav-closed"} ${
        showSandbox ? (sandboxOpen ? "sandbox-open" : "sandbox-closed") : ""
      }`}
    >
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
          ref={editorVisible ? split.containerRef : undefined}
          className={`learn-main ${editorVisible ? "with-sandbox" : ""} ${
            showSandbox ? (sandboxOpen ? "sandbox-open" : "sandbox-closed") : ""
          }`}
          style={
            editorVisible
              ? {
                  gridTemplateColumns: `minmax(0, ${split.percent}fr) 10px minmax(0, ${
                    100 - split.percent
                  }fr) 22px`,
                }
              : showSandbox
                ? { gridTemplateColumns: "minmax(0, 1fr) 22px" }
                : undefined
          }
        >
          <article className="lesson">
            <div className="lesson-toolbar">
              <p className="eyebrow">
                <Link to={`/modules/${item.module}`}>Modul</Link>
                {" · "}
                {item.kind === "exercise" ? "Opgave" : "Teori"}
              </p>
              {item.kind === "theory" && (
                <Link
                  to={`/present/${item.slug}`}
                  className="btn ghost lesson-present-btn"
                  title="Åbn som slideshow til undervisning"
                >
                  Præsentation
                </Link>
              )}
            </div>
            <h1>{item.title}</h1>
            {moduleIntro && (
              <LearningObjectives objectives={moduleIntro.objectives} />
            )}
            {item.kind === "exercise" && item.schema && <ExerciseSchema schema={item.schema} />}
            <div className="md">
              <Markdown
                onInsertCode={
                  showSandbox
                    ? (code) => {
                        openSandbox();
                        setSql((prev) => appendCodeToEditor(prev, code));
                      }
                    : undefined
                }
                onRunCode={
                  showSandbox
                    ? (code) => {
                        openSandbox();
                        setSql(code);
                        void onRun(code);
                      }
                    : undefined
                }
              >
                {item.markdown}
              </Markdown>
            </div>
            {error && <p className="error-text">{error}</p>}
            <LearnPager moduleSlug={item.module} currentSlug={item.slug} />
          </article>

          {showSandbox && editorVisible && (
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
              <aside id="learn-sandbox" className="sandbox">
                <SqlEditor
                  value={sql}
                  onChange={setSql}
                  onRun={onRun}
                  onReset={onReset}
                  onCheck={item.kind === "exercise" ? onCheck : undefined}
                  onLogin={isLoggedIn() ? undefined : () => beginLogin()}
                  running={running}
                  result={result}
                  checkMessages={checkMessages}
                  checkPassed={checkPassed}
                />
              </aside>
            </>
          )}

          {showSandbox && (
            <button
              type="button"
              className="sandbox-fold"
              onClick={() => setSandboxOpen((v) => !v)}
              aria-expanded={sandboxOpen}
              aria-controls="learn-sandbox"
              title={sandboxOpen ? "Skjul SQL-editor" : "Vis SQL-editor"}
              aria-label={sandboxOpen ? "Skjul SQL-editor" : "Vis SQL-editor"}
            >
              <span aria-hidden="true">{sandboxOpen ? "›" : "‹"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
