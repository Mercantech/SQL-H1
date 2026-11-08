import type { CSSProperties, ReactNode } from "react";
import type { RaymondMood } from "../../lib/raymond";
import { getRaymondReaction, raymondMoodReactions, type RaymondReactionId } from "../../lib/raymondReactions";
import "./raymond.css";

export function RaymondAvatar({ mood = "neutral", reaction, size = 72, className = "" }: { mood?: RaymondMood; reaction?: RaymondReactionId; size?: number; className?: string }) {
  const illustration = getRaymondReaction(reaction ?? raymondMoodReactions[mood]);
  return (
    <span className={`raymond-avatar ${className}`} style={{ width: size, height: size } as CSSProperties} aria-hidden="true" data-reaction={illustration.id}>
      <img src={illustration.src} alt="" width={512} height={512} loading="lazy" decoding="async" />
    </span>
  );
}

export function RaymondNote({ mood = "neutral", reaction, title = "Et tip fra Raymond", children, compact = false, className = "" }: { mood?: RaymondMood; reaction?: RaymondReactionId; title?: string; children: ReactNode; compact?: boolean; className?: string }) {
  return (
    <section className={`raymond-note raymond-note--${mood}${compact ? " raymond-note--compact" : ""} ${className}`} aria-label={title}>
      <RaymondAvatar mood={mood} reaction={reaction} size={compact ? 64 : 88} />
      <div className="raymond-note-copy"><strong className="raymond-note-title">{title}</strong><div>{children}</div></div>
    </section>
  );
}

