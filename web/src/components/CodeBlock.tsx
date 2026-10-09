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

/**
 * Fjern kun den ledende newline fra fence-start (markdown/rehype).
 * Gå kun venstre kant — trim ikke \n mellem highlight.js-tokens.
 */
function trimFenceChildren(children: ReactNode): ReactNode {
  if (children == null || typeof children === "boolean") return children;
  if (typeof children === "string") return children.replace(/^\n+/, "");
  if (Array.isArray(children)) {
    if (children.length === 0) return children;
    const first = children[0];
    if (typeof first === "string") {
      const trimmed = first.replace(/^\n+/, "");
      if (trimmed === "" && /^\n+$/.test(first)) return children.slice(1);
      if (trimmed === first) return children;
      return [trimmed, ...children.slice(1)];
    }
    const trimmedFirst = trimFenceChildren(first);
    if (trimmedFirst === first) return children;
    return [trimmedFirst, ...children.slice(1)];
  }
  if (isValidElement<{ children?: ReactNode }>(children)) {
    const inner = children.props.children;
    const next = trimFenceChildren(inner);
    if (next === inner) return children;
    return cloneElement(children, {}, next);
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
