import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchModules,
  fetchProgress,
  type ModuleDto,
  type ProgressRow,
} from "../api";
import { isLoggedIn } from "../auth";

export function Modules() {
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModules()
      .then(setModules)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchProgress()
      .then(setProgress)
      .catch(() => setProgress([]));
  }, []);

  const statusBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of progress) {
      const prev = map.get(row.contentSlug);
      if (row.status === "completed" || !prev) map.set(row.contentSlug, row.status);
    }
    return map;
  }, [progress]);

  const continueTarget = useMemo(() => {
    const sorted = [...modules].sort((a, b) => a.order - b.order);
    for (const mod of sorted) {
      for (const item of [...mod.items].sort((a, b) => a.order - b.order)) {
        if (statusBySlug.get(item.slug) !== "completed") {
          return { module: mod, item };
        }
      }
    }
    return null;
  }, [modules, statusBySlug]);

  if (error) return <p className="error-text">{error}</p>;
  if (!modules.length) return <p className="muted">Henter moduler…</p>;

  return (
    <section className="page">
      <header className="page-head">
        <h1>Moduler</h1>
        <p>Følg pensummet i rækkefølge — når et modul er færdigt, går du videre til næste.</p>
        {continueTarget && (
          <p className="cta-row">
            <Link className="btn primary" to={`/learn/${continueTarget.item.slug}`}>
              Fortsæt: {continueTarget.item.title}
            </Link>
          </p>
        )}
      </header>
      <ol className="module-list">
        {modules.map((m) => {
          const done = m.items.filter(
            (i) => statusBySlug.get(i.slug) === "completed",
          ).length;
          const first = m.items[0];
          return (
            <li key={m.slug} className={m.scaffoldOnly ? "scaffold" : ""}>
              <Link to={first ? `/learn/${first.slug}` : `/modules/${m.slug}`}>
                <span className="ord">{String(m.order).padStart(2, "0")}</span>
                <div>
                  <h2>
                    {m.title}
                    {m.scaffoldOnly && <em> · kommer snart</em>}
                    {m.items.length > 0 && (
                      <em className="module-progress-em">
                        {" "}
                        · {done}/{m.items.length}
                      </em>
                    )}
                  </h2>
                  <p>{m.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
