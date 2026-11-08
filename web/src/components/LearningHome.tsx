import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMe, fetchModules, fetchProgress, type ModuleDto, type ProgressRow } from "../api";
import { contentKindLabel, progressLabel } from "../lib/course";
import { buildLearningHome } from "../lib/learningHome";
import { getModuleReaction } from "../lib/moduleReactions";
import { useRaymond } from "./raymond/RaymondContext";
import { RaymondAvatar } from "./raymond/RaymondUI";
import "./learning-home.css";

type LoadState = "loading" | "ready" | "error";

function moduleSummary(module: ModuleDto) {
  const lessons = module.items.filter((item) => item.kind === "theory").length;
  const exercises = module.items.filter((item) => item.kind === "exercise").length;
  const projects = module.items.filter((item) => item.kind === "project").length;
  return [
    `${lessons} ${lessons === 1 ? "lektion" : "lektioner"}`,
    exercises ? `${exercises} ${exercises === 1 ? "SQL-opgave" : "SQL-opgaver"}` : null,
    projects ? `${projects} ${projects === 1 ? "projekt" : "projekter"}` : null,
  ].filter(Boolean).join(" · ");
}

export function LearningHome({ name }: { name: string | null }) {
  const { openHelp } = useRaymond();
  const [displayName, setDisplayName] = useState(name);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [moduleState, setModuleState] = useState<LoadState>("loading");
  const [progressState, setProgressState] = useState<LoadState>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      fetchModules().then((items) => {
        if (!cancelled) { setModules(items); setModuleState("ready"); }
      }).catch(() => { if (!cancelled) setModuleState("error"); }),
      fetchProgress().then((rows) => {
        if (!cancelled) { setProgress(rows); setProgressState("ready"); }
      }).catch(() => { if (!cancelled) setProgressState("error"); }),
      fetchMe().then((me) => {
        if (!cancelled && me.displayName?.trim()) setDisplayName(me.displayName);
      }),
    ]);
    return () => { cancelled = true; };
  }, [attempt]);

  const model = buildLearningHome(modules, progress);
  const ready = moduleState === "ready" && progressState === "ready";
  const failed = moduleState === "error" || progressState === "error";
  const firstName = displayName?.trim().split(/\s+/)[0];
  const greeting = !ready ? "Godt at se dig" : model.returning ? "Velkommen tilbage" : "Velkommen";
  const resume = ready ? model.resume : null;

  function retry() {
    setModuleState("loading");
    setProgressState("loading");
    setAttempt((current) => current + 1);
  }

  return (
    <div className="learning-home">
      <header className="learning-home-welcome">
        <div>
          <p className="eyebrow">Dit læringsrum · SQL</p>
          <h1>{greeting}{firstName ? `, ${firstName}` : ""}.</h1>
          <p className="learning-home-greeting">{ready && !model.returning
            ? "Vi starter stille og roligt. Åbn den første lektion, og prøv én forespørgsel ad gangen."
            : "Tag tråden op, hvor du slap, eller vælg et emne, du vil øve. Vi tager det ét skridt ad gangen."}</p>
          <p className="learning-home-raymond"><strong>Raymond:</strong> Jeg er her, hvis noget driller.</p>
          <button type="button" className="learning-home-help" onClick={openHelp}>Spørg Raymond <span aria-hidden="true">→</span></button>
        </div>
        <img src="/raymond/reactions/wave.webp" alt="Raymond byder dig varmt velkommen med et smil og en vinkende hånd" width={512} height={512} fetchPriority="high" />
      </header>

      <div className="learning-home-workspace">
        <section className="learning-home-resume" aria-labelledby="learning-resume-title">
          <p className="eyebrow">{ready && !model.returning ? "Dit første skridt" : model.resumeReason === "review" ? "Tid til at øve videre" : "Fortsæt hvor du slap"}</p>
          {failed ? (
            <>
              <h2 id="learning-resume-title">Du kan stadig finde dit næste emne.</h2>
              <p role="status">{progressState === "error" ? "Din fremgang kunne ikke hentes lige nu." : "Moduloversigten kunne ikke hentes lige nu."} Åbn modulerne, eller prøv igen.</p>
              <div className="learning-home-actions"><Link className="btn primary" to="/modules">Åbn moduler</Link><button type="button" className="btn" onClick={retry}>Prøv igen</button></div>
            </>
          ) : !ready ? (
            <>
              <h2 id="learning-resume-title">Vi finder dit næste trin.</h2>
              <p role="status">Henter dine moduler og din fremgang…</p>
            </>
          ) : resume ? (
            <>
              <div className="learning-home-module-label"><RaymondAvatar reaction={getModuleReaction(resume.moduleSlug)} size={44} /><span>{resume.moduleTitle} · {contentKindLabel(resume.item.kind)}</span></div>
              <h2 id="learning-resume-title">{resume.item.title}</h2>
              <p>{model.resumeReason === "new" ? "Begynd med forklaringen, og afprøv det første eksempel."
                : model.resumeReason === "started" ? "Her var du i gang. Find dit arbejde frem, og byg videre i dit eget tempo."
                : model.resumeReason === "review" ? "Alle trin er registreret. Genbesøg et emne, du vil forstå bedre, eller prøv din egen idé i Playground."
                : "Her er det næste trin efter dit seneste arbejde."}</p>
              <Link className="btn primary" to={`/learn/${resume.item.slug}`}>{model.resumeReason === "new" ? "Start din første lektion" : model.resumeReason === "review" ? "Genbesøg emnet" : "Fortsæt læring"} <span aria-hidden="true">→</span></Link>
            </>
          ) : (
            <><h2 id="learning-resume-title">Vælg, hvad du vil arbejde med.</h2><p>Du finder teori og opgaver i moduloversigten.</p><Link className="btn primary" to="/modules">Åbn moduler</Link></>
          )}
        </section>

        <nav className="learning-home-tools" aria-labelledby="learning-tools-title">
          <h2 id="learning-tools-title">Dine arbejdsrum</h2>
          <Link to="/modules"><RaymondAvatar reaction="reading" size={42} /><span><strong>Moduler</strong><small>Teori, SQL-opgaver og projekter</small></span><span aria-hidden="true">→</span></Link>
          <Link to="/playground"><RaymondAvatar reaction="query-ready" size={42} /><span><strong>Playground</strong><small>Prøv din egen SQL</small></span><span aria-hidden="true">→</span></Link>
          <Link to="/database"><RaymondAvatar reaction="foreign-key" size={42} /><span><strong>Din database</strong><small>Se tabeller og relationer</small></span><span aria-hidden="true">→</span></Link>
          <Link to="/progress"><RaymondAvatar reaction="proud" size={42} /><span><strong>Din fremgang</strong><small>Find tilbage til dit arbejde</small></span><span aria-hidden="true">→</span></Link>
        </nav>
      </div>

      {ready && model.recent.length > 0 && (
        <section className="learning-home-recent" aria-labelledby="learning-recent-title">
          <div className="learning-home-section-head"><h2 id="learning-recent-title">Dine seneste trin</h2><Link to="/progress">Se din fremgang <span aria-hidden="true">→</span></Link></div>
          <ul>{model.recent.slice(0, 3).map(({ step, status }) => (
            <li key={step.item.slug}><Link to={`/learn/${step.item.slug}`}><RaymondAvatar reaction={getModuleReaction(step.moduleSlug)} size={36} /><span><strong>{step.item.title}</strong><small>{step.moduleTitle}</small></span><span className="learning-home-status">{progressLabel(step.item.kind, status)}</span></Link></li>
          ))}</ul>
        </section>
      )}

      {moduleState === "ready" && modules.length > 0 && (
        <section aria-labelledby="learning-subjects-title">
          <div className="learning-home-section-head"><h2 id="learning-subjects-title">Find et emne</h2><Link to="/modules">Se hele forløbet <span aria-hidden="true">→</span></Link></div>
          <ul className="learning-home-subjects">{[...modules].sort((a, b) => a.order - b.order).map((module) => (
            <li key={module.slug}><Link to={`/modules/${module.slug}`}><RaymondAvatar reaction={getModuleReaction(module.slug)} size={42} /><span><strong>{module.title}</strong><small>{moduleSummary(module)}</small></span></Link></li>
          ))}</ul>
        </section>
      )}
    </div>
  );
}
