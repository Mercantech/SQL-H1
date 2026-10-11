import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  executeSql,
  fetchContent,
  resetSandbox,
  type ContentDto,
  type ExecuteResult,
} from "../api";
import { beginLogin, isLoggedIn } from "../auth";
import { appendCodeToEditor, Markdown } from "../components/Markdown";
import { SqlEditor } from "../components/SqlEditor";
import { useLearnSplit } from "../hooks/useLearnSplit";
import { splitMarkdownToSlides } from "../lib/splitSlides";

export function Present() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ContentDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const split = useLearnSplit();

  useEffect(() => {
    if (!slug) return;
    fetchContent(slug)
      .then((c) => {
        setItem(c);
        setSql(c.sandbox?.starterSql?.trim() || "SELECT 1;");
        setResult(null);
        setIndex(0);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Fejl"));
  }, [slug]);

  const slides = useMemo(() => {
    if (!item) return [];
    return splitMarkdownToSlides(item.markdown, item.title);
  }, [item]);

  const slide = slides[index] ?? null;
  const showSandbox = Boolean(item?.sandbox);
  const editorVisible = showSandbox && editorOpen;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = i + delta;
        if (next < 0 || next >= slides.length) return i;
        return next;
      });
    },
    [slides.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setIndex(Math.max(0, slides.length - 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (slug) navigate(`/learn/${slug}`);
      } else if (e.key === "e" || e.key === "E") {
        if (showSandbox) {
          e.preventDefault();
          setEditorOpen((v) => !v);
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          void document.documentElement.requestFullscreen?.();
        } else {
          void document.exitFullscreen?.();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, navigate, showSandbox, slides.length, slug]);

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
      setResult(await executeSql(query, item.slug, item.sandbox?.allowWrite));
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setRunning(false);
    }
  }

  if (error && !item) {
    return (
      <div className="present-shell present-shell--empty">
        <p className="error-text">{error}</p>
        <Link to="/modules">Tilbage til moduler</Link>
      </div>
    );
  }

  if (!item || !slide) {
    return (
      <div className="present-shell present-shell--empty">
        <p className="muted">Henter præsentation…</p>
      </div>
    );
  }

  return (
    <div className={`present-shell ${editorVisible ? "with-editor" : ""}`}>
      <header className="present-chrome">
        <div className="present-chrome-left">
          <Link to={`/learn/${item.slug}`} className="present-exit" title="Esc">
            Afslut
          </Link>
          <span className="present-lesson muted">{item.title}</span>
        </div>
        <div className="present-chrome-right">
          {showSandbox && (
            <button
              type="button"
              className={`btn ghost present-tool ${editorOpen ? "active" : ""}`}
              onClick={() => setEditorOpen((v) => !v)}
              title="E"
            >
              {editorOpen ? "Skjul editor" : "SQL-editor"}
            </button>
          )}
          <button
            type="button"
            className="btn ghost present-tool"
            onClick={() => {
              if (!document.fullscreenElement) {
                void document.documentElement.requestFullscreen?.();
              } else {
                void document.exitFullscreen?.();
              }
            }}
            title="F"
          >
            Fuld skærm
          </button>
          <span className="present-counter" aria-live="polite">
            {index + 1} / {slides.length}
          </span>
        </div>
      </header>

      <div
        ref={editorVisible ? split.containerRef : undefined}
        className={`present-main ${editorVisible ? "with-sandbox" : ""}`}
        style={
          editorVisible
            ? {
                gridTemplateColumns: `minmax(0, ${split.percent}fr) 10px minmax(0, ${
                  100 - split.percent
                }fr)`,
              }
            : undefined
        }
      >
        <section className="present-stage" aria-label={`Slide ${index + 1}`}>
          <button
            type="button"
            className="present-hit present-hit-prev"
            aria-label="Forrige slide"
            disabled={index <= 0}
            onClick={() => go(-1)}
          />
          <div className="present-slide md">
            <Markdown
              onInsertCode={
                showSandbox
                  ? (code) => {
                      setEditorOpen(true);
                      setSql((prev) => appendCodeToEditor(prev, code));
                    }
                  : undefined
              }
              onRunCode={
                showSandbox
                  ? (code) => {
                      setEditorOpen(true);
                      setSql(code);
                      void onRun(code);
                    }
                  : undefined
              }
            >
              {slide.markdown}
            </Markdown>
          </div>
          <button
            type="button"
            className="present-hit present-hit-next"
            aria-label="Næste slide"
            disabled={index >= slides.length - 1}
            onClick={() => go(1)}
          />
        </section>

        {editorVisible && (
          <>
            <div
              className="learn-split"
              role="separator"
              aria-orientation="vertical"
              aria-label="Træk for at justere bredde"
              aria-valuenow={Math.round(split.percent)}
              aria-valuemin={22}
              aria-valuemax={78}
              tabIndex={0}
              onPointerDown={split.onPointerDown}
              onKeyDown={split.onKeyDown}
            />
            <aside className="sandbox present-sandbox">
              <SqlEditor
                value={sql}
                onChange={setSql}
                onRun={onRun}
                onReset={onReset}
                onLogin={isLoggedIn() ? undefined : () => beginLogin()}
                running={running}
                result={result}
              />
            </aside>
          </>
        )}
      </div>

      <footer className="present-footer">
        <button type="button" className="btn ghost" disabled={index <= 0} onClick={() => go(-1)}>
          ← Forrige
        </button>
        <p className="present-hint muted">
          Piletaster / mellemrum · <kbd>E</kbd> editor · <kbd>F</kbd> fuld skærm · <kbd>Esc</kbd>{" "}
          afslut
        </p>
        <button
          type="button"
          className="btn primary"
          disabled={index >= slides.length - 1}
          onClick={() => go(1)}
        >
          Næste →
        </button>
      </footer>

      {error && <p className="present-error error-text">{error}</p>}
    </div>
  );
}
