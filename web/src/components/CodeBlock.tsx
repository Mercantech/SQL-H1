import { isValidElement, useState, type ReactNode } from "react";

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

function isSqlLanguage(lang: string | null | undefined) {
  if (!lang) return false;
  const l = lang.toLowerCase();
  return l === "sql" || l === "postgresql" || l === "postgres" || l === "psql";
}

export function CodeBlock({ children, language, onInsert, onRun }: Props) {
  const [copied, setCopied] = useState(false);
  const code = getText(children).replace(/\n$/, "");
  const canRun = Boolean(onRun && isSqlLanguage(language) && code.trim());

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
    <div className="md-code">
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
      <pre>{children}</pre>
    </div>
  );
}
