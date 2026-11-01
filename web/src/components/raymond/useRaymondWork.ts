import { useEffect } from "react";
import { useRaymond, type RaymondWorkContext } from "./RaymondContext";

export function useRaymondWork({ contentSlug, currentSql, lastError, resultSummary, checkMessages, checkPassed }: RaymondWorkContext, active = true) {
  const { setWorkContext } = useRaymond();
  useEffect(() => {
    setWorkContext(active ? { contentSlug, currentSql, lastError, resultSummary, checkMessages, checkPassed } : null);
  }, [setWorkContext, active, contentSlug, currentSql, lastError, resultSummary, checkMessages, checkPassed]);
  useEffect(() => () => setWorkContext(null), [setWorkContext]);
}
