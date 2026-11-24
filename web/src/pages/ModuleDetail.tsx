import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchModules, type ModuleDto } from "../api";
import { LearningObjectives } from "../components/LearningObjectives";
import { CourseMission } from "../components/CourseMission";
import { contentKindLabel, courseMissions } from "../lib/course";
import { ModuleNav } from "../components/ModuleNav";
import { Markdown } from "../components/Markdown";
import { useModuleNavOpen } from "../hooks/useModuleNavOpen";
import { RaymondAvatar } from "../components/raymond/RaymondUI";
import { getModuleReaction } from "../lib/moduleReactions";
import "../components/raymond/learning-reactions.css";

export function ModuleDetail() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const referenceRef = useRef<HTMLElement>(null);
  const [mod, setMod] = useState<ModuleDto | null>(null);
  const [failure, setFailure] = useState<{ slug?: string; message: string } | null>(null);
  const [navOpen, setNavOpen] = useModuleNavOpen();

  useEffect(() => {
    let active = true;
    fetchModules().then((list) => {
      if (!active) return;
      const found = list.find((m) => m.slug === slug);
      setMod(found ?? null);
      setFailure(found ? null : { slug, message: "Modulet blev ikke fundet." });
    }).catch(() => { if (active) setFailure({ slug, message: "Modulet kunne ikke hentes." }); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (hash === "#opslag" && mod?.slug === slug) {
      referenceRef.current?.scrollIntoView({ block: "start" });
      referenceRef.current?.focus({ preventScroll: true });
    }
  }, [hash, mod, slug]);

  if (failure && failure.slug === slug) return <p className="error-text">{failure.message} <Link to="/modules">Se moduler</Link></p>;
  if (!mod || mod.slug !== slug) return <p className="muted learn-loading">Henter modul…</p>;

  const first = mod.items[0];

  return (
    <div className={`learn-shell module-detail ${navOpen ? "nav-open" : "nav-closed"}`}>
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
            <div className="module-reaction-heading">
              {!courseMissions[mod.slug] && <RaymondAvatar reaction={getModuleReaction(mod.slug)} size={88} />}
              <div>
                <h1>{mod.title}</h1>
                <p>{mod.description}</p>
              </div>
            </div>
            <CourseMission moduleSlug={mod.slug} goals={mod.goalNumbers} />
            <LearningObjectives objectives={mod.objectives ?? []} />
            {first && (
              <p className="cta-row">
                <Link className="btn primary" to={`/learn/${first.slug}`}>
                  Start her
                </Link>
                {mod.slug === "joins-subqueries" && (
                  <a className="btn" href="/forloeb/joins/index.html">
                    Læringsplan med Raymond
                  </a>
                )}
                {mod.referenceMarkdown && <a className="btn" href="#opslag">Opslagsark</a>}
              </p>
            )}

            <ul className="item-list">
              {mod.items.map((item) => (
                <li key={item.slug}>
                  <Link to={`/learn/${item.slug}`}>
                    <span className="pill">
                      {contentKindLabel(item.kind)}
                    </span>
                    {item.title}
                  </Link>
                </li>
              ))}
              {mod.items.length === 0 && (
                <li className="muted">Ingen lektioner endnu.</li>
              )}
            </ul>
            {mod.referenceMarkdown && (
              <section id="opslag" ref={referenceRef} tabIndex={-1} className="module-reference" aria-labelledby="reference-title">
                <header className="reference-head">
                  <h2 id="reference-title">Opslagsark <span>· {mod.title}</span></h2>
                  <button type="button" className="btn" onClick={() => window.print()}>Udskriv arket</button>
                </header>
                <div className="md"><Markdown>{mod.referenceMarkdown}</Markdown></div>
              </section>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
