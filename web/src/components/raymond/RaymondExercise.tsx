import { useId, useMemo, useState } from "react";
import type { ContentDto } from "../../api";
import { getExerciseHints, getRaymondTopic } from "../../lib/raymond";
import { RaymondNote } from "./Raymond";
import { useRaymond } from "./RaymondContext";
import "./exercise.css";

export function RaymondExercise({ content }: { content: ContentDto }) {
  return <RaymondExerciseContent key={content.slug} content={content} />;
}

function RaymondExerciseContent({ content }: { content: ContentDto }) {
  const { openHelp } = useRaymond();
  const hintId = useId();
  const [revealedCount, setRevealedCount] = useState(0);
  const topic = useMemo(() => getRaymondTopic(content.slug), [content.slug]);
  const hints = useMemo(
    () => (content.kind === "exercise" ? getExerciseHints(content).slice(0, 3) : []),
    [content],
  );

  return (
    <RaymondNote
      mood={revealedCount > 0 ? "help" : "neutral"}
      title={`Raymond om ${topic.title}`}
      compact
      className="raymond-exercise"
    >
      <p>{topic.summary}</p>
      <div className="raymond-exercise-actions">
        <button type="button" className="btn ghost" onClick={openHelp}>
          Forklar emnet
        </button>
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
    </RaymondNote>
  );
}
