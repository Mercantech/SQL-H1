import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getRaymondReaction,
  raymondReactionCategories,
  raymondReactions,
} from "../lib/raymondReactions";
import "../components/raymond/reactions.css";

export function RaymondReactions() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState("eureka");
  const selected = getRaymondReaction(selectedId);
  const selectedCategory = raymondReactionCategories.find((item) => item.id === selected.category);
  const filtered = useMemo(() => {
    const words = query.toLocaleLowerCase("da-DK").trim().split(/\s+/).filter(Boolean);
    return raymondReactions.filter((reaction) => {
      const haystack = `${reaction.label} ${reaction.description} ${reaction.id}`.toLocaleLowerCase("da-DK");
      return (category === "all" || reaction.category === category) && words.every((word) => haystack.includes(word));
    });
  }, [category, query]);

  function clearFilters() {
    setCategory("all");
    setQuery("");
  }

  return (
    <section className="page raymond-reactions-page">
      <header className="page-head">
        <p className="eyebrow">Din makker gennem SQL</p>
        <h1>Raymonds reaktioner</h1>
        <p>Et aha, et spørgsmål eller et lille skulderklap. Raymonds humør følger det, du arbejder med, og hjælper dig med at finde næste skridt.</p>
      </header>

      <div className="raymond-reaction-layout">
        <aside className="raymond-reaction-preview" aria-label="Den valgte reaktion">
          <img src={selected.src} alt="" width={512} height={512} decoding="async" />
          <div aria-live="polite" aria-atomic="true">
            <p className="eyebrow">{selectedCategory?.label} · Valgt reaktion</p>
            <h2>{selected.label}</h2>
            <p><strong>Det betyder:</strong> {selected.description}</p>
          </div>
          <p className="raymond-reaction-preview-tip">Vælg et billede og lær hans reaktioner at kende.</p>
        </aside>

        <div className="raymond-reaction-library">
          <div className="raymond-reaction-search">
            <label htmlFor="raymond-reaction-search">Find en reaktion</label>
            <input
              id="raymond-reaction-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Fx aha, JOIN eller pause"
              autoComplete="off"
              aria-controls="raymond-reaction-grid"
            />
          </div>

          <fieldset className="raymond-reaction-filters">
            <legend>Vis kategori</legend>
            <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>Alle</button>
            {raymondReactionCategories.map((item) => (
              <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>
            ))}
          </fieldset>

          <p className="raymond-reaction-count" role="status">{filtered.length} af {raymondReactions.length} reaktioner</p>

          {filtered.length > 0 ? (
            <ul className="raymond-reaction-grid" id="raymond-reaction-grid" aria-label="Vælg en Raymond-reaktion">
              {filtered.map((reaction) => (
                <li key={reaction.id}>
                  <button
                    type="button"
                    aria-pressed={selected.id === reaction.id}
                    onClick={() => setSelectedId(reaction.id)}
                    className="raymond-reaction-card"
                  >
                    <img src={reaction.src} alt="" width={512} height={512} loading="lazy" decoding="async" />
                    <span>{reaction.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="raymond-reaction-empty" id="raymond-reaction-grid">
              <img src="/raymond/reactions/curious.webp" alt="" width={88} height={88} loading="lazy" />
              <p>Ingen reaktioner passer til din søgning. Prøv et andet ord eller se hele samlingen.</p>
              <button type="button" className="btn" onClick={clearFilters}>Vis alle reaktioner</button>
            </div>
          )}
        </div>
      </div>

      <section className="raymond-reaction-meaning" aria-labelledby="raymond-feedback-heading">
        <h2 id="raymond-feedback-heading">Hvad fejrer Raymond?</h2>
        <div className="raymond-reaction-meaning-grid">
          <div>
            <img src="/raymond/reactions/success.webp" alt="" width={84} height={84} loading="lazy" />
            <div><h3>Din SQL blev kørt</h3><p>Databasen kunne udføre din forespørgsel. Undersøg stadig, om resultatet svarer på spørgsmålet.</p></div>
          </div>
          <div>
            <img src="/raymond/reactions/applause.webp" alt="" width={84} height={84} loading="lazy" />
            <div><h3>Opgavens tjek bestod</h3><p>De automatiske kontroller af opgaven bestod. Prøv nu at forklare en makker, hvorfor din løsning virker.</p></div>
          </div>
        </div>
        <p className="raymond-reaction-outro">Når noget driller, undersøger I det sammen. <Link to="/playground">Prøv en idé i Playground</Link> eller <Link to="/modules">find dit næste modul</Link>.</p>
      </section>
    </section>
  );
}
