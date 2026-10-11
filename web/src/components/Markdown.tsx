import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import csharp from "highlight.js/lib/languages/csharp";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import type { PluggableList } from "unified";
import { CodeBlock } from "./CodeBlock";
import { JoinViz, parseJoinVizFence } from "./join/JoinViz";

type Props = {
  children: string;
  onInsertCode?: (code: string) => void;
  onRunCode?: (code: string) => void;
  /** Behold ledende H1 (fx titel-slide i præsentation). */
  keepLeadingH1?: boolean;
};

const rehypePlugins: PluggableList = [
  [
    rehypeHighlight,
    {
      languages: { sql, csharp, yaml },
      aliases: {
        postgresql: "sql",
        postgres: "sql",
        psql: "sql",
        cs: "csharp",
        "c#": "csharp",
        yml: "yaml",
      },
    },
  ],
];

function getText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return getText(node.props.children);
  return "";
}

function getFenceLang(preChildren: ReactNode): string | null {
  const nodes = Array.isArray(preChildren) ? preChildren : [preChildren];
  for (const node of nodes) {
    if (!isValidElement<{ className?: string }>(node)) continue;
    const cls = node.props.className ?? "";
    const m = /\blanguage-([^\s]+)/.exec(cls);
    if (m) return m[1];
  }
  return null;
}

/** Side-titel kommer fra frontmatter — fjern ledende # i brødteksten. */
export function stripLeadingH1(markdown: string) {
  return markdown.replace(/^\uFEFF?\s*#\s+[^\n]+\n+/, "");
}

export function Markdown({ children, onInsertCode, onRunCode, keepLeadingH1 }: Props) {
  const source = keepLeadingH1 ? children : stripLeadingH1(children);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={rehypePlugins}
      components={{
        pre: ({ children: preChildren }) => {
          const lang = getFenceLang(preChildren);
          if (lang === "join-viz") {
            const raw = getText(preChildren).replace(/\n$/, "");
            return <JoinViz config={parseJoinVizFence(raw)} onInsert={onInsertCode} />;
          }
          return (
            <CodeBlock language={lang} onInsert={onInsertCode} onRun={onRunCode}>
              {preChildren}
            </CodeBlock>
          );
        },
      }}
    >
      {source}
    </ReactMarkdown>
  );
}

/** Tilføj kode nederst i editoren. */
export function appendCodeToEditor(current: string, chunk: string) {
  const base = current.replace(/\s+$/, "");
  const add = chunk.replace(/^\s+|\s+$/g, "");
  if (!add) return current;
  if (!base) return add;
  return `${base}\n\n${add}`;
}
