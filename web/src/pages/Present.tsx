import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  executeSql,
  fetchContent,
  fetchModules,
  resetSandbox,
  type ContentDto,
  type ExecuteResult,
  type ModuleDto,
} from "../api";
import { beginLogin, isLoggedIn } from "../auth";
import { appendCodeToEditor, Markdown } from "../components/Markdown";
import { SqlEditor } from "../components/SqlEditor";
import { useLearnSplit } from "../hooks/useLearnSplit";
import { buildFlatPath, type FlatStep } from "../lib/contentPath";
import { splitMarkdownToSlides } from "../lib/splitSlides";

function neighborLabel(from: FlatStep, to: FlatStep, dir: "next" | "prev") {
  const crossModule = from.moduleSlug !== to.moduleSlug;
  if (dir === "next") {
    return crossModule
      ? `Næste modul · ${to.moduleTitle}`
      : "Næste lektion";
  }
  return crossModule
    ? `Forrige modul · ${to.moduleTitle}`
    : "Forrige lektion";
}

export function Present() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ContentDto | null>(null);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
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
        setIndex(0);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Fejl"));
  }, [slug]);

  const slides = useMemo(() => {
    if (!item) return [];
    return splitMarkdownToSlides(item.markdown, item.title);
  }, [item]);

  const flat = useMemo(() => buildFlatPath(modules), [modules]);
  const pathIdx = flat.findIndex((s) => s.item.slug === slug);
  const currentStep = pathIdx >= 0 ? flat[pathIdx] : null;

  /** I præsentation springer vi over opgaver, når vi står på teori. */
  const { prevLesson, nextLesson } = useMemo(() => {
    if (pathIdx < 0) return { prevLesson: null, nextLesson: null };
    const skipExercises = currentStep?.item.kind !== "exercise";
    const find = (dir: 1 | -1): FlatStep | null => {
      for (let i = pathIdx + dir; i >= 0 && i < flat.length; i += dir) {
        const step = flat[i];
        if (skipExercises && step.item.kind === "exercise") continue;
        return step;
      }
      return null;
    };
    return { prevLesson: find(-1), nextLesson: find(1) };
  }, [currentStep?.item.kind, flat, pathIdx]);

  const slide = slides[index] ?? null;
  const showSandbox = Boolean(item?.sandbox);
  const editorVisible = showSandbox && editorOpen;
  const onFirstSlide = index <= 0;
  const onLastSlide = index >= slides.length - 1 && slides.length > 0;

  const goLesson = useCallback(
    (step: FlatStep, dir: "next" | "prev") => {
      if (!currentStep) return;
      const label = neighborLabel(currentStep, step, dir);
      setFlash(`${label}: ${step.item.title}`);
      navigate(`/present/${step.item.slug}`);
    },
    [currentStep, navigate],
  );

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 2800);
    return () => window.clearTimeout(t);
  }, [flash, slug]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = i + delta;
        if (next >= 0 && next < slides.length) return next;
        return i;
      });
    },
    [slides.length],
  );

  const goForward = useCallback(() => {
    if (!onLastSlide) {
      go(1);
      return;
    }
    if (nextLesson && currentStep) goLesson(nextLesson, "next");
  }, [currentStep, go, goLesson, nextLesson, onLastSlide]);

  const goBack = useCallback(() => {
    if (!onFirstSlide) {
      go(-1);
      return;
    }
    if (prevLesson && currentStep) goLesson(prevLesson, "prev");
  }, [currentStep, go, goLesson, onFirstSlide, prevLesson]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goForward();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") {
        e.preventDefault();
        goBack();
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
  }, [goBack, goForward, navigate, showSandbox, slides.length, slug]);

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

  const canGoBack = !onFirstSlide || Boolean(prevLesson);
  const canGoForward = !onLastSlide || Boolean(nextLesson);
  const backIsLesson = onFirstSlide && Boolean(prevLesson);
  const forwardIsLesson = onLastSlide && Boolean(nextLesson);
  const forwardCrossModule =
    forwardIsLesson && nextLesson && currentStep
      ? nextLesson.moduleSlug !== currentStep.moduleSlug
      : false;
  const backCrossModule =
    backIsLesson && prevLesson && currentStep
      ? prevLesson.moduleSlug !== currentStep.moduleSlug
      : false;

  return (
    <div className={`present-shell ${editorVisible ? "with-editor" : ""}`}>
      <header className="present-chrome">
        <div className="present-chrome-left">
          <Link to={`/learn/${item.slug}`} className="present-exit" title="Esc">
            Afslut
          </Link>
          <span className="present-lesson muted">{item.title}</span>
          {currentStep && (
            <span className="present-module-chip" title={currentStep.moduleTitle}>
              {String(currentStep.moduleOrder).padStart(2, "0")} · {currentStep.moduleTitle}
            </span>
          )}
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

      {flash && (
        <div className="present-flash" role="status" aria-live="polite">
          {flash}
        </div>
      )}

      {onLastSlide && nextLesson && currentStep && (
        <div
          className={`present-bridge present-bridge--next ${
            forwardCrossModule ? "present-bridge--module" : ""
          }`}
        >
          <span className="present-bridge-label">
            {forwardCrossModule ? "Sidste slide · næste er nyt modul" : "Sidste slide i lektionen"}
          </span>
          <button
            type="button"
            className="present-bridge-btn"
            onClick={() => goLesson(nextLesson, "next")}
          >
            <span className="present-bridge-dir">
              {neighborLabel(currentStep, nextLesson, "next")}
            </span>
            <span className="present-bridge-title">{nextLesson.item.title}</span>
          </button>
        </div>
      )}

      {onFirstSlide && prevLesson && currentStep && (
        <div
          className={`present-bridge present-bridge--prev ${
            backCrossModule ? "present-bridge--module" : ""
          }`}
        >
          <button
            type="button"
            className="present-bridge-btn"
            onClick={() => goLesson(prevLesson, "prev")}
          >
            <span className="present-bridge-dir">
              {neighborLabel(currentStep, prevLesson, "prev")}
            </span>
            <span className="present-bridge-title">{prevLesson.item.title}</span>
          </button>
        </div>
      )}

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
            aria-label={backIsLesson ? "Forrige lektion" : "Forrige slide"}
            disabled={!canGoBack}
            onClick={goBack}
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
            aria-label={forwardIsLesson ? "Næste lektion" : "Næste slide"}
            disabled={!canGoForward}
            onClick={goForward}
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
        <button
          type="button"
          className={`btn ghost ${backIsLesson ? "present-nav-lesson" : ""} ${
            backCrossModule ? "present-nav-module" : ""
          }`}
          disabled={!canGoBack}
          onClick={goBack}
        >
          {backIsLesson && prevLesson && currentStep ? (
            <>
              ← {neighborLabel(currentStep, prevLesson, "prev")}
              <span className="present-nav-sub">{prevLesson.item.title}</span>
            </>
          ) : (
            "← Forrige"
          )}
        </button>
        <p className="present-hint muted">
          Piletaster · <kbd>E</kbd> editor · <kbd>F</kbd> fuld skærm · <kbd>Esc</kbd> afslut
        </p>
        <button
          type="button"
          className={`btn primary ${forwardIsLesson ? "present-nav-lesson" : ""} ${
            forwardCrossModule ? "present-nav-module" : ""
          }`}
          disabled={!canGoForward}
          onClick={goForward}
        >
          {forwardIsLesson && nextLesson && currentStep ? (
            <>
              {neighborLabel(currentStep, nextLesson, "next")} →
              <span className="present-nav-sub">{nextLesson.item.title}</span>
            </>
          ) : (
            "Næste →"
          )}
        </button>
      </footer>

      {error && <p className="present-error error-text">{error}</p>}
    </div>
  );
}
