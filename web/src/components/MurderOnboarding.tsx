import { useEffect, useId, useRef, useState } from "react";
import { STARTER_SQL } from "../lib/murder/seed";

type Props = { open: boolean; onClose: () => void; hasProgress: boolean };
const steps = ["Sagen", "Sådan arbejder du", "Første spor"];

export function MurderOnboarding({ open, onClose, hasProgress }: Props) {
  return open ? <Introduction onClose={onClose} hasProgress={hasProgress} /> : null;
}

function Introduction({ onClose, hasProgress }: Omit<Props, "open">) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const focusEditorOnClose = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const contentId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    headingRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      const target = !focusEditorOnClose.current && opener instanceof HTMLElement && opener !== document.body && opener.isConnected
        ? opener
        : document.querySelector<HTMLElement>(".murder-editor .cm-content");
      target?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    dialogRef.current?.scrollTo({ top: 0 });
    contentRef.current?.scrollTo({ top: 0 });
  }, [step]);

  return (
    <dialog ref={dialogRef} className="murder-onboarding" aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header className="murder-onboarding-header">
        <span className="murder-eyebrow">SAG 014 / Introduktion</span>
        <button className="murder-onboarding-close" type="button" aria-label="Luk introduktionen" onClick={onClose}><span aria-hidden="true">×</span></button>
      </header>
      <ol className="murder-onboarding-progress" aria-label="Introduktionens trin">
        {steps.map((label, index) => <li key={label} className={index === step ? "is-active" : index < step ? "is-done" : ""}><button type="button" aria-current={index === step ? "step" : undefined} aria-controls={contentId} onClick={() => setStep(index)}><span aria-hidden="true">{index < step ? "✓" : `0${index + 1}`}</span>{label}</button></li>)}
      </ol>
      <div ref={contentRef} id={contentId} className="murder-onboarding-content">
        <h2 ref={headingRef} tabIndex={-1} id={titleId}>{step === 0 ? "Mordet på Datatopmødet." : step === 1 ? "Du stiller spørgsmålene." : "Begynd med rapporten."}</h2>
        {step === 0 && <>
          <p id={descriptionId}>Danmarks IT-pionerer er samlet i Viborg. Midt under konferencen bliver databasearkitekten <strong>Viktor Vang</strong> fundet død i Arkivet.</p>
          <p>Du skal finde gerningspersonen og derefter personen bag mordet. Vidnernes forklaringer, adgangskort og andre spor ligger i en database. Dit værktøj er SQL.</p>
          <dl className="murder-onboarding-facts"><div><dt>Hændelse</dt><dd>Mord</dd></div><div><dt>Sted</dt><dd>Viborg</dd></div><div><dt>Dato</dt><dd>14. oktober 2026</dd></div></dl>
          <p className="murder-onboarding-fiction"><strong>En fiktiv kriminalgåde.</strong> De kendte IT-profiler optræder som opdigtede konferencegæster og vidner. Offer, gerningsperson og bagmand er fiktive. Profilernes faglige bidrag er virkelige.</p>
        </>}
        {step === 1 && <>
          <p id={descriptionId}>Undersøg ni sammenhængende tabeller, og lad hvert resultat vise dig det næste spor.</p>
          <ol className="murder-onboarding-steps">
            <li><strong>Skriv og kør SQL.</strong><p><b>Kør SQL</b> eller <kbd>Ctrl</kbd> + <kbd>Enter</kbd> kører din markering eller hele editoren.</p></li>
            <li><strong>Forbind sporene.</strong><p>Brug tabeloversigten til at finde kolonner og relationer. SQL-guiden og gradvise hints hjælper, når du sidder fast.</p></li>
            <li><strong>Notér, og tjek din konklusion.</strong><p>Saml dine spor i notesbogen. Skriv personens fulde navn under <b>Din konklusion</b>, når du er klar.</p></li>
          </ol>
          <p className="murder-onboarding-tip">Du kører ægte SQLite i browseren uden login. Data er skrivebeskyttede. SQL, noter og fremskridt gemmes i denne browser.</p>
        </>}
        {step === 2 && <>
          <p id={descriptionId}>{hasProgress ? "Dit arbejde er bevaret i editoren. Her er den oprindelige startforespørgsel, som henter" : "Din startforespørgsel ligger allerede i editoren. Den henter"} dagens hændelser fra <code>sagsrapporter</code>.</p>
          <pre className="murder-onboarding-sql"><code>{STARTER_SQL}</code></pre>
          <p>Find hændelsen med typen <strong>mord</strong> i <strong>Viborg</strong> den <strong>2026-10-14</strong>. Læs beskrivelsen, find vidnerne, og følg sporene videre.</p>
          <p className="murder-onboarding-tip">Introduktionen kan altid åbnes igen øverst på siden.{hasProgress && " Dit arbejde ligger klar, præcis som du forlod det."}</p>
        </>}
      </div>
      <footer className="murder-onboarding-footer">
        <span className="murder-eyebrow" aria-live="polite">Trin {step + 1} af {steps.length}</span>
        <div>
          {step > 0 && <button className="murder-tool" type="button" onClick={() => setStep((current) => current - 1)}>Tilbage</button>}
          {step < steps.length - 1 ? <button className="murder-run" type="button" onClick={() => setStep((current) => current + 1)}>Næste <span aria-hidden="true">→</span></button> : <button className="murder-run" type="button" onClick={() => { focusEditorOnClose.current = true; onClose(); }}>{hasProgress ? "Fortsæt efterforskningen" : "Start efterforskningen"}<span aria-hidden="true">→</span></button>}
        </div>
      </footer>
    </dialog>
  );
}
