import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  fetchModules,
  fetchProgress,
  type ModuleDto,
  type ProgressRow,
} from "../api";
import { isLoggedIn } from "../auth";

type Props = {
  moduleSlug: string;
  currentSlug?: string;
  mobileOpen?: boolean;
  onNavigate?: () => void;
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
}: Props) {
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);

  useEffect(() => {
    fetchModules().then(setModules).catch(() => setModules([]));
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      setProgress([]);
      return;
    }
    fetchProgress()
      .then(setProgress)
      .catch(() => setProgress([]));
  }, [moduleSlug, currentSlug]);

  const statusBySlug = useMemo(() => progressMap(progress), [progress]);
  const mod = modules.find((m) => m.slug === moduleSlug) || null;
  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.order - b.order),
    [modules],
  );
  const flat = useMemo(() => buildFlatPath(modules), [modules]);
  const flatIndex = flat.findIndex((s) => s.item.slug === currentSlug);
  const nextModule = useMemo(() => {
    const idx = sortedModules.findIndex((m) => m.slug === moduleSlug);
    if (idx < 0) return null;
    return sortedModules.slice(idx + 1).find((m) => m.items.length > 0) || null;
  }, [sortedModules, moduleSlug]);

  if (!mod) {
    return (
      <aside className={`module-nav ${mobileOpen ? "open" : ""}`}>
        <p className="muted">Henter indhold…</p>
      </aside>
    );
  }

  const theory = mod.items.filter((i) => i.kind !== "exercise");
  const exercises = mod.items.filter((i) => i.kind === "exercise");
  const doneCount = moduleDoneCount(mod, statusBySlug);
  const curriculumDone = flat.filter(
    (s) => statusBySlug.get(s.item.slug) === "completed",
  ).length;

  return (
    <aside className={`module-nav ${mobileOpen ? "open" : ""}`}>
      <div className="module-nav-head">
        <Link to="/modules" className="module-nav-back" onClick={onNavigate}>
          Pensum-overblik
        </Link>
        <h2>
          <Link to={`/modules/${mod.slug}`} onClick={onNavigate}>
            {mod.title}
          </Link>
        </h2>
        <p className="module-nav-progress">
          Modul: {doneCount}/{mod.items.length} · Pensum: {curriculumDone}/
          {flat.length}
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

      <div className="module-nav-section">
        <p className="module-nav-label">Alle moduler</p>
        <ol className="module-nav-list curriculum-list">
          {sortedModules.map((m) => {
            const done = moduleDoneCount(m, statusBySlug);
            const active = m.slug === moduleSlug;
            const first = m.items[0];
            const target = first
              ? `/learn/${first.slug}`
              : `/modules/${m.slug}`;
            return (
              <li key={m.slug}>
                <Link
                  to={target}
                  className={[
                    "module-nav-link curriculum-link",
                    active ? "active" : "",
                    done === m.items.length && m.items.length > 0 ? "done" : "",
                    m.scaffoldOnly ? "scaffold" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={onNavigate}
                >
                  <span className="module-nav-index">
                    {String(m.order).padStart(2, "0")}
                  </span>
                  <span className="module-nav-title">
                    {m.title}
                    {m.scaffoldOnly ? " · snart" : ""}
                  </span>
                  <span className="module-nav-status">
                    {m.items.length
                      ? `${done}/${m.items.length}`
                      : "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {theory.length > 0 && (
        <NavSection
          label="I dette modul · Teori"
          items={theory}
          currentSlug={currentSlug}
          statusBySlug={statusBySlug}
          onNavigate={onNavigate}
        />
      )}
      {exercises.length > 0 && (
        <NavSection
          label="I dette modul · Opgaver"
          items={exercises}
          currentSlug={currentSlug}
          statusBySlug={statusBySlug}
          onNavigate={onNavigate}
          startIndex={theory.length}
        />
      )}

      {currentSlug && flatIndex >= 0 && (
        <p className="module-nav-step muted">
          Pensumtrin {flatIndex + 1} af {flat.length}
        </p>
      )}

      {nextModule && (
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
    </aside>
  );
}

function NavSection({
  label,
  items,
  currentSlug,
  statusBySlug,
  onNavigate,
  startIndex = 0,
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
        {items.map((item, i) => {
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
                <span className="module-nav-index">{startIndex + i + 1}</span>
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
  const crossingForward =
    next && next.moduleSlug !== current.moduleSlug;
  const crossingBack =
    prev && prev.moduleSlug !== current.moduleSlug;

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
