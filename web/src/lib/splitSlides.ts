export type Slide = {
  title: string;
  markdown: string;
};

/**
 * Del lektions-markdown i slides: intro (før første ##) + ét slide pr. ##-sektion.
 */
export function splitMarkdownToSlides(markdown: string, pageTitle: string): Slide[] {
  const body = markdown.replace(/^\uFEFF?\s*#\s+[^\n]+\n*/, "").trim();
  if (!body) {
    return [{ title: pageTitle, markdown: `# ${pageTitle}` }];
  }

  const parts = body.split(/^## /m);
  const slides: Slide[] = [];

  const intro = parts[0]?.trim() ?? "";
  if (intro) {
    const hasH1 = /^#\s+/m.test(intro);
    slides.push({
      title: pageTitle,
      markdown: hasH1 ? intro : `# ${pageTitle}\n\n${intro}`,
    });
  } else {
    slides.push({ title: pageTitle, markdown: `# ${pageTitle}` });
  }

  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i] ?? "";
    const nl = chunk.indexOf("\n");
    const title = (nl >= 0 ? chunk.slice(0, nl) : chunk).trim() || `Slide ${i + 1}`;
    const rest = nl >= 0 ? chunk.slice(nl + 1) : "";
    slides.push({
      title,
      markdown: `## ${title}\n${rest}`.trim(),
    });
  }

  return slides;
}
