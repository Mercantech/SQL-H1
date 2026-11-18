import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  raymondReactionCategories,
  raymondReactions,
} from "../lib/raymondReactions";
import "../components/raymond/reactions.css";

export function RaymondReactions() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState("eureka");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const words = query.toLocaleLowerCase("da-DK").trim().split(/\s+/).filter(Boolean);
    return raymondReactions.filter((reaction) => {
      const haystack = `${reaction.label} ${reaction.description} ${reaction.id}`.toLocaleLowerCase("da-DK");
      return (category === "all" || reaction.category === category) && words.every((word) => haystack.includes(word));
    });
  }, [category, query]);
  const selectedIndex = Math.max(0, filtered.findIndex((reaction) => reaction.id === selectedId));
  const selected = filtered.at(selectedIndex);
  const selectedCategory = raymondReactionCategories.find((item) => item.id === selected?.category);

  function browse(offset: number) {
    const next = filtered[(selectedIndex + offset + filtered.length) % filtered.length];
    setSelectedId(next.id);
  }

  function clearFilters() {
    setCategory("all");
    setQuery("");
    searchRef.current?.focus();
  }

  return (
    <section className="page raymond-reactions-page">
      <header className="page-head">
        <p className="eyebrow">Din makker gennem SQL</p>
        <h1>Raymonds reaktioner</h1>
        <p>Et aha, et spørgsmål eller et lille skulderklap. Raymonds humør følger det, du arbejder med, og hjælper dig med at finde næste skridt.</p>
      </header>

      <div className="raymond-reaction-layout">
        <section className="raymond-reaction-preview" aria-labelledby="raymond-reaction-title">
          {selected && <img className="raymond-page-art" src={selected.src} alt="" width={512} height={512} decoding="async" />}
          <div className="raymond-reaction-preview-copy" aria-live="polite" aria-atomic="true">
            {selected ? (
              <>
                <p className="eyebrow">{selectedCategory?.label}</p>
                <h2 id="raymond-reaction-title">{selected.label}</h2>
                <p>{selected.description}</p>
              </>
            ) : (
              <>
                <h2 id="raymond-reaction-title">Ingen reaktioner fundet</h2>
                <p>Prøv et andet søgeord, eller vis hele samlingen.</p>
              </>
            )}
          </div>
          {selected && (
            <div className="raymond-reaction-pagination" role="group" aria-label="Bladr mellem reaktioner">
              <button type="button" className="btn" disabled={filtered.length < 2} onClick={() => browse(-1)} aria-label="Forrige reaktion"><span aria-hidden="true">←</span></button>
              <span>{selectedIndex + 1} af {filtered.length}</span>
              <button type="button" className="btn" disabled={filtered.length < 2} onClick={() => browse(1)} aria-label="Næste reaktion"><span aria-hidden="true">→</span></button>
            </div>
          )}
        </section>

        <section className="raymond-reaction-library" aria-labelledby="raymond-reaction-library-title">
          <h2 id="raymond-reaction-library-title">Find en reaktion</h2>
          <div className="raymond-reaction-field">
            <label htmlFor="raymond-reaction-search">Søg efter navn eller emne</label>
            <input
              ref={searchRef}
              id="raymond-reaction-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Fx aha, JOIN eller pause"
              autoComplete="off"
              aria-controls="raymond-reaction-select"
            />
          </div>

          <fieldset className="raymond-reaction-filters">
            <legend>Vis kategori</legend>
            <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>Alle</button>
            {raymondReactionCategories.map((item) => (
              <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>
            ))}
          </fieldset>

          <div className="raymond-reaction-field">
            <label htmlFor="raymond-reaction-select">Vælg reaktion</label>
            <select id="raymond-reaction-select" value={selected?.id ?? ""} disabled={!selected} onChange={(event) => setSelectedId(event.target.value)}>
              {selected ? filtered.map((reaction) => <option key={reaction.id} value={reaction.id}>{reaction.label}</option>) : <option value="">Ingen reaktioner</option>}
            </select>
          </div>
          {(category !== "all" || query) && (
            <button type="button" className="btn ghost raymond-reaction-clear" onClick={clearFilters}>Vis alle reaktioner</button>
          )}
        </section>
      </div>

      <section className="raymond-reaction-meaning" aria-labelledby="raymond-feedback-heading">
        <h2 id="raymond-feedback-heading">Hvad fejrer Raymond?</h2>
        <div className="raymond-reaction-meaning-grid">
          <div>
            <h3>Din SQL blev kørt</h3><p>Databasen kunne udføre din forespørgsel. Undersøg stadig, om resultatet svarer på spørgsmålet.</p>
          </div>
          <div>
            <h3>Opgavens tjek bestod</h3><p>De automatiske kontroller af opgaven bestod. Prøv nu at forklare en makker, hvorfor din løsning virker.</p>
          </div>
        </div>
        <p className="raymond-reaction-outro">Når noget driller, undersøger I det sammen. <Link to="/playground">Prøv en idé i Playground</Link> eller <Link to="/modules">find dit næste modul</Link>.</p>
      </section>
    </section>
  );
}
