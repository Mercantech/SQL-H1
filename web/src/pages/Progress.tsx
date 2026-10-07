import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProgress, type ProgressRow } from "../api";
import { beginLogin, isLoggedIn } from "../auth";

export function Progress() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchProgress()
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  if (!isLoggedIn()) {
    return (
      <section className="page">
        <h1>Progress</h1>
        <p>Log ind for at se din fremgang.</p>
        <button type="button" className="btn primary" onClick={() => beginLogin()}>
          Log ind
        </button>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1>Progress</h1>
        <p>Status pr. lektion og opgave.</p>
      </header>
      {error && <p className="error-text">{error}</p>}
      {!rows.length && !error && <p className="muted">Ingen fremskridt endnu — start et modul.</p>}
      <ul className="item-list">
        {rows.map((r) => (
          <li key={`${r.contentSlug}-${r.partIndex}`}>
            <Link to={`/learn/${r.contentSlug}`}>
              <span className={`pill ${r.status}`}>{r.status}</span>
              {r.contentSlug}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
