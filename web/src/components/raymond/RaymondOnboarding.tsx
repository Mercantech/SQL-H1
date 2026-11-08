import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { RaymondAvatar } from "./RaymondUI";
import "./onboarding.css";

type RaymondOnboardingProps = {
  open: boolean;
  onClose: () => void;
};

const steps = ["Velkommen", "Moduler", "Din database", "Hjælp og fremgang"];

/** Mounting a fresh dialog each time also starts a reopened tour at step one. */
export function RaymondOnboarding({ open, onClose }: RaymondOnboardingProps) {
  return open ? <OnboardingDialog onClose={onClose} /> : null;
}

function OnboardingDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const active = document.activeElement;
    // Welcome cards and help-panel buttons can disappear when the tour opens.
    // The persistent launcher is a useful return target in those cases.
    const opener = active instanceof HTMLElement && active !== document.body
      ? active
      : document.querySelector<HTMLButtonElement>(".raymond-launcher");
    // A modal native dialog makes the rest of the page inert and traps focus.
    dialog.showModal();
    headingRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
      const returnTarget = opener?.isConnected
        ? opener
        : document.querySelector<HTMLButtonElement>(".raymond-launcher");
      returnTarget?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    dialogRef.current?.scrollTo({ top: 0 });
  }, [step]);

  return (
    <dialog
      ref={dialogRef}
      className="raymond-onboarding"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="raymond-onboarding-header">
        <p>En kort rundvisning med Raymond</p>
        <button
          type="button"
          className="raymond-onboarding-close"
          aria-label="Luk rundvisning"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <ol className="raymond-onboarding-steps" aria-label="Rundvisningens trin">
        {steps.map((label, index) => (
          <li key={label} aria-current={index === step ? "step" : undefined}>
            <span className="raymond-onboarding-step-number" aria-hidden="true">
              {index + 1}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      <div className="raymond-onboarding-body">
        <div className="raymond-onboarding-portrait" aria-hidden="true">
          {step === 0 ? (
            <img src="/raymond/professor.webp" width="200" height="200" alt="" />
          ) : (
            <RaymondAvatar
              reaction={step === 2 ? "query-ready" : step === 3 ? "thumbs-up" : "reading"}
              size={152}
            />
          )}
        </div>

        <div className="raymond-onboarding-content">
          <p className="raymond-onboarding-counter" aria-live="polite">
            Trin {step + 1} af {steps.length}
          </p>
          <h2 ref={headingRef} tabIndex={-1} id={titleId}>
            {step === 0 && "Godt at møde dig."}
            {step === 1 && "Begynd med et modul"}
            {step === 2 && "Prøv SQL i din egen database"}
            {step === 3 && "Brug hjælp, og følg din fremgang"}
          </h2>

          {step === 0 && (
            <>
              <p id={descriptionId} className="raymond-onboarding-welcome">
                Jeg er Professor Codd, men I kan kalde mig Raymond.
              </p>
              <p>
                Mit fulde navn er Raymond Stonebraker Codd. Jeg følger dig
                gennem SQL-H1 med forklaringer og hjælp, når du øver. Lad os
                finde teorien, editoren og dit næste skridt.
              </p>
              <p className="raymond-onboarding-aside">
                Du kan læse teorien uden login. Log ind, når du vil arbejde i din
                egen database.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <p id={descriptionId}>
                Under <strong>Moduler</strong> finder du teori og opgaver i
                rækkefølge. Læs en forklaring, undersøg SQL-eksemplet, og prøv
                derefter selv.
              </p>
              <ul className="raymond-onboarding-points">
                <li>Teorien giver dig begreberne og eksemplerne.</li>
                <li>Opgaverne lader dig afprøve det, du har lært.</li>
                <li>Du kan altid gå tilbage til en tidligere forklaring.</li>
              </ul>
              <Link className="raymond-onboarding-link" to="/modules" onClick={onClose}>
                Se moduloversigten <span aria-hidden="true">→</span>
              </Link>
            </>
          )}

          {step === 2 && (
            <>
              <p id={descriptionId}>
                Når du logger ind, får du adgang til din egen Postgres-database.
                Brug SQL-editoren ved en opgave, eller åbn Playground og
                eksperimentér.
              </p>
              <div className="raymond-onboarding-code">
                <span>Et lille første eksperiment</span>
                <pre><code>SELECT 1 AS mit_foerste_resultat;</code></pre>
              </div>
              <p>
                Skriv din SQL, vælg <strong>Kør SQL</strong>, og læs resultatet.
                På <strong>Database</strong> kan du undersøge tabeller, kolonner
                og indhold.
              </p>
              <Link className="raymond-onboarding-link" to="/playground" onClick={onClose}>
                Se Playground <span aria-hidden="true">→</span>
              </Link>
            </>
          )}

          {step === 3 && (
            <>
              <p id={descriptionId}>
                Åbn Raymond, når du har brug for et hint eller en forklaring.
                Vælg <strong>Tjek svar</strong> i en opgave, når du vil kontrollere
                din løsning.
              </p>
              <p>
                Et svar, der ikke består endnu, er et sted at arbejde videre fra.
                Læs tilbagemeldingen, ret én ting, og prøv igen.
              </p>
              <p className="raymond-onboarding-aside">
                Når du er logget ind, kan du følge din fremgang under
                <strong> Progress</strong>. Rundvisningen kan åbnes igen hos
                Raymond.
              </p>
            </>
          )}
        </div>
      </div>

      <footer className="raymond-onboarding-footer">
        <button type="button" className="raymond-onboarding-skip" onClick={onClose}>
          {step === steps.length - 1 ? "Luk rundvisning" : "Spring over"}
        </button>
        <div className="raymond-onboarding-actions">
          {step > 0 && (
            <button type="button" className="btn" onClick={() => setStep(step - 1)}>
              Tilbage
            </button>
          )}
          {step < steps.length - 1 ? (
            <button type="button" className="btn primary" onClick={() => setStep(step + 1)}>
              {step === 0 ? "Lad os begynde" : "Næste"}
              <span aria-hidden="true"> →</span>
            </button>
          ) : (
            <Link className="btn primary" to="/modules" onClick={onClose}>
              Find første modul <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </footer>
    </dialog>
  );
}
