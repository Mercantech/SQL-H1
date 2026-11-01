import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchContent, type ContentDto } from "../../api";
import { explainPostgresError, getRaymondTopic } from "../../lib/raymond";
import { RaymondContext, type RaymondWorkContext } from "./RaymondContext";
import { RaymondAvatar } from "./RaymondUI";
export { RaymondAvatar, RaymondNote } from "./RaymondUI";
import { RaymondOnboarding } from "./RaymondOnboarding";
import { RaymondChat } from "./RaymondChat";
import { RaymondExerciseHints } from "./RaymondExercise";
import "./raymond.css";

const welcomeKey = "sqlh1_raymond_welcome_v1";

function readWelcomed() {
  try { return localStorage.getItem(welcomeKey) === "seen"; } catch { return false; }
}

export function RaymondProvider({ children }: { children: ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [welcomed, setWelcomed] = useState(readWelcomed);
  const [workContext, setWorkContextState] = useState<RaymondWorkContext | null>(null);
  const setWorkContext = useCallback((context: RaymondWorkContext | null) => {
    setWorkContextState(context);
  }, []);
  const dismissWelcome = useCallback(() => {
    setWelcomed(true);
    try { localStorage.setItem(welcomeKey, "seen"); } catch { /* Preferences are optional. */ }
  }, []);
  const openHelp = useCallback(() => { setHelpOpen(true); dismissWelcome(); }, [dismissWelcome]);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const openOnboarding = useCallback(() => { setHelpOpen(false); setTourOpen(true); dismissWelcome(); }, [dismissWelcome]);
  const closeTour = useCallback(() => { setTourOpen(false); dismissWelcome(); }, [dismissWelcome]);
  const value = useMemo(() => ({ helpOpen, tourOpen, welcomed, workContext, setWorkContext, openHelp, closeHelp, openOnboarding, closeTour, dismissWelcome }), [helpOpen, tourOpen, welcomed, workContext, setWorkContext, openHelp, closeHelp, openOnboarding, closeTour, dismissWelcome]);
  return <RaymondContext.Provider value={value}>{children}</RaymondContext.Provider>;
}

const faq = [
  { question: "Min SQL kører, men svaret består ikke?", answer: "En vellykket kørsel betyder, at databasen kunne udføre din SQL. Opgavetjekket undersøger derudover kravene. Sammenlign kolonner, aliaser, filtre og sortering med hver del af opgaven. Ved ændringer læser tjekket også databasens sluttilstand." },
  { question: "Hvordan bruger jeg editoren?", answer: "Skriv SQL og vælg Kør SQL. Ctrl+Enter kører den markerede tekst, hvis du har markeret noget, ellers hele editoren. Du kan indsætte teoriens eksempler med knapperne ved koden. Historik viser dine tidligere kørsler." },
  { question: "Hvorfor ændrede data sig fra en anden opgave?", answer: "Du arbejder i din egen elev-database. Dine ændringer bliver liggende, indtil du ændrer dem igen eller vælger at nulstille. Undersøg Database-siden, og kontrollér opgavens forventede udgangspunkt før du nulstiller." },
  { question: "Kan jeg skrive C# i SQL-editoren?", answer: "Editoren kører SQL i Postgres. I ADO.NET- og Dapper-modulerne afprøver du SQL-delen her og skriver C#-delen i dit eget udviklingsmiljø." },
];

export function RaymondCompanion() {
  const state = useContext(RaymondContext);
  const { pathname } = useLocation();
  const [selection, setSelection] = useState<{ path: string; tab: "chat" | "page" | "errors" | "about" }>({ path: pathname, tab: "chat" });
  const tab = selection.path === pathname ? selection.tab : "chat";
  const [errorText, setErrorText] = useState("");
  const [submittedError, setSubmittedError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const panelId = useId();
  const headingId = useId();
  const topic = getRaymondTopic(pathname);
  const explanation = submittedError ? explainPostgresError(submittedError) : null;
  const helpOpen = state?.helpOpen ?? false;
  const closeHelp = state?.closeHelp;
  const guideSlug = /^\/(?:learn|present)\/([^/]+)\/?$/.exec(pathname)?.[1];
  const [guideContent, setGuideContent] = useState<ContentDto | null>(null);

  useEffect(() => {
    if (!helpOpen || tab !== "page" || !guideSlug || guideContent?.slug === guideSlug) return;
    let cancelled = false;
    fetchContent(guideSlug).then((content) => {
      if (!cancelled) setGuideContent(content);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [helpOpen, tab, guideSlug, guideContent?.slug]);

  useEffect(() => {
    if (!helpOpen || !closeHelp) return;
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement ? active : null;
    closeRef.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); closeHelp(); }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
      if (openerRef.current?.isConnected) openerRef.current.focus({ preventScroll: true });
    };
  }, [helpOpen, closeHelp]);

  if (!state || pathname.startsWith("/auth/")) return null;
  const welcomeVisible = !state.welcomed && !state.helpOpen && !state.tourOpen && (pathname === "/" || pathname === "/modules");

  return (
    <>
      {welcomeVisible && (
        <aside className="raymond-welcome" aria-label="Velkommen fra Raymond">
          <RaymondAvatar size={80} mood="help" />
          <div><strong>Ny her? Jeg viser dig rundt.</strong><p>Fra teori til din første SQL-opgave.</p>
            <div className="raymond-inline-actions"><button type="button" className="btn primary" onClick={state.openOnboarding}>Vis mig rundt</button><button type="button" className="btn ghost" onClick={state.dismissWelcome}>Senere</button></div>
          </div>
        </aside>
      )}
      <button type="button" className={`raymond-launcher${helpOpen ? " is-open" : ""}`} onClick={helpOpen ? state.closeHelp : state.openHelp} aria-expanded={helpOpen} aria-controls={panelId} aria-label={helpOpen ? "Luk Raymonds hjælp" : "Åbn Raymonds hjælp"}>
        <RaymondAvatar mood={helpOpen ? "help" : "neutral"} size={50} /><span>Raymond<span className="raymond-launcher-sub">{helpOpen ? "Luk hjælp" : "Spørg om hjælp"}</span></span>
        <span className="raymond-launcher-symbol" aria-hidden="true">{helpOpen ? "×" : "?"}</span>
      </button>
        <aside id={panelId} className={`raymond-panel${tab === "chat" ? " raymond-panel--chat" : ""}`} hidden={!helpOpen} role="dialog" aria-modal="false" aria-labelledby={headingId}>
          <header className="raymond-panel-head"><RaymondAvatar mood="help" size={72} /><div><p>Din SQL-guide</p><h2 id={headingId}>Spørg Raymond</h2></div><button ref={closeRef} type="button" className="raymond-close" onClick={state.closeHelp} aria-label="Luk Raymonds hjælp">×</button></header>
          <div className="raymond-tabs" role="group" aria-label="Vælg hjælp">
            {([ ["chat", "Spørg Raymond"], ["page", "Guide"], ["errors", "SQL-hjælp"], ["about", "Om"] ] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={tab === id ? "active" : ""} onClick={() => setSelection({ path: pathname, tab: id })}>{label}</button>)}
          </div>
          <div className="raymond-panel-content">
            <div className="raymond-chat-slot" hidden={tab !== "chat"}>
              <RaymondChat active={helpOpen && tab === "chat"} />
            </div>
            <div hidden={tab !== "page"}>
              <p className="raymond-eyebrow">Lad os tage det trin for trin</p><h3>{topic.title}</h3><p>{topic.summary}</p>
              <ol className="raymond-steps">{topic.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              {guideContent?.slug === guideSlug && guideContent?.kind === "exercise" && <RaymondExerciseHints content={guideContent} />}
              <div className="raymond-reflection"><strong>Prøv at forklare</strong><p>{topic.question}</p></div>
              <details className="raymond-example"><summary>Se et lille eksempel</summary><pre><code>{topic.example}</code></pre><p>Et eksempel du kan undersøge — sammenlign altid med din opgave.</p></details>
              <a className="raymond-source" href={topic.reference} target="_blank" rel="noreferrer">Læs videre i PostgreSQLs dokumentation ↗</a>
              <div className="raymond-faq"><h3>Ofte stillede spørgsmål</h3>{faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
              <div className="raymond-inline-actions"><Link className="btn" to="/modules" onClick={state.closeHelp}>Find et modul</Link><button type="button" className="btn ghost" onClick={state.openOnboarding}>Vis rundvisning</button></div>
            </div>
            {tab === "errors" && <>
              <h3>Hvad fortæller fejlen?</h3><p>Indsæt Postgres-fejlen fra din kørsel. Jeg forklarer kendte fejlkoder og foreslår, hvad du kan undersøge.</p>
              <form onSubmit={(event) => { event.preventDefault(); setSubmittedError(errorText.trim()); }}>
                <label htmlFor={`${panelId}-error`}>Fejlbesked</label><textarea id={`${panelId}-error`} rows={4} value={errorText} onChange={(event) => setErrorText(event.target.value)} placeholder={'Fx 42703: column "navn" does not exist'} maxLength={4000} required />
                <button type="submit" className="btn primary" disabled={!errorText.trim()}>Forklar fejlen</button>
              </form>
              <p className="raymond-footnote">Forklaringen bygger på faste vejledninger til fejlkoder. Beskeden behandles kun her i din browser.</p>
              {explanation && <div className="raymond-error-explanation" aria-live="polite"><RaymondAvatar mood="thinking" size={90} /><h3>{explanation.title}</h3><p>{explanation.explanation}</p><ol className="raymond-steps">{explanation.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>}
            </>}
            {tab === "about" && <>
              <img className="raymond-about-portrait" src="/raymond/professor.webp" alt="Raymond, den blå elefantprofessor med bog og pegepind" width={224} height={224} loading="lazy" />
              <h3>Raymond Stonebraker Codd</h3><p className="raymond-introduction">Jeg er Professor Codd, men I kan kalde mig Raymond.</p>
              <p>Jeg er din faste guide til SQL-H1. Jeg hjælper med forklaringer, hints og fejlbeskeder, mens du selv bygger forståelsen og løsningen.</p>
              <h3>Tre navne fra databasehistorien</h3>
              <ul className="raymond-tributes"><li><a href="https://www.ibm.com/history/relational-database" target="_blank" rel="noreferrer">Raymond Boyce</a> udviklede SQL sammen med Donald Chamberlin.</li><li><a href="https://www.postgresql.org/docs/16/history.html" target="_blank" rel="noreferrer">Michael Stonebraker</a> ledede det oprindelige POSTGRES-projekt.</li><li><a href="https://doi.org/10.1145/362384.362685" target="_blank" rel="noreferrer">Edgar F. Codd</a> fremlagde den relationelle datamodel i 1970.</li></ul>
              <button type="button" className="btn primary" onClick={state.openOnboarding}>Vis mig rundt på platformen</button>
            </>}
          </div>
        </aside>
      <RaymondOnboarding open={state.tourOpen} onClose={state.closeTour} />
    </>
  );
}
