import type { CSSProperties, ReactNode } from "react";
import type { RaymondMood } from "../../lib/raymond";
import "./raymond.css";

export function RaymondAvatar({ mood = "neutral", size = 72, className = "" }: { mood?: RaymondMood; size?: number; className?: string }) {
  return (
    <span className={`raymond-avatar ${className}`} style={{ width: size, height: Math.round(size * 0.66) } as CSSProperties} aria-hidden="true">
      <img src={`/raymond/${mood}.webp`} alt="" width={384} height={384} loading="lazy" decoding="async" />
    </span>
  );
}

export function RaymondNote({ mood = "neutral", title = "Et tip fra Raymond", children, compact = false, className = "" }: { mood?: RaymondMood; title?: string; children: ReactNode; compact?: boolean; className?: string }) {
  return (
    <section className={`raymond-note raymond-note--${mood}${compact ? " raymond-note--compact" : ""} ${className}`} aria-label={title}>
      <RaymondAvatar mood={mood} size={compact ? 64 : 88} />
      <div className="raymond-note-copy"><strong className="raymond-note-title">{title}</strong><div>{children}</div></div>
    </section>
  );
}

