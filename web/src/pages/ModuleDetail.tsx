import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchModules, type ModuleDto } from "../api";

export function ModuleDetail() {
  const { slug } = useParams();
  const [mod, setMod] = useState<ModuleDto | null>(null);

  useEffect(() => {
    fetchModules().then((list) => setMod(list.find((m) => m.slug === slug) || null));
  }, [slug]);

  if (!mod) return <p className="muted">Henter modul…</p>;

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">
          <Link to="/modules">Moduler</Link> / {mod.title}
        </p>
        <h1>{mod.title}</h1>
        <p>{mod.description}</p>
        {mod.objectives?.length > 0 && (
          <ul className="objectives">
            {mod.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
      </header>
      <ul className="item-list">
        {mod.items.map((item) => (
          <li key={item.slug}>
            <Link to={`/learn/${item.slug}`}>
              <span className="pill">{item.kind === "exercise" ? "Opgave" : "Teori"}</span>
              {item.title}
            </Link>
          </li>
        ))}
        {mod.items.length === 0 && <li className="muted">Ingen lektioner endnu.</li>}
      </ul>
    </section>
  );
}
