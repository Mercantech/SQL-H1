import { cloneElement, isValidElement, useState, type ReactNode } from "react";

type Props = {
  children?: ReactNode;
  language?: string | null;
  onInsert?: (code: string) => void;
  onRun?: (code: string) => void;
};

function getText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return getText(node.props.children);
  return "";
}

export function isSqlLanguage(lang: string | null | undefined) {
  if (!lang) return false;
  const l = lang.toLowerCase();
  return l === "sql" || l === "postgresql" || l === "postgres" || l === "psql";
}

/** Fjern ledende newline fra highlight.js / markdown fences. */
function trimFenceChildren(children: ReactNode): ReactNode {
  if (children == null || typeof children === "boolean") return children;
  if (typeof children === "string") return children.replace(/^\n+/, "");
  if (Array.isArray(children)) return children.map((c) => trimFenceChildren(c));
  if (isValidElement<{ children?: ReactNode }>(children)) {
    const inner = children.props.children;
    if (typeof inner === "string") {
      return cloneElement(children, {}, inner.replace(/^\n+/, ""));
    }
    if (Array.isArray(inner) && typeof inner[0] === "string") {
      const next = [...inner];
      next[0] = (next[0] as string).replace(/^\n+/, "");
      return cloneElement(children, {}, next);
    }
    return cloneElement(children, {}, trimFenceChildren(inner));
  }
  return children;
}

export function CodeBlock({ children, language, onInsert, onRun }: Props) {
  const [copied, setCopied] = useState(false);
  const isSql = isSqlLanguage(language);
  const body = trimFenceChildren(children);
  const code = getText(body).replace(/\n$/, "");
  const canRun = Boolean(onRun && isSql && code.trim());
  const showActions = isSql;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`md-code ${showActions ? "md-code--sql" : "md-code--plain"}`}>
      {showActions && (
        <div className="md-code-actions">
          <button type="button" className="md-code-btn" onClick={copy}>
            {copied ? "Kopieret" : "Kopiér"}
          </button>
          {onInsert && (
            <button type="button" className="md-code-btn" onClick={() => onInsert(code)}>
              Indsæt i editor
            </button>
          )}
          {canRun && (
            <button
              type="button"
              className="md-code-btn md-code-btn-run"
              onClick={() => onRun?.(code)}
            >
              Kør
            </button>
          )}
        </div>
      )}
      <pre>{body}</pre>
    </div>
  );
}
