import { createContext, useContext } from "react";

type RaymondControls = { openHelp: () => void; openOnboarding: () => void };
export type RaymondState = RaymondControls & { helpOpen: boolean; tourOpen: boolean; closeHelp: () => void; closeTour: () => void; welcomed: boolean; dismissWelcome: () => void };
export const RaymondContext = createContext<RaymondState | null>(null);

export function useRaymond(): RaymondControls {
  const state = useContext(RaymondContext);
  if (!state) throw new Error("Raymond skal bruges inde i RaymondProvider");
  return state;
}

