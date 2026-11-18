import { Link } from "react-router-dom";
import { courseMissions } from "../lib/course";

export function CourseMission({ moduleSlug, goals = [] }: { moduleSlug: string; goals?: number[] }) {
  const mission = courseMissions[moduleSlug];
  if (!mission) return null;
  return (
    <div className="course-mission">
      <img className="raymond-page-art" src={`/raymond/course/${mission.image}.webp`} alt={mission.alt} width={128} height={128} loading="lazy" />
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
    <aside className="gamehub-invitation" aria-label="GameHub-projektet">
      <div>
        <p className="eyebrow">Projekt · Målpind 18–24</p>
        <h2>Byg GameHub</h2>
        <p>Spillere, turneringer og data, der skal holde. Byg med ORM, udforsk dokumentdatabaser, vælg ud fra målinger, og gør løsningen sikker og testet.</p>
        <Link className="btn" to="/learn/orm-01-intro">Tag den første mission <span aria-hidden="true">→</span></Link>
      </div>
    </aside>
  );
}
