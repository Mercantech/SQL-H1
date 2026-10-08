import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { beginLogin, getUserProfile, isLoggedIn, logout } from "../auth";

export function Layout() {
  const loggedIn = isLoggedIn();
  const profile = getUserProfile();
  const { pathname } = useLocation();
  const flushLearn =
    pathname.startsWith("/learn/") ||
    /^\/modules\/[^/]+$/.test(pathname);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          SQL-H1
        </Link>
        <nav>
          <NavLink to="/modules">Moduler</NavLink>
          <NavLink to="/playground">Playground</NavLink>
          <NavLink to="/database">Database</NavLink>
          <NavLink to="/progress">Progress</NavLink>
        </nav>
        <div className="auth-slot">
          {loggedIn ? (
            <>
              <span className="user-chip">{profile?.name || "Elev"}</span>
              <button type="button" className="btn ghost" onClick={() => logout()}>
                Log ud
              </button>
            </>
          ) : (
            <button type="button" className="btn primary" onClick={() => beginLogin()}>
              Log ind
            </button>
          )}
        </div>
      </header>
      <main className={flushLearn ? "main main--flush" : "main"}>
        <Outlet />
      </main>
    </div>
  );
}
