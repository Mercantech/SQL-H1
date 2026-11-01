import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchModules,
  fetchProgress,
  type ModuleDto,
  type ProgressRow,
} from "../api";
import { isLoggedIn } from "../auth";
import { LearningObjectives } from "../components/LearningObjectives";
import { RaymondNote } from "../components/raymond/Raymond";
import { useRaymond } from "../components/raymond/RaymondContext";

export function Modules() {
  const { openHelp } = useRaymond();
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
      <RaymondNote compact mood={continueTarget ? "help" : "celebration"} title={continueTarget ? "Dit næste skridt" : "Godt arbejde"}>
        <p>
          {continueTarget ? (
            <>Tag <strong>{continueTarget.item.title}</strong> i {continueTarget.module.title} som det næste.
              {continueTarget.item.kind === "theory"
                ? " Læs forklaringen og afprøv et eksempel, før du går videre."
                : " Læs opgaven, afprøv din SQL, og brug opgavens tjek til at vurdere løsningen."}</>
          ) : "Alle lektioner er registreret som fuldført. Genbesøg et emne, eller afprøv din egen idé i Playground."}
        </p>
        <button type="button" className="btn ghost" onClick={openHelp}>Spørg Raymond</button>
      </RaymondNote>
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
                  <LearningObjectives
                    objectives={m.objectives ?? []}
                    compact
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
