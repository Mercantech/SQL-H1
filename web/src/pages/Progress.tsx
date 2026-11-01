import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchModules, fetchProgress, type ModuleDto, type ProgressRow } from "../api";
import { beginLogin, isLoggedIn } from "../auth";
import { RaymondNote } from "../components/raymond/Raymond";
import { useRaymond } from "../components/raymond/RaymondContext";

export function Progress() {
  const { openHelp } = useRaymond();
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) return;
    Promise.all([fetchProgress(), fetchModules().catch(() => [] as ModuleDto[])])
      .then(([progress, list]) => {
        setRows(progress);
        setModules(list);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const itemsBySlug = useMemo(() => new Map(modules.flatMap((m) => m.items.map((item) => [item.slug, item] as const))), [modules]);
  const nextItem = useMemo(() => {
    const completed = new Set(rows.filter((r) => r.status === "completed").map((r) => r.contentSlug));
    for (const mod of [...modules].sort((a, b) => a.order - b.order)) {
      const item = [...mod.items].sort((a, b) => a.order - b.order).find((i) => !completed.has(i.slug));
      if (item) return item;
    }
    return null;
  }, [modules, rows]);

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
      {!loading && !error && (
        <RaymondNote compact mood={nextItem || !rows.length ? "help" : "celebration"} title={rows.length ? "Byg videre på det, du har prøvet" : "Begynd med en lille succes"}>
          <p>
            {nextItem ? <><Link to={`/learn/${nextItem.slug}`}>{nextItem.title}</Link> er dit næste trin. </> : !rows.length ? <><Link to="/modules">Åbn det første modul</Link> og afprøv et eksempel. </> : "Genbesøg et emne, du vil være mere sikker i. "}
            Teori registreres som åbnet, når du besøger siden; det er ikke en test af din forståelse.
            En opgave markeres som bestået, når dens tjek er bestået.
          </p>
          <button type="button" className="btn ghost" onClick={openHelp}>Spørg Raymond</button>
        </RaymondNote>
      )}
      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Henter fremskridt…</p>}
      <ul className="item-list">
        {rows.map((r) => (
          <li key={`${r.contentSlug}-${r.partIndex}`}>
            <Link to={`/learn/${r.contentSlug}`}>
              <span className={`pill ${r.status}`}>
                {r.status === "completed"
                  ? itemsBySlug.get(r.contentSlug)?.kind === "theory" ? "Teori åbnet" : itemsBySlug.get(r.contentSlug)?.kind === "exercise" ? "Bestået" : "Fuldført"
                  : r.status === "started" ? "I gang" : r.status}
              </span>
              {itemsBySlug.get(r.contentSlug)?.title ?? r.contentSlug}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
