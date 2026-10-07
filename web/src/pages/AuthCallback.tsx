import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { provisionSandbox } from "../api";
import { handleAuthCallback } from "../auth";

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await handleAuthCallback();
        try {
          await provisionSandbox();
        } catch {
          /* playground forsøger igen */
        }
        navigate("/", { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login fejlede");
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <section className="page">
        <h1>Login fejlede</h1>
        <p className="error-text">{error}</p>
      </section>
    );
  }

  return (
    <section className="page">
      <p className="muted">Logger ind…</p>
    </section>
  );
}
