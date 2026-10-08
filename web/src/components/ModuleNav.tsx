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

export function ModuleNav({
  moduleSlug,
  currentSlug,
  mobileOpen,
  onNavigate,
}: Props) {
  const [mod, setMod] = useState<ModuleDto | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);

  useEffect(() => {
    fetchModules().then((list) =>
      setMod(list.find((m) => m.slug === moduleSlug) || null),
    );
  }, [moduleSlug]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setProgress([]);
      return;
    }
    fetchProgress()
      .then(setProgress)
      .catch(() => setProgress([]));
  }, [moduleSlug, currentSlug]);

  const statusBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of progress) {
      const prev = map.get(row.contentSlug);
      if (row.status === "completed" || !prev) map.set(row.contentSlug, row.status);
    }
    return map;
  }, [progress]);

  if (!mod) {
    return (
      <aside className={`module-nav ${mobileOpen ? "open" : ""}`}>
        <p className="muted">Henter indhold…</p>
      </aside>
    );
  }

  const theory = mod.items.filter((i) => i.kind !== "exercise");
  const exercises = mod.items.filter((i) => i.kind === "exercise");
  const currentIndex = mod.items.findIndex((i) => i.slug === currentSlug);
  const doneCount = mod.items.filter(
    (i) => statusBySlug.get(i.slug) === "completed",
  ).length;

  return (
    <aside className={`module-nav ${mobileOpen ? "open" : ""}`}>
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
          aria-valuemax={mod.items.length}
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
          startIndex={theory.length}
        />
      )}

      {currentSlug && currentIndex >= 0 && (
        <p className="module-nav-step muted">
          Trin {currentIndex + 1} af {mod.items.length}
        </p>
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

export function useModuleItems(moduleSlug: string | undefined) {
  const [mod, setMod] = useState<ModuleDto | null>(null);
  useEffect(() => {
    if (!moduleSlug) return;
    fetchModules().then((list) =>
      setMod(list.find((m) => m.slug === moduleSlug) || null),
    );
  }, [moduleSlug]);
  return mod;
}

export function LearnPager({
  moduleSlug,
  currentSlug,
}: {
  moduleSlug: string;
  currentSlug: string;
}) {
  const mod = useModuleItems(moduleSlug);
  if (!mod) return null;
  const idx = mod.items.findIndex((i) => i.slug === currentSlug);
  if (idx < 0) return null;
  const prev = idx > 0 ? mod.items[idx - 1] : null;
  const next = idx < mod.items.length - 1 ? mod.items[idx + 1] : null;

  return (
    <nav className="learn-pager" aria-label="Gå til forrige eller næste">
      {prev ? (
        <Link to={`/learn/${prev.slug}`} className="pager-link prev">
          <span className="pager-dir">Forrige</span>
          <span className="pager-title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link to={`/learn/${next.slug}`} className="pager-link next">
          <span className="pager-dir">Næste</span>
          <span className="pager-title">{next.title}</span>
        </Link>
      ) : (
        <Link to={`/modules/${moduleSlug}`} className="pager-link next">
          <span className="pager-dir">Modul færdigt</span>
          <span className="pager-title">Tilbage til overblik</span>
        </Link>
      )}
    </nav>
  );
}
