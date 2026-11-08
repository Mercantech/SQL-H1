import { Link } from "react-router-dom";
import { RaymondAvatar } from "./RaymondUI";
import "./teaser.css";

export function ReactionTeaser() {
  return (
    <section className="reaction-teaser" aria-labelledby="reaction-teaser-title">
      <div className="reaction-teaser-intro">
        <p className="eyebrow">En lille reaktion. Et næste skridt.</p>
        <h2 id="reaction-teaser-title">Raymond følger med, når du lærer</h2>
        <p>Han finder luppen frem, når noget driller, og klapper, når opgavens tjek består.</p>
        <Link className="btn" to="/raymond">Mød alle 48 reaktioner <span aria-hidden="true">→</span></Link>
      </div>
      <ul className="reaction-teaser-examples">
        <li><RaymondAvatar reaction="debugging" size={74} /><strong>Vi undersøger det</strong><span>En fejl giver os et spor</span></li>
        <li><RaymondAvatar reaction="eureka" size={74} /><strong>Aha!</strong><span>Forklar, hvad du opdagede</span></li>
        <li><RaymondAvatar reaction="applause" size={74} /><strong>Godt arbejde</strong><span>Opgavens tjek er bestået</span></li>
      </ul>
    </section>
  );
}
