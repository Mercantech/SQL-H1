import { createContext, useContext } from "react";

export type RaymondWorkContext = {
  contentSlug?: string;
  currentSql?: string;
  lastError?: string;
  resultSummary?: string;
  checkMessages?: string[];
  checkPassed?: boolean;
};

type RaymondControls = {
  openHelp: () => void;
  openOnboarding: () => void;
  setWorkContext: (context: RaymondWorkContext | null) => void;
};
export type RaymondState = RaymondControls & {
  helpOpen: boolean;
  tourOpen: boolean;
  closeHelp: () => void;
  closeTour: () => void;
  welcomed: boolean;
  dismissWelcome: () => void;
  workContext: RaymondWorkContext | null;
};
export const RaymondContext = createContext<RaymondState | null>(null);

export function useRaymond(): RaymondControls {
  const state = useContext(RaymondContext);
  if (!state) throw new Error("Raymond skal bruges inde i RaymondProvider");
  return state;
}

