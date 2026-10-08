import { useEffect, useState } from "react";

const KEY = "sqlh1_module_nav_open";

function initialOpen() {
  if (typeof window === "undefined") return true;
  const saved = sessionStorage.getItem(KEY);
  if (saved === "1") return true;
  if (saved === "0") return false;
  return window.matchMedia("(min-width: 901px)").matches;
}

export function useModuleNavOpen() {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    sessionStorage.setItem(KEY, open ? "1" : "0");
  }, [open]);

  return [open, setOpen] as const;
}
