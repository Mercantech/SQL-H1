import { JoinChainViz } from "./JoinChainViz";
import { JoinMatchPlayground } from "./JoinMatchPlayground";
import { JoinTypeExplorer } from "./JoinTypeExplorer";

export type JoinVizConfig = {
  widget?: string;
};

type Props = {
  config: JoinVizConfig;
  onInsert?: (sql: string) => void;
};

export function JoinViz({ config, onInsert }: Props) {
  const widget = (config.widget ?? "types").trim().toLowerCase();

  switch (widget) {
    case "match":
    case "keys":
      return <JoinMatchPlayground onInsert={onInsert} />;
    case "chain":
    case "multi":
      return <JoinChainViz onInsert={onInsert} />;
    case "types":
    case "venn":
    default:
      return <JoinTypeExplorer onInsert={onInsert} />;
  }
}

export function parseJoinVizFence(raw: string): JoinVizConfig {
  const text = raw.trim();
  if (!text) return { widget: "types" };
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as JoinVizConfig;
      return { widget: parsed.widget ?? "types" };
    } catch {
      return { widget: "types" };
    }
  }
  return { widget: text.split(/\s+/)[0] ?? "types" };
}
