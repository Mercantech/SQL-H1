import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import csharp from "highlight.js/lib/languages/csharp";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import type { Element, ElementContent, Root } from "hast";
import type { PluggableList } from "unified";
import { CodeBlock } from "./CodeBlock";
import { JoinViz, parseJoinVizFence } from "./join/JoinViz";
import { parseRaymondLessonHeader } from "../lib/raymondLesson";
import { RaymondLessonNote } from "./raymond/RaymondLessonNote";
import { rehypeTeachCheckpoints } from "../lib/teachCheckpoint";
import "./teach.css";

type Props = {
  children: string;
  onInsertCode?: (code: string) => void;
  onRunCode?: (code: string) => void;
  /** Behold ledende H1 (fx titel-slide i præsentation). */
  keepLeadingH1?: boolean;
  showRaymondArt?: boolean;
};

const rehypePlugins: PluggableList = [
  rehypeTeachCheckpoints,
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

function isCourseIllustration(src: unknown) {
  return typeof src === "string" && src.startsWith("/raymond/course/");
}

function getElementText(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(getElementText).join("");
  return "";
}

function rehypeRaymondIllustration() {
  return (tree: Root) => {
    let firstNote: Element | undefined;

    function findCourseIllustration(nodes: Root["children"]): Element | undefined {
      for (const node of nodes) {
        if (node.type !== "element") continue;
        if (node.tagName === "img" && isCourseIllustration(node.properties.src)) return node;
        if (!firstNote && node.tagName === "blockquote") {
          const header = node.children.find((child) => child.type === "element");
          if (header && parseRaymondLessonHeader(getElementText(header))) firstNote = node;
        }
        const illustration = findCourseIllustration(node.children);
        if (illustration) return illustration;
      }
    }

    const selected = findCourseIllustration(tree.children) ?? firstNote;
    if (selected) selected.properties.dataRaymondIllustration = "selected";
  };
}

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

export function Markdown({ children, onInsertCode, onRunCode, keepLeadingH1, showRaymondArt = true }: Props) {
  const source = keepLeadingH1 ? children : stripLeadingH1(children);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={showRaymondArt ? [rehypeRaymondIllustration, ...rehypePlugins] : rehypePlugins}
      components={{
        blockquote: ({ children: quoteChildren, node }) => {
          const nodes = Children.toArray(quoteChildren);
          const headerIndex = nodes.findIndex((node) => isValidElement(node));
          const header = headerIndex >= 0 ? parseRaymondLessonHeader(getText(nodes[headerIndex])) : null;
          if (!header) return <blockquote>{quoteChildren}</blockquote>;
          return (
            <RaymondLessonNote {...header} illustrated={node?.properties.dataRaymondIllustration === "selected"}>
              {nodes.slice(headerIndex + 1)}
            </RaymondLessonNote>
          );
        },
        img: ({ src, alt, node }) => {
          const courseArt = isCourseIllustration(src);
          if (courseArt && node?.properties.dataRaymondIllustration !== "selected") return null;
          return (
            <img
              src={src}
              alt={alt ?? ""}
              loading="lazy"
              decoding="async"
              className={courseArt ? "lesson-raymond raymond-page-art" : undefined}
            />
          );
        },
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
