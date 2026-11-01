import { Link } from "react-router-dom";
import { beginLogin, isLoggedIn } from "../auth";
import { useRaymond } from "../components/raymond/RaymondContext";
import "../components/raymond/onboarding.css";

export function Home() {
  const { openOnboarding } = useRaymond();

  return (
    <section className="hero home-raymond">
      <div className="hero-copy">
        <p className="home-raymond-eyebrow">SQL-H1 · Hovedforløb 1</p>
        <h1>Lær SQL med teori og egen Postgres</h1>
        <p className="lede">
          Fra din første SELECT til at ændre og forbinde data. Læs teorien,
          afprøv eksemplerne, og løs opgaver i din egen database.
        </p>
        <div className="cta-row">
          <Link className="btn primary" to="/modules">
            Se moduler
          </Link>
          {!isLoggedIn() ? (
            <button type="button" className="btn" onClick={() => beginLogin()}>
              Log ind for at øve
            </button>
          ) : (
            <Link className="btn" to="/playground">
              Åbn playground
            </Link>
          )}
        </div>
        <div className="home-raymond-intro">
          <p>
            <strong>Mød Raymond, din SQL-guide.</strong> Jeg viser dig vej til
            teorien, editoren og hjælpen undervejs.
          </p>
          <button
            type="button"
            className="home-raymond-tour"
            onClick={openOnboarding}
          >
            Vis mig rundt <span aria-hidden="true">→</span>
          </button>
        </div>
        <p className="home-raymond-access">
          Teorien er åben. Log ind, når du vil øve i din egen database.
        </p>
      </div>
      <div className="home-raymond-visual">
        <figure className="home-raymond-professor">
          <img
            src="/raymond/professor.webp"
            alt="Professor Codd, kaldet Raymond, den blå elefant med briller, bog og pegepind."
            width="480"
            height="480"
            fetchPriority="high"
          />
          <figcaption>Professor Codd · kald mig Raymond</figcaption>
        </figure>
        <div className="home-raymond-query" aria-label="Et eksempel på SQL">
          <span className="home-raymond-query-label">Det begynder med en forespørgsel</span>
          <pre><code>{`SELECT name, city
FROM customers
WHERE city = 'Viborg'
ORDER BY name;`}</code></pre>
        </div>
      </div>
    </section>
  );
}
