import { useId } from "react";
import type { ExecuteResult, ExerciseAnswerPart, ExerciseCheckResult } from "../api";
import { SqlResultTable } from "./SqlResultTable";

export type QueryPreview = { partId: string; sql: string; result?: ExecuteResult; error?: string };

type Props = {
  parts: ExerciseAnswerPart[];
  drafts: Record<string, string>;
  onChange: (partId: string, value: string) => void;
  onCheck: () => void;
  onRun: (partId: string, value: string) => void;
  preview: QueryPreview | null;
  onLogin?: () => void;
  busy: boolean;
  result: ExerciseCheckResult | null;
};

export function ExerciseAnswers({ parts, drafts, onChange, onCheck, onRun, onLogin, preview, busy, result }: Props) {
  const fieldPrefix = useId();
  const otherChecks = result?.parts?.filter((check) => !parts.some((part) => part.id === check.id));
  return (
    <section id="svarfelter" className="exercise-answers" aria-labelledby="answer-title">
      <h2 id="answer-title">Dine SQL-svar</h2>
      {onLogin ? (
        <button type="button" className="btn primary" onClick={onLogin}>Log ind for at besvare opgaven</button>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); onCheck(); }}>
          <p>Skriv én forespørgsel til hver del. Kør den for at se rækkerne. Vælg Tjek svar, når du vil tjekke hele opgaven.</p>
          {parts.map((part) => {
            const fieldId = fieldPrefix + part.id;
            const feedback = result?.parts?.find((check) => check.id === part.id);
            const value = drafts[part.id] ?? part.starterSql ?? "";
            const current = preview?.partId === part.id && preview.sql === value.trim() ? preview : null;
            const error = current?.error || current?.result?.error;
            return (
              <div className="exercise-answer" key={part.id}>
                <label htmlFor={fieldId}>{part.label}</label>
                <textarea
                  id={fieldId} value={value} rows={3}
                  readOnly={busy} spellCheck={false} autoCapitalize="off" autoCorrect="off"
                  aria-describedby={feedback ? fieldId + "-feedback" : undefined}
                  aria-invalid={feedback ? !feedback.passed : undefined}
                  onChange={(event) => onChange(part.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      if (!busy && value.trim()) onRun(part.id, value);
                    }
                  }}
                />
                <button type="button" className="btn" aria-label={`Kør SQL for ${part.label}`}
                  disabled={busy || !value.trim()} onClick={() => onRun(part.id, value)}>Kør SQL</button>
                {current && <div className="answer-preview">
                  <p role="status" className={error ? "error-text" : "muted"}>{error || (current.result
                    ? `${current.result.rows.length} ${current.result.rows.length === 1 ? "række" : "rækker"} i resultatet.`
                    : "Kører forespørgslen…")}</p>
                  {current.result?.ok && <SqlResultTable set={current.result} />}
                </div>}
                {feedback && <p id={fieldId + "-feedback"} className={feedback.passed ? "answer-pass" : "answer-retry"}>
                  <strong>{feedback.passed ? "Bestået." : "Prøv igen."}</strong> {feedback.message}
                </p>}
              </div>
            );
          })}
          <button type="submit" className="btn primary" disabled={busy}>Tjek svar</button>
          <div role="status">
            {result && <p><strong>{result.passed ? "Opgaven er bestået." : "Opgaven er ikke bestået endnu."}</strong></p>}
            {otherChecks && otherChecks.length > 0 && <ul>{otherChecks.map((check) =>
              <li key={check.id}>{check.passed ? "Bestået" : "Prøv igen"} · {check.message}</li>)}</ul>}
            {result && !result.parts?.length && <ul>{result.messages.map((message, i) => <li key={i}>{message}</li>)}</ul>}
          </div>
        </form>
      )}
    </section>
  );
}
