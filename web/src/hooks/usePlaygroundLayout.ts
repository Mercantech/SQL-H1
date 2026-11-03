import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type PlaygroundLayoutMode = "stack" | "side";

const LAYOUT_KEY = "sqlh1_pg_layout";
const SPLIT_KEY = "sqlh1_pg_split";
const MIN = 25;
const MAX = 75;
const DEFAULT_PERCENT = 55;
const DEFAULT_LAYOUT: PlaygroundLayoutMode = "stack";

function readLayout(): PlaygroundLayoutMode {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  const raw = localStorage.getItem(LAYOUT_KEY);
  return raw === "side" ? "side" : "stack";
}

function readPercent() {
  if (typeof window === "undefined") return DEFAULT_PERCENT;
  const n = Number(localStorage.getItem(SPLIT_KEY));
  if (!Number.isFinite(n)) return DEFAULT_PERCENT;
  return Math.min(MAX, Math.max(MIN, n));
}

export function usePlaygroundLayout() {
  const [layout, setLayoutState] = useState<PlaygroundLayoutMode>(readLayout);
  const [percent, setPercent] = useState(readPercent);
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false,
  );
  const dragging = useRef(false);
  const effectiveLayout: PlaygroundLayoutMode = narrow ? "stack" : layout;
  const layoutRef = useRef(effectiveLayout);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    layoutRef.current = effectiveLayout;
  }, [effectiveLayout]);

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem(SPLIT_KEY, String(percent));
  }, [percent]);

  const clamp = useCallback((n: number) => Math.min(MAX, Math.max(MIN, n)), []);

  const setLayout = useCallback((next: PlaygroundLayoutMode) => {
    setLayoutState(next);
  }, []);

  const reset = useCallback(() => {
    setLayoutState(DEFAULT_LAYOUT);
    setPercent(DEFAULT_PERCENT);
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const root = containerRef.current;
      if (!root) return;
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const axis = layoutRef.current === "side" ? "x" : "y";
      document.body.classList.add("is-resizing-split");
      document.body.classList.toggle("is-resizing-split-y", axis === "y");

      const move = (ev: PointerEvent) => {
        if (!dragging.current) return;
        const rect = root.getBoundingClientRect();
        if (axis === "x") {
          if (rect.width <= 0) return;
          setPercent(clamp(((ev.clientX - rect.left) / rect.width) * 100));
        } else {
          if (rect.height <= 0) return;
          setPercent(clamp(((ev.clientY - rect.top) / rect.height) * 100));
        }
      };

      const up = () => {
        dragging.current = false;
        document.body.classList.remove("is-resizing-split", "is-resizing-split-y");
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
      const side = layoutRef.current === "side";
      const dec = side ? "ArrowLeft" : "ArrowUp";
      const inc = side ? "ArrowRight" : "ArrowDown";
      if (e.key === dec) {
        e.preventDefault();
        setPercent((p) => clamp(p - 2));
      } else if (e.key === inc) {
        e.preventDefault();
        setPercent((p) => clamp(p + 2));
      } else if (e.key === "Home") {
        e.preventDefault();
        setPercent(DEFAULT_PERCENT);
      }
    },
    [clamp],
  );

  return {
    layout,
    effectiveLayout,
    setLayout,
    percent,
    reset,
    containerRef,
    onPointerDown,
    onKeyDown,
  };
}
