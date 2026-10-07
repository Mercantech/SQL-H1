import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchModules, type ModuleDto } from "../api";

export function Modules() {
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModules()
      .then(setModules)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!modules.length) return <p className="muted">Henter moduler…</p>;

  return (
    <section className="page">
      <header className="page-head">
        <h1>Moduler</h1>
        <p>Følg pensummet — start med SELECT og DML.</p>
      </header>
      <ol className="module-list">
        {modules.map((m) => (
          <li key={m.slug} className={m.scaffoldOnly ? "scaffold" : ""}>
            <Link to={`/modules/${m.slug}`}>
              <span className="ord">{String(m.order).padStart(2, "0")}</span>
              <div>
                <h2>
                  {m.title}
                  {m.scaffoldOnly && <em> · kommer snart</em>}
                </h2>
                <p>{m.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
