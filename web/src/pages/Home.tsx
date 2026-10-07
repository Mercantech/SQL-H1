import { Link } from "react-router-dom";
import { beginLogin, isLoggedIn } from "../auth";

export function Home() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="brand-mark">SQL-H1</p>
        <h1>Lær SQL med teori og egen Postgres</h1>
        <p className="lede">
          Pensum til H1 — SELECT, DML og videre — med praktiske opgaver i din egen
          database.
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
      </div>
      <div className="hero-visual" aria-hidden="true">
        <pre>{`SELECT name, city
FROM customers
WHERE city = 'Viborg'
ORDER BY name;`}</pre>
      </div>
    </section>
  );
}
