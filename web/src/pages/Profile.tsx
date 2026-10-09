import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMe,
  fetchModules,
  fetchProgress,
  fetchQueryHistory,
  type MeDto,
  type ModuleDto,
  type ProgressRow,
  type QueryHistoryItem,
} from "../api";
import { beginLogin, getUserProfile, isLoggedIn, logout } from "../auth";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("da-DK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string) {
  if (status === "completed") return "Fuldført";
  if (status === "started") return "I gang";
  return status;
}

function sandboxLabel(status: string) {
  if (status === "ready") return "Klar";
  if (status === "none") return "Ikke oprettet";
  return status;
}

export function Profile() {
  const jwt = getUserProfile();
  const [me, setMe] = useState<MeDto | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchMe(),
      fetchProgress().catch(() => [] as ProgressRow[]),
      fetchQueryHistory(8).catch(() => [] as QueryHistoryItem[]),
      fetchModules().catch(() => [] as ModuleDto[]),
    ])
      .then(([meRes, prog, hist, mods]) => {
        setMe(meRes);
        setProgress(prog);
        setHistory(hist);
        setModules(mods);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Kunne ikke hente profil"))
      .finally(() => setLoading(false));
  }, []);

  const titleBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of modules) {
      for (const item of m.items) map.set(item.slug, item.title);
    }
    return map;
  }, [modules]);

  const stats = useMemo(() => {
    const completed = progress.filter((p) => p.status === "completed").length;
    const started = progress.filter((p) => p.status === "started").length;
    const recent = [...progress]
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 6);
    return { completed, started, recent };
  }, [progress]);

  const displayName = me?.displayName || jwt?.name || "Elev";
  const email = me?.email || jwt?.email || null;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (!isLoggedIn()) {
    return (
      <section className="page profile-page">
        <h1>Profil</h1>
        <p>Log ind for at se din elevprofil.</p>
        <button type="button" className="btn primary" onClick={() => beginLogin()}>
          Log ind
        </button>
      </section>
    );
  }

  return (
    <section className="page profile-page">
      <header className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          {initials || "?"}
        </div>
        <div className="profile-hero-text">
          <p className="eyebrow">Elevprofil</p>
          <h1>{displayName}</h1>
          {email ? <p className="profile-email">{email}</p> : <p className="muted">Ingen e-mail i token</p>}
        </div>
        <div className="profile-hero-actions">
          <Link to="/modules" className="btn primary">
            Fortsæt læring
          </Link>
          <button type="button" className="btn ghost" onClick={() => logout()}>
            Log ud
          </button>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Henter profil…</p>}

      {!loading && (
        <>
          <div className="profile-stats" aria-label="Overblik">
            <div className="profile-stat">
              <strong>{stats.completed}</strong>
              <span>Fuldførte</span>
            </div>
            <div className="profile-stat">
              <strong>{stats.started}</strong>
              <span>I gang</span>
            </div>
            <div className="profile-stat">
              <strong>{history.filter((h) => h.ok).length}</strong>
              <span>Seneste OK-kørsler*</span>
            </div>
            <div className="profile-stat">
              <strong>{me?.sandbox.status === "ready" ? "On" : "Off"}</strong>
              <span>Sandbox</span>
            </div>
          </div>
          <p className="profile-footnote muted">* blandt de seneste {history.length} i historikken</p>

          <div className="profile-grid">
            <section className="profile-card">
              <h2>Konto</h2>
              <dl className="profile-dl">
                <div>
                  <dt>Navn</dt>
                  <dd>{displayName}</dd>
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd>{email ?? "—"}</dd>
                </div>
                <div>
                  <dt>Bruger-id (sub)</dt>
                  <dd>
                    <code className="profile-mono">{me?.sub || jwt?.sub}</code>
                  </dd>
                </div>
                <div>
                  <dt>Login</dt>
                  <dd>Mercantec Auth (OIDC + PKCE)</dd>
                </div>
              </dl>
            </section>

            <section className="profile-card">
              <h2>Din database</h2>
              <dl className="profile-dl">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span
                      className={`profile-db-pill ${me?.sandbox.status === "ready" ? "ok" : "idle"}`}
                    >
                      {sandboxLabel(me?.sandbox.status ?? "none")}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Database</dt>
                  <dd>
                    <code className="profile-mono">{me?.sandbox.dbName || "—"}</code>
                  </dd>
                </div>
              </dl>
              <p className="muted profile-card-note">
                Hver elev har sin egen Postgres-sandbox. Nulstil fra emulatoren eller Database-siden, hvis
                data er blevet rod.
              </p>
              <div className="profile-card-actions">
                <Link to="/database" className="btn">
                  Åbn Database
                </Link>
                <Link to="/playground" className="btn ghost">
                  Playground
                </Link>
              </div>
            </section>

            <section className="profile-card profile-card-wide">
              <div className="profile-card-head">
                <h2>Seneste fremskridt</h2>
                <Link to="/progress" className="profile-more">
                  Se alt
                </Link>
              </div>
              {stats.recent.length === 0 ? (
                <p className="muted">Ingen fremskridt endnu — start et modul.</p>
              ) : (
                <ul className="profile-list">
                  {stats.recent.map((r) => (
                    <li key={`${r.contentSlug}-${r.partIndex}`}>
                      <Link to={`/learn/${r.contentSlug}`}>
                        <span className={`pill ${r.status}`}>{statusLabel(r.status)}</span>
                        <span className="profile-list-title">
                          {titleBySlug.get(r.contentSlug) || r.contentSlug}
                        </span>
                        <time dateTime={r.updatedAt}>{formatWhen(r.updatedAt)}</time>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="profile-card profile-card-wide">
              <div className="profile-card-head">
                <h2>Seneste SQL</h2>
                <span className="muted">Fra historik</span>
              </div>
              {history.length === 0 ? (
                <p className="muted">Ingen kørsler endnu.</p>
              ) : (
                <ul className="profile-sql-list">
                  {history.map((h) => (
                    <li key={h.id} className={h.ok ? "ok" : "err"}>
                      <div className="profile-sql-meta">
                        <span className={`profile-db-pill ${h.ok ? "ok" : "err"}`}>
                          {h.ok ? "OK" : "Fejl"}
                        </span>
                        <time dateTime={h.createdAt}>{formatWhen(h.createdAt)}</time>
                        {h.contentSlug && (
                          <Link to={`/learn/${h.contentSlug}`} className="muted">
                            {h.contentSlug}
                          </Link>
                        )}
                      </div>
                      <pre>{h.sql.length > 160 ? `${h.sql.slice(0, 160)}…` : h.sql}</pre>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
