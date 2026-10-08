import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import { LearnPager, ModuleNav } from "../components/ModuleNav";
import { SqlEditor } from "../components/SqlEditor";
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

  async function onRun() {
    if (!(await ensureReady()) || !item) return;
    setRunning(true);
    setError(null);
    try {
      const res = await executeSql(sql, item.slug, item.sandbox?.allowWrite);
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
        <div className={`learn-main ${showSandbox ? "with-sandbox" : ""}`}>
          <article className="lesson">
            <p className="eyebrow">
              <Link to={`/modules/${item.module}`}>Modul</Link>
              {" · "}
              {item.kind === "exercise" ? "Opgave" : "Teori"}
            </p>
            <h1>{item.title}</h1>
            <div className="md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.markdown}</ReactMarkdown>
            </div>
            {error && <p className="error-text">{error}</p>}
            <LearnPager moduleSlug={item.module} currentSlug={item.slug} />
          </article>

          {showSandbox && (
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
          )}
        </div>
      </div>
    </div>
  );
}
