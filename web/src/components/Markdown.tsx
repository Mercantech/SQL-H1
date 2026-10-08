import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import sql from "highlight.js/lib/languages/sql";
import type { PluggableList } from "unified";

type Props = {
  children: string;
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

export function Markdown({ children }: Props) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins}>
      {children}
    </ReactMarkdown>
  );
}
