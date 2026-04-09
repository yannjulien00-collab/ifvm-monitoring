const toneIconMap = {
  blue: "01",
  green: "02",
  amber: "03",
  purple: "04",
};

export default function SummaryCard({ label, tone, value, detail = "Vue instantanee" }) {
  return (
    <article className={`summary-card tone-${tone}`}>
      <div className="summary-topline">
        <p>{label}</p>
        <span className="summary-icon">{toneIconMap[tone] ?? "00"}</span>
      </div>
      <strong>{value}</strong>
      {detail ? <span className="summary-caption">{detail}</span> : null}
    </article>
  );
}
