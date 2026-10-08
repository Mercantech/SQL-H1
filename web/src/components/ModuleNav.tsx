import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  fetchMe,
  fetchModules,
  fetchProgress,
  type ModuleDto,
  type ProgressRow,
} from "../api";
import { isLoggedIn } from "../auth";
import postgresLogo from "../assets/postgresql.svg";

type Props = {
  moduleSlug: string;
  currentSlug?: string;
  /** Om sidemenuen er synlig (desktop + mobil). */
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onToggle?: () => void;
};

type FlatStep = {
  moduleSlug: string;
  moduleTitle: string;
  moduleOrder: number;
  item: ModuleDto["items"][number];
};

function buildFlatPath(modules: ModuleDto[]): FlatStep[] {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const steps: FlatStep[] = [];
  for (const mod of sorted) {
    const items = [...mod.items].sort((a, b) => a.order - b.order);
    for (const item of items) {
      steps.push({
        moduleSlug: mod.slug,
        moduleTitle: mod.title,
        moduleOrder: mod.order,
        item,
      });
    }
  }
  return steps;
}

function progressMap(rows: ProgressRow[]) {
  const map = new Map<string, string>();
  for (const row of rows) {
    const prev = map.get(row.contentSlug);
    if (row.status === "completed" || !prev) map.set(row.contentSlug, row.status);
  }
  return map;
}

function moduleDoneCount(mod: ModuleDto, statusBySlug: Map<string, string>) {
  return mod.items.filter((i) => statusBySlug.get(i.slug) === "completed").length;
}

export function ModuleNav({
  moduleSlug,
  currentSlug,
  mobileOpen,
  onNavigate,
  onToggle,
}: Props) {
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [dbName, setDbName] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<"idle" | "loading" | "ready" | "guest">("idle");

  useEffect(() => {
    fetchModules().then(setModules).catch(() => setModules([]));
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      setProgress([]);
      setDbName(null);
      setDbStatus("guest");
      return;
    }
    setDbStatus("loading");
    fetchProgress()
      .then(setProgress)
      .catch(() => setProgress([]));
    fetchMe()
      .then((me) => {
        if (me.sandbox.status === "ready" && me.sandbox.dbName) {
          setDbName(me.sandbox.dbName);
          setDbStatus("ready");
        } else {
          setDbName(null);
          setDbStatus("idle");
        }
      })
      .catch(() => {
        setDbName(null);
        setDbStatus("idle");
      });
  }, [moduleSlug, currentSlug]);

  const statusBySlug = useMemo(() => progressMap(progress), [progress]);
  const mod = modules.find((m) => m.slug === moduleSlug) || null;
  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.order - b.order),
    [modules],
  );
  const nextModule = useMemo(() => {
    const idx = sortedModules.findIndex((m) => m.slug === moduleSlug);
    if (idx < 0) return null;
    return sortedModules.slice(idx + 1).find((m) => m.items.length > 0) || null;
  }, [sortedModules, moduleSlug]);

  const foldButton = onToggle ? (
    <button
      type="button"
      className="module-nav-fold"
      onClick={onToggle}
      aria-expanded={Boolean(mobileOpen)}
      aria-controls="module-nav"
      title={mobileOpen ? "Skjul oversigt" : "Vis oversigt"}
      aria-label={mobileOpen ? "Skjul oversigt" : "Vis oversigt"}
    >
      <span aria-hidden="true">{mobileOpen ? "‹" : "›"}</span>
    </button>
  ) : null;

  const connected = dbStatus === "ready" && Boolean(dbName);

  const dbFooter = (
    <div className="module-nav-db" title={dbName || undefined}>
      <span
        className={`module-nav-db-diode ${connected ? "on" : "off"}`}
        role="status"
        aria-label={connected ? "Forbundet til database" : "Ingen databaseforbindelse"}
      />
      <img
        src={postgresLogo}
        alt=""
        width={22}
        height={22}
        className="module-nav-db-logo"
        aria-hidden="true"
      />
      <div className="module-nav-db-text">
        <span className="module-nav-db-label">PostgreSQL</span>
        <span className="module-nav-db-name">
          {dbStatus === "guest"
            ? "Ikke logget ind"
            : dbStatus === "loading"
              ? "Henter…"
              : connected
                ? dbName
                : "Ikke forbundet"}
        </span>
      </div>
    </div>
  );

  if (!mod) {
    return (
      <div className={`module-nav-dock ${mobileOpen ? "open" : "closed"}`}>
        <aside id="module-nav" className={`module-nav ${mobileOpen ? "open" : ""}`}>
          <div className="module-nav-scroll">
            <p className="muted">Henter indhold…</p>
          </div>
          {dbFooter}
        </aside>
        {foldButton}
      </div>
    );
  }

  const theory = mod.items.filter((i) => i.kind !== "exercise");
  const exercises = mod.items.filter((i) => i.kind === "exercise");
  const currentIndex = mod.items.findIndex((i) => i.slug === currentSlug);
  const doneCount = moduleDoneCount(mod, statusBySlug);
  const onLastItem =
    currentIndex >= 0 && currentIndex === mod.items.length - 1;

  return (
    <div className={`module-nav-dock ${mobileOpen ? "open" : "closed"}`}>
      <aside id="module-nav" className={`module-nav ${mobileOpen ? "open" : ""}`}>
        <div className="module-nav-scroll">
          <div className="module-nav-head">
            <Link to="/modules" className="module-nav-back" onClick={onNavigate}>
              Alle moduler
            </Link>
            <h2>
              <Link to={`/modules/${mod.slug}`} onClick={onNavigate}>
                {mod.title}
              </Link>
            </h2>
            <p className="module-nav-progress">
              {doneCount}/{mod.items.length} gennemført
            </p>
            <div
              className="module-nav-bar"
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={mod.items.length || 1}
            >
              <span
                style={{
                  width: `${mod.items.length ? (doneCount / mod.items.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {theory.length > 0 && (
            <NavSection
              label="Teori"
              items={theory}
              currentSlug={currentSlug}
              statusBySlug={statusBySlug}
              onNavigate={onNavigate}
            />
          )}
          {exercises.length > 0 && (
            <NavSection
              label="Opgaver"
              items={exercises}
              currentSlug={currentSlug}
              statusBySlug={statusBySlug}
              onNavigate={onNavigate}
            />
          )}

          {currentSlug && currentIndex >= 0 && (
            <p className="module-nav-step muted">
              Trin {currentIndex + 1} af {mod.items.length}
            </p>
          )}

          {onLastItem && nextModule && (
            <Link
              to={
                nextModule.items[0]
                  ? `/learn/${nextModule.items[0].slug}`
                  : `/modules/${nextModule.slug}`
              }
              className="module-nav-next-module"
              onClick={onNavigate}
            >
              Næste modul: {nextModule.title}
            </Link>
          )}
        </div>
        {dbFooter}
      </aside>
      {foldButton}
    </div>
  );
}

function NavSection({
  label,
  items,
  currentSlug,
  statusBySlug,
  onNavigate,
}: {
  label: string;
  items: ModuleDto["items"];
  currentSlug?: string;
  statusBySlug: Map<string, string>;
  onNavigate?: () => void;
  startIndex?: number;
}) {
  return (
    <div className="module-nav-section">
      <p className="module-nav-label">{label}</p>
      <ol className="module-nav-list">
        {items.map((item) => {
          const status = statusBySlug.get(item.slug);
          const active = item.slug === currentSlug;
          return (
            <li key={item.slug}>
              <NavLink
                to={`/learn/${item.slug}`}
                className={({ isActive }) =>
                  [
                    "module-nav-link",
                    isActive || active ? "active" : "",
                    status === "completed" ? "done" : "",
                    status === "started" ? "started" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                onClick={onNavigate}
              >
                <span className="module-nav-title">{item.title}</span>
                <span className="module-nav-status" aria-hidden="true">
                  {status === "completed" ? "✓" : status === "started" ? "·" : ""}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function LearnPager({
  currentSlug,
}: {
  moduleSlug?: string;
  currentSlug: string;
}) {
  const [modules, setModules] = useState<ModuleDto[]>([]);

  useEffect(() => {
    fetchModules().then(setModules).catch(() => setModules([]));
  }, []);

  const flat = useMemo(() => buildFlatPath(modules), [modules]);
  const idx = flat.findIndex((s) => s.item.slug === currentSlug);
  if (idx < 0 || flat.length === 0) return null;

  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  const current = flat[idx];
  const crossingForward = next && next.moduleSlug !== current.moduleSlug;
  const crossingBack = prev && prev.moduleSlug !== current.moduleSlug;

  return (
    <nav className="learn-pager" aria-label="Gå til forrige eller næste">
      {prev ? (
        <Link to={`/learn/${prev.item.slug}`} className="pager-link prev">
          <span className="pager-dir">
            {crossingBack ? `Forrige · ${prev.moduleTitle}` : "Forrige"}
          </span>
          <span className="pager-title">{prev.item.title}</span>
        </Link>
      ) : (
        <Link to="/modules" className="pager-link prev">
          <span className="pager-dir">Start</span>
          <span className="pager-title">Alle moduler</span>
        </Link>
      )}
      {next ? (
        <Link to={`/learn/${next.item.slug}`} className="pager-link next">
          <span className="pager-dir">
            {crossingForward ? `Næste modul · ${next.moduleTitle}` : "Næste"}
          </span>
          <span className="pager-title">{next.item.title}</span>
        </Link>
      ) : (
        <Link to="/modules" className="pager-link next">
          <span className="pager-dir">Pensum færdigt</span>
          <span className="pager-title">Tilbage til overblik</span>
        </Link>
      )}
    </nav>
  );
}
