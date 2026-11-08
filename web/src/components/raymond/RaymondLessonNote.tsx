import type { ReactNode } from "react";
import type { RaymondLessonHeader } from "../../lib/raymondLesson";
import { RaymondAvatar } from "./RaymondUI";
import "./lesson-note.css";

export function RaymondLessonNote({ reaction, title, children }: RaymondLessonHeader & { children: ReactNode }) {
  return (
    <div className="raymond-lesson-note" role="note" aria-label={`Raymond: ${title}`} data-reaction={reaction}>
      <RaymondAvatar reaction={reaction} size={56} />
      <div className="raymond-lesson-note-copy">
        <p className="raymond-lesson-speaker">Raymond</p>
        <strong className="raymond-lesson-note-title">{title}</strong>
        <div className="raymond-lesson-note-body">{children}</div>
      </div>
    </div>
  );
}
