import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import sql from "highlight.js/lib/languages/sql";
import type { PluggableList } from "unified";
import { CodeBlock } from "./CodeBlock";

type Props = {
  children: string;
  onInsertCode?: (code: string) => void;
};

const rehypePlugins: PluggableList = [
  [
    rehypeHighlight,
    {
      languages: { sql },
      aliases: {
        postgresql: "sql",
        postgres: "sql",
        psql: "sql",
      },
    },
  ],
];

export function Markdown({ children, onInsertCode }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={rehypePlugins}
      components={{
        pre: ({ children: preChildren }) => (
          <CodeBlock onInsert={onInsertCode}>{preChildren}</CodeBlock>
        ),
      }}
    >
      {children}
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
