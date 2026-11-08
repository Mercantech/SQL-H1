import { useId, useMemo, useState } from "react";
import type { ContentDto } from "../../api";
import { getExerciseHints } from "../../lib/raymond";
import type { RaymondReactionId } from "../../lib/raymondReactions";
import { RaymondAvatar } from "./RaymondUI";
import "./exercise.css";
import "./learning-reactions.css";

export function RaymondExerciseHints({ content }: { content: ContentDto }) {
  return <RaymondExerciseContent key={content.slug} content={content} />;
}

function RaymondExerciseContent({ content }: { content: ContentDto }) {
  const hintId = useId();
  const [revealedCount, setRevealedCount] = useState(0);
  const hints = useMemo(
    () => (content.kind === "exercise" || content.kind === "project" ? getExerciseHints(content).slice(0, 3) : []),
    [content],
  );
  const hintReactions: RaymondReactionId[] = ["curious", "idea-notes", "eureka", "determined"];
  const encouragement = [
    "Lad os finde dit næste skridt.",
    "Prøv idéen på en lille del af opgaven.",
    "Kan du forklare, hvad hintet ændrer ved din løsning?",
    "Nu har du alle hints. Afprøv, undersøg og forklar din løsning.",
  ];

  return (
    <section className="raymond-exercise" aria-label="Hints til opgaven">
      <div className="raymond-hint-heading">
        <RaymondAvatar reaction={hintReactions[Math.min(revealedCount, 3)]} size={68} />
        <div><h3>Hints til opgaven</h3><p className="raymond-hint-encouragement" aria-live="polite">{encouragement[Math.min(revealedCount, 3)]}</p></div>
      </div>
      <p>Åbn ét hint ad gangen, når du har brug for et lille skub.</p>
      <div className="raymond-exercise-actions">
        {hints.length > 0 && (
          <div className="raymond-exercise-hint-buttons" role="group" aria-label="Gradvis hjælp til opgaven">
            {hints.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`btn ${revealedCount > index ? "active" : ""}`}
                disabled={index > revealedCount}
                aria-expanded={revealedCount > index}
                aria-controls={`${hintId}-hint-${index}`}
                onClick={() => setRevealedCount((count) => Math.max(count, index + 1))}
              >
                Hint {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      {hints.length > 0 && (
        <div className="raymond-exercise-hints">
          {hints.map((hint, index) => (
            <p id={`${hintId}-hint-${index}`} key={index} hidden={revealedCount <= index}>
              <strong>Hint {index + 1}.</strong> {hint}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
