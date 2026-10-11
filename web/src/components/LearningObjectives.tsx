type Props = {
  objectives: string[];
  compact?: boolean;
};

/** Kapitlets læringsmål — «efter kapitlet kan du». */
export function LearningObjectives({ objectives, compact = false }: Props) {
  if (!objectives?.length) return null;

  const TitleTag = compact ? "p" : "h2";

  return (
    <div className={`learning-goals ${compact ? "learning-goals--compact" : ""}`}>
      <TitleTag className="learning-goals-title">Efter kapitlet kan du</TitleTag>
      <ul className="objectives">
        {objectives.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
    </div>
  );
}
