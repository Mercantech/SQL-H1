import { isValidElement, useState, type ReactNode } from "react";

type Props = {
  children?: ReactNode;
  onInsert?: (code: string) => void;
};

function getText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return getText(node.props.children);
  return "";
}

export function CodeBlock({ children, onInsert }: Props) {
  const [copied, setCopied] = useState(false);
  const code = getText(children).replace(/\n$/, "");

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
      </div>
      <pre>{children}</pre>
    </div>
  );
}
