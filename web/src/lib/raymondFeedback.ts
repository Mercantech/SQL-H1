import type { ExecuteResult } from "../api";
import type { RaymondReactionId } from "./raymondReactions";

/** Visual feedback follows actual execution/check state; running SQL never awards a pass. */
export function getSqlFeedbackReaction({ running, error, result, checkPassed }: {
  running?: boolean;
  error?: string | null;
  result?: ExecuteResult | null;
  checkPassed?: boolean | null;
}): RaymondReactionId {
  if (running) return "typing";
  if (error || (result && !result.ok)) return "debugging";
  if (checkPassed === true) return "applause";
  if (checkPassed === false) return "patient";
  if (result?.ok) return "thumbs-up";
  return "query-ready";
}
