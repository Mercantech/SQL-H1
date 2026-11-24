import type { Element, Root } from "hast";

export type TeachCheckpoint = { question: string; answer: string; hint?: string };

export function parseTeachCheckpoint(source: string): TeachCheckpoint | null {
  try {
    const value = JSON.parse(source);
    if (!value || typeof value.question !== "string" || !value.question.trim()
      || typeof value.answer !== "string" || !value.answer.trim()
      || (value.hint !== undefined && typeof value.hint !== "string")) return null;
    const hint = value.hint?.trim();
    return { question: value.question.trim(), answer: value.answer.trim(), ...(hint ? { hint } : {}) };
  } catch {
    return null;
  }
}

function textElement(tagName: string, value: string): Element {
  return { type: "element", tagName, properties: {}, children: [{ type: "text", value }] };
}

function disclosure(label: string, explanation: string): Element {
  return {
    type: "element", tagName: "details", properties: {},
    children: [textElement("summary", label), textElement("p", explanation)],
  };
}

/** Native disclosure elements keep their state when the SQL editor rerenders. */
export function rehypeTeachCheckpoints() {
  function visit(parent: Root | Element) {
    for (const node of parent.children) {
      if (node.type !== "element") continue;
      const code = node.children[0];
      if (node.tagName !== "pre" || code?.type !== "element" || code.tagName !== "code"
        || !Array.isArray(code.properties.className) || !code.properties.className.includes("language-teach")) {
        visit(node);
        continue;
      }
      const checkpoint = parseTeachCheckpoint(code.children.map((child) => child.type === "text" ? child.value : "").join(""));
      node.tagName = "aside";
      node.properties = { className: ["teach-checkpoint"], ariaLabel: "Tænk selv" };
      node.children = checkpoint ? [
        textElement("strong", "Tænk selv"),
        textElement("p", checkpoint.question),
        ...(checkpoint.hint ? [disclosure("Få et hint", checkpoint.hint)] : []),
        disclosure("Vis forklaring", checkpoint.answer),
      ] : [textElement("p", "Spørgsmålet kunne ikke vises.")];
    }
  }
  return visit;
}
