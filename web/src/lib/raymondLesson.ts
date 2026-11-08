import { getRaymondReaction, type RaymondReactionId } from "./raymondReactions.ts";

export type RaymondLessonHeader = { reaction: RaymondReactionId; title: string };

/** Only an explicit, valid first paragraph turns a normal Markdown quote into Raymond's voice. */
export function parseRaymondLessonHeader(text: string): RaymondLessonHeader | null {
  const match = /^\[!RAYMOND:([a-z][a-z0-9-]*)\][ \t]+([^\r\n]+)$/.exec(text.trim());
  if (!match) return null;
  const reaction = getRaymondReaction(match[1]);
  const title = match[2].trim();
  if (reaction.id !== match[1] || !title) return null;
  return { reaction: reaction.id, title };
}
