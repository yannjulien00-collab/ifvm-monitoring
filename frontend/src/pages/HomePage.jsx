import heroImage from "../../img/ifvm 1.jpeg";
import logoIfvm from "../../img/logo IFVM.jpeg";

const highlights = [
  {
    value: "01",
    title: "Clair",
    text: "Une lecture immediate.",
  },
  {
    value: "02",
    title: "Solide",
    text: "Un produit plus credible.",
  },
  {
    value: "03",
    title: "Premium",
    text: "Une presence plus luxueuse.",
  },
];

const quickStats = [
  { value: "3", label: "Profils metier" },
  { value: "24/7", label: "Suivi continu" },
  { value: "1", label: "Plateforme claire" },
];

export default function HomePage({ onEnter }) {
  return (
    <div className="landing-page">
      <img src={heroImage} alt="Vue IFVM" className="landing-photo" />
      <div className="landing-backdrop" />

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">IFVM</span>
          <h1>La plateforme de pilotage terrain qui inspire confiance.</h1>
          <p>
            Surveillance, decision et action dans une experience plus noble, plus simple et plus
            memorisable.
          </p>

          <div className="landing-actions">
            <button type="button" className="primary-button landing-enter" onClick={onEnter}>
              Ouvrir la plateforme
            </button>
          </div>

          <div className="landing-stat-row">
            {quickStats.map((item) => (
              <article key={item.label} className="landing-stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="landing-hero-logo">
          <img src={logoIfvm} alt="Logo IFVM" className="landing-hero-logo-image" />
        </div>
      </section>

      <section className="landing-grid">
        {highlights.map((item) => (
          <article key={item.title} className="landing-card">
            <span className="landing-card-value">{item.value}</span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
