import { Link } from "react-router-dom";
import { courseMissions } from "../lib/course";

export function CourseMission({ moduleSlug, goals = [] }: { moduleSlug: string; goals?: number[] }) {
  const mission = courseMissions[moduleSlug];
  if (!mission) return null;
  return (
    <div className="course-mission">
      <img src={`/raymond/course/${mission.image}.webp`} alt={mission.alt} width={128} height={128} loading="lazy" />
      <div>
        <p className="eyebrow">Raymonds GameHub · Målpind {goals.map((goal) => `#${goal}`).join(", ")}</p>
        <p><strong>{mission.challenge}</strong></p>
        <p>Byg, undersøg og forklar dine valg. <Link to="/modules/orm">Se starten på forløbet</Link>.</p>
      </div>
    </div>
  );
}

export function GameHubInvitation() {
  return (
    <aside className="gamehub-invitation" aria-label="Raymonds GameHub">
      <img src="/raymond/course/orm.webp" alt="Raymond gør klar til at bygge GameHub" width={160} height={160} loading="lazy" />
      <div>
        <p className="eyebrow">Næste udfordring · Målpind 18–24</p>
        <h2>Raymonds GameHub har brug for dig</h2>
        <p>Spillere, turneringer og data, der skal holde. Byg med ORM, udforsk dokumentdatabaser, vælg ud fra målinger, og gør løsningen sikker og testet.</p>
        <Link className="btn primary" to="/learn/orm-01-intro">Tag den første mission</Link>
      </div>
    </aside>
  );
}
