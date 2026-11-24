import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import { parseTeachCheckpoint, rehypeTeachCheckpoints } from "../src/lib/teachCheckpoint.ts";
import { splitMarkdownToSlides } from "../src/lib/splitSlides.ts";

function render(markdown) {
  return renderToStaticMarkup(React.createElement(Markdown, { rehypePlugins: [rehypeTeachCheckpoints] }, markdown));
}

const prompt = { question: "Hvor mange rækker kommer der?", hint: "Følg kunden.", answer: "To rækker." };
const block = ["```teach", JSON.stringify(prompt), "```"].join("\n");

test("the public lesson and the presenter expose the question before either explanation", () => {
  const lesson = "# To ordrer\n\n## Prøv selv\n\n" + block;
  const slide = splitMarkdownToSlides(lesson, "To ordrer").at(-1);
  for (const html of [render(lesson), render(slide.markdown)]) {
    assert.match(html, /<aside[^>]+aria-label="Tænk selv"/);
    assert.match(html, /<p>Hvor mange rækker kommer der\?<\/p>/);
    assert.match(html, /<details><summary>Få et hint<\/summary><p>Følg kunden\.<\/p><\/details>/);
    assert.match(html, /<details><summary>Vis forklaring<\/summary><p>To rækker\.<\/p><\/details>/);
    assert.doesNotMatch(html, /<details[^>]+open|language-teach/);
  }
});

test("hints are optional and authored strings are rendered as text", () => {
  const source = JSON.stringify({ question: "  Prøv selv ", answer: "<button>Forsøg</button>" });
  assert.deepEqual(parseTeachCheckpoint(source), { question: "Prøv selv", answer: "<button>Forsøg</button>" });
  const html = render(["```teach", source, "```"].join("\n"));
  assert.ok(html.includes("&lt;button&gt;Forsøg&lt;/button&gt;"));
  assert.ok(!html.includes("Få et hint"));
});

test("other fences stay intact and malformed checkpoints hide their raw contents", () => {
  for (const text of ["false", "null", "invalid", '{}', '{"question":" x ","answer":" "}']) {
    assert.equal(parseTeachCheckpoint(text), null);
  }
  const html = render("```sql\nSELECT 1;\n```\n\n```teach\n{ invalid }\n```");
  assert.match(html, /language-sql/);
  assert.match(html, /Spørgsmålet kunne ikke vises/);
  assert.doesNotMatch(html, /\{ invalid \}/);
});
