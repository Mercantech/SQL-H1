import { useId, useMemo, useState } from "react";
import type { ContentDto } from "../../api";
import { getExerciseHints } from "../../lib/raymond";
import "./exercise.css";

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

  return (
    <section className="raymond-exercise" aria-label="Hints til opgaven">
      <h3>Hints til opgaven</h3>
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
