import type { ModuleDto } from "../api";

export type FlatStep = {
  moduleSlug: string;
  moduleTitle: string;
  moduleOrder: number;
  item: ModuleDto["items"][number];
};

/** Flad sti gennem alle moduler/lektioner i pensum-rækkefølge. */
export function buildFlatPath(modules: ModuleDto[]): FlatStep[] {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const steps: FlatStep[] = [];
  for (const mod of sorted) {
    const items = [...mod.items].sort((a, b) => a.order - b.order);
    for (const item of items) {
      steps.push({
        moduleSlug: mod.slug,
        moduleTitle: mod.title,
        moduleOrder: mod.order,
        item,
      });
    }
  }
  return steps;
}
