import type { ReactNode } from "react";
import type { RaymondLessonHeader } from "../../lib/raymondLesson";
import { RaymondAvatar } from "./RaymondUI";
import "./lesson-note.css";

type Props = RaymondLessonHeader & { illustrated: boolean; children: ReactNode };

export function RaymondLessonNote({ reaction, title, illustrated, children }: Props) {
  return (
    <div className={`raymond-lesson-note${illustrated ? " raymond-lesson-note--illustrated" : ""}`} role="note" data-reaction={reaction}>
      {illustrated && <RaymondAvatar reaction={reaction} size={56} />}
      <div className="raymond-lesson-note-copy">
        {illustrated && <p className="raymond-lesson-speaker">Raymond</p>}
        <strong className="raymond-lesson-note-title">{title}</strong>
        <div className="raymond-lesson-note-body">{children}</div>
      </div>
    </div>
  );
}
