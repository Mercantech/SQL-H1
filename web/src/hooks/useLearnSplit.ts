import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

const KEY = "sqlh1_learn_split";
const MIN = 22;
const MAX = 78;
const DEFAULT = 50;

function readSaved() {
  if (typeof window === "undefined") return DEFAULT;
  const raw = localStorage.getItem(KEY);
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return DEFAULT;
  return Math.min(MAX, Math.max(MIN, n));
}

export function useLearnSplit() {
  const [percent, setPercent] = useState(readSaved);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(KEY, String(percent));
  }, [percent]);

  const clamp = useCallback((n: number) => Math.min(MAX, Math.max(MIN, n)), []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const root = containerRef.current;
      if (!root) return;
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.classList.add("is-resizing-split");

      const move = (ev: PointerEvent) => {
        if (!dragging.current) return;
        const rect = root.getBoundingClientRect();
        if (rect.width <= 0) return;
        setPercent(clamp(((ev.clientX - rect.left) / rect.width) * 100));
      };

      const up = () => {
        dragging.current = false;
        document.body.classList.remove("is-resizing-split");
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [clamp],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPercent((p) => clamp(p - 2));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPercent((p) => clamp(p + 2));
      } else if (e.key === "Home") {
        e.preventDefault();
        setPercent(DEFAULT);
      }
    },
    [clamp],
  );

  return { percent, containerRef, onPointerDown, onKeyDown };
}
