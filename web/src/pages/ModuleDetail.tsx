import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchModules, type ModuleDto } from "../api";
import { LearningObjectives } from "../components/LearningObjectives";
import { ModuleNav } from "../components/ModuleNav";
import { useModuleNavOpen } from "../hooks/useModuleNavOpen";
import { RaymondNote } from "../components/raymond/Raymond";
import { useRaymond } from "../components/raymond/RaymondContext";
import { getRaymondTopic } from "../lib/raymond";

export function ModuleDetail() {
  const { openHelp } = useRaymond();
  const { slug } = useParams();
  const [mod, setMod] = useState<ModuleDto | null>(null);
  const [navOpen, setNavOpen] = useModuleNavOpen();

  useEffect(() => {
    fetchModules().then((list) => setMod(list.find((m) => m.slug === slug) || null));
  }, [slug]);

  if (!mod) return <p className="muted learn-loading">Henter modul…</p>;

  const first = mod.items[0];
  const topic = getRaymondTopic(mod.slug);

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
        moduleSlug={mod.slug}
        mobileOpen={navOpen}
        onNavigate={() => {
          if (window.matchMedia("(max-width: 900px)").matches) setNavOpen(false);
        }}
        onToggle={() => setNavOpen((v) => !v)}
      />

      <div className="learn-body">
        <div className="learn-main">
          <section className="page-head lesson">
            <p className="eyebrow">
              <Link to="/modules">Moduler</Link> / {mod.title}
            </p>
            <h1>{mod.title}</h1>
            <p>{mod.description}</p>
            <LearningObjectives objectives={mod.objectives ?? []} />
            <RaymondNote compact mood="help" title={topic.title}>
              <p>{topic.summary}</p>
              <button type="button" className="btn ghost" onClick={openHelp}>Spørg Raymond om emnet</button>
            </RaymondNote>
            {first && (
              <p className="cta-row">
                <Link className="btn primary" to={`/learn/${first.slug}`}>
                  Start her
                </Link>
              </p>
            )}

            <ul className="item-list">
              {mod.items.map((item) => (
                <li key={item.slug}>
                  <Link to={`/learn/${item.slug}`}>
                    <span className="pill">
                      {item.kind === "exercise" ? "Opgave" : "Teori"}
                    </span>
                    {item.title}
                  </Link>
                </li>
              ))}
              {mod.items.length === 0 && (
                <li className="muted">Ingen lektioner endnu.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
