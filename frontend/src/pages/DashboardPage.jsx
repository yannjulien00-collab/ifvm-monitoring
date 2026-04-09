
import { useEffect, useMemo, useState } from "react";
import ObservationMap from "../components/ObservationMap";
import SummaryCard from "../components/SummaryCard";
import heroImage from "../../img/ifvm 1.jpeg";
import logoIfvm from "../../img/logo IFVM.jpeg";
import {
  createIntervention,
  createUser,
  deleteUser,
  getSystemSettings,
  updateUser,
  updateObservation,
  updateSystemSettings,
} from "../services/api";

const zoneOptions = ["Toutes", "Nord", "Sud", "Est", "Ouest"];
const validationOptions = ["Toutes", "en_attente", "validee", "refusee"];
const initialAdminUserForm = {
  id_utilisateur: null,
  nom: "",
  email: "",
  mot_de_passe: "",
  role: "Agent",
  statut_compte: "actif",
  email_verifie: true,
};

function formatDate(value) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadFile(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function exportRows(fileName, rows) {
  const csv = rows.map((row) => row.map((value) => escapeCsv(value)).join(",")).join("\n");
  downloadFile(csv, fileName, "text/csv;charset=utf-8");
}

function navLabel(navItems, activeNav) {
  return navItems.find((item) => item.id === activeNav)?.label ?? "Tableau de bord";
}

function navHint(navItems, activeNav) {
  return navItems.find((item) => item.id === activeNav)?.hint ?? "Pilotage";
}

function severityClass(value) {
  if (value === "critique") return "status-critical";
  if (value === "eleve") return "status-high";
  if (value === "moyen" || value === "modere") return "status-medium";
  if (value === "faible") return "status-low";
  return "";
}

function Shell({ title, subtitle, navItems, activeNav, onNavChange, onLogout, onToggleTheme, theme, children }) {
  return (
    <div className={`dashboard-app dashboard-theme-${theme}`}>
      <img src={heroImage} alt="Fond IFVM" className="dashboard-background-image" />
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src={logoIfvm} alt="Logo IFVM" className="sidebar-logo-image" />
          </div>
          <div className="sidebar-brand-copy">
            <strong>IFVM</strong>
            <span>Monitoring & Operations</span>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item${activeNav === item.id ? " active" : ""}`}
              onClick={() => onNavChange(item.id)}
            >
              <span className="nav-dot" />
              <span className="nav-copy">
                <strong>{item.label}</strong>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-button" onClick={onLogout}>
            Deconnexion
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-copy">
            <div className="topbar-heading-row">
              <h1>{title}</h1>
            </div>
            <p>{subtitle || navLabel(navItems, activeNav)}</p>
          </div>
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            {theme === "light" ? "Mode sombre" : "Mode clair"}
          </button>
        </header>

        {children}
      </main>
    </div>
  );
}

function Panel({ title, eyebrow, action, children, className = "" }) {
  return (
    <section className={`dashboard-panel ${className}`.trim()}>
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyPanel({ title, eyebrow, message }) {
  return (
    <Panel title={title} eyebrow={eyebrow}>
      <p className="empty-state">{message}</p>
    </Panel>
  );
}

function ObservationMapCard({ observations }) {
  return (
    <Panel title="Carte des zones" eyebrow="Visualisation" className="map-panel" action={<span className="panel-tag">Lecture rapide</span>}>
      <ObservationMap observations={observations} />
    </Panel>
  );
}

function ZoneImpactPanel({ observations }) {
  const zoneSummary = zoneOptions.slice(1).map((zone) => {
    const items = observations.filter((item) => item.zone === zone);
    const maxDensity = items.length ? Math.max(...items.map((item) => Number(item.densite) || 0)) : 0;
    let gravity = "Faible";

    if (maxDensity >= 50) gravity = "Critique";
    else if (maxDensity >= 30) gravity = "Moyen";

    return { zone, total: items.length, gravity };
  });

  return (
    <Panel title="Zones touchées" action={<span className="panel-tag">Vue synthèse</span>}>
      <div className="zone-impact-grid">
        {zoneSummary.map((item) => (
          <article key={item.zone} className="zone-impact-card">
            <div className="zone-impact-top">
              <strong>{item.zone}</strong>
              <span className={`status-pill ${severityClass(item.gravity.toLowerCase())}`}>{item.gravity}</span>
            </div>
            <p>{item.total} observation(s)</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function AdminRoleOverviewPanel({ users }) {
  const roles = [
    { label: "Admins", value: users.filter((item) => item.role === "Admin").length, gravity: "Moyen" },
    { label: "Superviseurs", value: users.filter((item) => item.role === "Superviseur").length, gravity: "Faible" },
    { label: "Agents", value: users.filter((item) => item.role === "Agent").length, gravity: "Faible" },
    { label: "Comptes inactifs", value: users.filter((item) => item.statut_compte === "inactif").length, gravity: users.some((item) => item.statut_compte === "inactif") ? "Critique" : "Faible" },
  ];

  return (
    <Panel title="Pilotage des comptes" action={<span className="panel-tag">Vue synthèse</span>}>
      <div className="admin-overview-grid">
        {roles.map((item) => (
          <article key={item.label} className="admin-overview-card">
            <div className="admin-overview-top">
              <strong>{item.label}</strong>
              <span className={`status-pill ${severityClass(item.gravity.toLowerCase())}`}>{item.gravity}</span>
            </div>
            <p>{item.value}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function AdminSystemSnapshotPanel({ settings, users, alerts, interventions }) {
  const verifiedUsers = users.filter((item) => Number(item.email_verifie) === 1).length;

  return (
    <Panel title="Santé du système" action={<span className="panel-tag">Configuration</span>}>
      <div className="admin-overview-grid">
        <article className="admin-overview-card">
          <div className="admin-overview-top">
            <strong>Seuil critique</strong>
            <span className="status-pill status-critical">Actif</span>
          </div>
          <p>{settings.alert_threshold_critical}</p>
        </article>
        <article className="admin-overview-card">
          <div className="admin-overview-top">
            <strong>Seuil moyen</strong>
            <span className="status-pill status-medium">Actif</span>
          </div>
          <p>{settings.alert_threshold_medium}</p>
        </article>
        <article className="admin-overview-card">
          <div className="admin-overview-top">
            <strong>Emails vérifiés</strong>
            <span className="status-pill status-low">Suivi</span>
          </div>
          <p>{verifiedUsers} / {users.length}</p>
        </article>
        <article className="admin-overview-card">
          <div className="admin-overview-top">
            <strong>Interventions planifiées</strong>
            <span className={`status-pill ${interventions.length ? "status-medium" : "status-low"}`}>{interventions.length ? "En cours" : "Calme"}</span>
          </div>
          <p>{alerts.filter((item) => item.niveau === "critique").length} critique(s)</p>
        </article>
      </div>
    </Panel>
  );
}

function SupervisorZonePressurePanel({ observations }) {
  const zoneSummary = zoneOptions.slice(1).map((zone) => {
    const items = observations.filter((item) => item.zone === zone);
    const maxDensity = items.length ? Math.max(...items.map((item) => Number(item.densite) || 0)) : 0;
    let gravity = "Faible";

    if (maxDensity >= 50) gravity = "Critique";
    else if (maxDensity >= 30) gravity = "Moyen";

    return { zone, total: items.length, gravity };
  });

  return (
    <Panel title="Zones sous pression" action={<span className="panel-tag">Vue terrain</span>}>
      <div className="zone-impact-grid">
        {zoneSummary.map((item) => (
          <article key={item.zone} className="zone-impact-card">
            <div className="zone-impact-top">
              <strong>{item.zone}</strong>
              <span className={`status-pill ${severityClass(item.gravity.toLowerCase())}`}>{item.gravity}</span>
            </div>
            <p>{item.total} observation(s)</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function SupervisorValidationSnapshotPanel({ observations, alerts, interventions }) {
  const pending = observations.filter((item) => item.statut_validation === "en_attente").length;
  const refused = observations.filter((item) => item.statut_validation === "refusee").length;
  const critical = alerts.filter((item) => item.niveau === "critique").length;

  return (
    <Panel title="Vue de supervision" action={<span className="panel-tag">Décision</span>}>
      <div className="admin-overview-grid">
        <article className="admin-overview-card">
          <div className="admin-overview-top">
            <strong>En attente</strong>
            <span className={`status-pill ${pending ? "status-medium" : "status-low"}`}>{pending ? "Action" : "Stable"}</span>
          </div>
          <p>{pending}</p>
        </article>
        <article className="admin-overview-card">
          <div className="admin-overview-top">
            <strong>Refusées</strong>
            <span className={`status-pill ${refused ? "status-high" : "status-low"}`}>{refused ? "Contrôle" : "RAS"}</span>
          </div>
          <p>{refused}</p>
        </article>
        <article className="admin-overview-card">
          <div className="admin-overview-top">
            <strong>Alertes critiques</strong>
            <span className={`status-pill ${critical ? "status-critical" : "status-low"}`}>{critical ? "Urgent" : "Calme"}</span>
          </div>
          <p>{critical}</p>
        </article>
        <article className="admin-overview-card">
          <div className="admin-overview-top">
            <strong>Interventions</strong>
            <span className={`status-pill ${interventions.length ? "status-medium" : "status-low"}`}>{interventions.length ? "Suivi" : "Vide"}</span>
          </div>
          <p>{interventions.length}</p>
        </article>
      </div>
    </Panel>
  );
}

function ObservationList({ observations, onEditObservation, onDeleteObservation, editable = false }) {
  if (!observations.length) {
    return <p className="empty-state">Aucune donnée disponible pour cette section.</p>;
  }

  return (
    <div className={`stack-list${editable ? " observation-scroll-list" : ""}`}>
      {observations.map((observation) => (
        <article key={observation.id_observation} className="list-card">
          <div className="list-card-main">
            <div className="list-card-header">
              <strong>{observation.zone} - {observation.type_criquet}</strong>
              <span className="status-pill subtle">{observation.statut_validation ?? "terrain"}</span>
            </div>
            <p>Densité {observation.densite} · {formatDate(observation.date_observation)}</p>
            <span>{observation.commentaire || "Sans commentaire"}</span>
          </div>
          {editable ? (
            <div className="inline-actions">
              <button type="button" className="ghost-button" onClick={() => onEditObservation(observation)}>
                Modifier
              </button>
              <button type="button" className="ghost-button danger" onClick={() => onDeleteObservation(observation.id_observation)}>
                Supprimer
              </button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function AlertList({ alerts, emptyMessage = "Aucune alerte pour le moment." }) {
  if (!alerts.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="stack-list limited-scroll-list">
      {alerts.map((alert, index) => (
        <article key={alert.id_alerte ?? `${alert.observation_id}-${index}`} className="list-card">
          <div className="list-card-main">
            <div className="list-card-header">
              <strong>{alert.niveau ? `Alerte ${alert.niveau}` : "Alerte terrain"}</strong>
              <span className={`status-pill ${severityClass(alert.niveau)}`.trim()}>{alert.niveau ?? "surveillance"}</span>
            </div>
            <p>Observation #{alert.observation_id ?? "n/a"} · {alert.zone ?? "Zone non renseignée"}</p>
            <span>Créée le {formatDate(alert.date_alerte ?? alert.created_at)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function InterventionList({ interventions, emptyMessage = "Aucune intervention enregistrée." }) {
  if (!interventions.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="stack-list limited-scroll-list">
      {interventions.map((item, index) => (
        <article key={item.id_intervention ?? `${item.zone}-${index}`} className="list-card">
          <div className="list-card-main">
            <div className="list-card-header">
              <strong>{item.zone ?? "Zone non renseignée"}</strong>
              <span className="status-pill subtle">Operation</span>
            </div>
            <p>{formatDate(item.date_intervention)}</p>
            <span>{item.action || "Aucune action détaillée"}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function UserProfilePanel({ user, onRefreshCurrentUser }) {
  const [form, setForm] = useState({
    nom: user.nom ?? "",
    email: user.email ?? "",
    numero_telephone: user.numero_telephone ?? "",
    zone_affectation: user.zone_affectation ?? "",
    adresse_postale: user.adresse_postale ?? "",
    lieu_travail: user.lieu_travail ?? "",
    photo_profil_path: user.photo_profil_path ?? "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      nom: user.nom ?? "",
      email: user.email ?? "",
      numero_telephone: user.numero_telephone ?? "",
      zone_affectation: user.zone_affectation ?? "",
      adresse_postale: user.adresse_postale ?? "",
      lieu_travail: user.lieu_travail ?? "",
      photo_profil_path: user.photo_profil_path ?? "",
    });
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await updateUser(user.id_utilisateur, form);
      setMessage(response.message);
      if (onRefreshCurrentUser) {
        await onRefreshCurrentUser();
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoImport(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        photo_profil_path: typeof reader.result === "string" ? reader.result : current.photo_profil_path,
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <Panel title="Mon profil" action={<span className="panel-tag">Profil agent</span>}>
      <form className="glass-form profile-form" onSubmit={handleSubmit}>
        <div className="profile-hero">
          <div className="profile-avatar">
            {form.photo_profil_path ? (
              <img src={form.photo_profil_path} alt="Photo profil" className="profile-avatar-image" />
            ) : (
              <span>{(form.nom || "A").slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="profile-hero-copy">
            <strong>{form.nom || "Agent IFVM"}</strong>
            <span>{user.role}</span>
          </div>
        </div>

        <div className="field-grid two">
          <label><span>Nom complet</span><input value={form.nom} onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))} /></label>
          <label><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
        </div>
        <div className="field-grid two">
          <label><span>Telephone</span><input value={form.numero_telephone} onChange={(event) => setForm((current) => ({ ...current, numero_telephone: event.target.value }))} placeholder="+261..." /></label>
          <label><span>Zone d'affectation</span><select value={form.zone_affectation} onChange={(event) => setForm((current) => ({ ...current, zone_affectation: event.target.value }))}><option value="">Selectionner</option>{zoneOptions.slice(1).map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
        </div>
        <div className="field-grid two">
          <label><span>Lieu de travail</span><input value={form.lieu_travail} onChange={(event) => setForm((current) => ({ ...current, lieu_travail: event.target.value }))} placeholder="Base IFVM, antenne, district..." /></label>
          <label>
            <span>Photo de profil</span>
            <div className="profile-photo-actions">
              <input value={form.photo_profil_path} onChange={(event) => setForm((current) => ({ ...current, photo_profil_path: event.target.value }))} placeholder="Lien ou chemin de photo" />
              <label className="secondary-button profile-import-button">
                Importer
                <input type="file" accept="image/*" className="profile-file-input" onChange={handlePhotoImport} />
              </label>
            </div>
          </label>
        </div>
        <label><span>Adresse</span><textarea rows="4" value={form.adresse_postale} onChange={(event) => setForm((current) => ({ ...current, adresse_postale: event.target.value }))} placeholder="Adresse du domicile ou de residence" /></label>
        {error ? <p className="error-banner">{error}</p> : null}
        {message ? <p className="success-banner">{message}</p> : null}
        <div className="inline-actions">
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer le profil"}</button>
        </div>
      </form>
    </Panel>
  );
}

function QuickStats({ items }) {
  return <section className="kpi-grid">{items}</section>;
}
function AgentDashboard({ data, loading, observationError, observationForm, observationMessage, onCancelObservationEdit, onDeleteObservation, onEditObservation, onLogout, onObservationChange, onRefreshCurrentUser, onSaveObservation, onToggleTheme, savingObservation, theme, user }) {
  const navItems = [
    { id: "dashboard", label: "Tableau de bord", hint: "" },
    { id: "observations", label: "Mes observations", hint: "" },
    { id: "add", label: "Ajouter", hint: "" },
    { id: "map", label: "Carte", hint: "" },
    { id: "alerts", label: "Alertes", hint: "" },
    { id: "profile", label: "Mon profil", hint: "" },
  ];
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedZone, setSelectedZone] = useState("Toutes");
  const [searchTerm, setSearchTerm] = useState("");
  const observations = data.observations.filter((item) => Number(item.utilisateur_id) === Number(user.id_utilisateur));
  const alerts = data.alertes.filter((alerte) => observations.some((item) => Number(item.id_observation) === Number(alerte.observation_id)));
  const filtered = observations.filter((item) => {
    const zoneOk = selectedZone === "Toutes" || item.zone === selectedZone;
    const searchOk = `${item.type_criquet} ${item.commentaire ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase());
    return zoneOk && searchOk;
  });

  const stats = (
    <QuickStats
      items={[
        <SummaryCard key="obs" label="Observations" value={observations.length} tone="blue" detail="" />,
        <SummaryCard key="alerts" label="Alertes" value={alerts.length} tone="green" detail="" />,
        <SummaryCard key="zones" label="Zones" value={new Set(observations.map((item) => item.zone)).size} tone="amber" detail="" />,
        <SummaryCard key="int" label="Interventions" value={data.interventions.length} tone="purple" detail="" />,
      ]}
    />
  );

  const observationPanel = (
    <Panel title="Mes observations">
      <div className="toolbar-row compact observation-toolbar">
        <select value={selectedZone} onChange={(event) => setSelectedZone(event.target.value)}>
          {zoneOptions.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
        </select>
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Filtrer" />
      </div>
      {loading ? <p className="empty-state dark">Chargement...</p> : <ObservationList observations={filtered} onEditObservation={onEditObservation} onDeleteObservation={onDeleteObservation} editable />}
    </Panel>
  );

  const addObservationPanel = (
    <Panel title="Ajouter une observation" className="wide-panel">
      <form className="glass-form" onSubmit={onSaveObservation}>
        <div className="field-grid two">
          <label><span>Zone</span><select value={observationForm.zone} onChange={(event) => onObservationChange({ ...observationForm, zone: event.target.value })}>{zoneOptions.slice(1).map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
          <label><span>Type</span><input value={observationForm.type_criquet} onChange={(event) => onObservationChange({ ...observationForm, type_criquet: event.target.value })} /></label>
        </div>
        <div className="field-grid two">
          <label><span>Latitude</span><input type="number" step="0.000001" value={observationForm.latitude} onChange={(event) => onObservationChange({ ...observationForm, latitude: event.target.value })} /></label>
          <label><span>Longitude</span><input type="number" step="0.000001" value={observationForm.longitude} onChange={(event) => onObservationChange({ ...observationForm, longitude: event.target.value })} /></label>
        </div>
        <div className="field-grid two">
          <label><span>Densité</span><input type="number" min="0" value={observationForm.densite} onChange={(event) => onObservationChange({ ...observationForm, densite: event.target.value })} /></label>
          <label><span>Photo</span><input value={observationForm.photo_path} onChange={(event) => onObservationChange({ ...observationForm, photo_path: event.target.value })} /></label>
        </div>
        <label><span>Commentaire</span><textarea rows="4" value={observationForm.commentaire} onChange={(event) => onObservationChange({ ...observationForm, commentaire: event.target.value })} /></label>
        {observationError ? <p className="error-banner">{observationError}</p> : null}
        {observationMessage ? <p className="success-banner">{observationMessage}</p> : null}
        <div className="inline-actions">
          <button type="submit" className="primary-button" disabled={savingObservation}>{savingObservation ? "Enregistrement..." : observationForm.id_observation ? "Mettre à jour" : "Ajouter"}</button>
          {observationForm.id_observation ? <button type="button" className="secondary-button" onClick={onCancelObservationEdit}>Annuler</button> : null}
        </div>
      </form>
    </Panel>
  );

  let content;
  if (activeNav === "observations") content = <section className="content-columns dashboard-grid-agent dashboard-grid-agent-full">{observationPanel}</section>;
  else if (activeNav === "add") content = <section className="content-columns dashboard-grid-agent dashboard-grid-agent-full">{addObservationPanel}</section>;
  else if (activeNav === "map") content = <section className="content-columns dashboard-grid-agent dashboard-grid-agent-full"><ObservationMapCard observations={observations} /></section>;
  else if (activeNav === "alerts") content = <section className="content-columns dashboard-grid-agent dashboard-grid-agent-full"><Panel title="Alertes liées à mes observations" eyebrow="Surveillance"><AlertList alerts={alerts} emptyMessage="Aucune alerte générée à partir de vos remontées." /></Panel></section>;
  else if (activeNav === "profile") content = <section className="content-columns dashboard-grid-agent dashboard-grid-agent-full"><UserProfilePanel user={user} onRefreshCurrentUser={onRefreshCurrentUser} /></section>;
  else content = <><section>{stats}</section><section className="content-columns dashboard-grid-agent"><ObservationMapCard observations={observations} /><ZoneImpactPanel observations={observations} /></section></>;

  return (
    <Shell title={`Bonsoir, ${user.nom}`} subtitle="Tableau de bord" navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onLogout={onLogout} onToggleTheme={onToggleTheme} theme={theme}>
      {content}
    </Shell>
  );
}

function SupervisorDashboard({ data, loading, onLogout, onRefresh, onToggleTheme, theme, user }) {
  const navItems = [
    { id: "dashboard", label: "Tableau de bord", hint: "" },
    { id: "observations", label: "Observations", hint: "" },
    { id: "alerts", label: "Alertes", hint: "" },
    { id: "interventions", label: "Interventions", hint: "" },
    { id: "reports", label: "Rapports", hint: "" },
    { id: "validation", label: "Validation", hint: "" },
  ];
  const [activeNav, setActiveNav] = useState("dashboard");
  const [filters, setFilters] = useState({ zone: "Toutes", validation: "Toutes", density: "Toutes", search: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [interventionForm, setInterventionForm] = useState({ zone: "Nord", date_intervention: "", action: "" });

  const observations = useMemo(() => data.observations.filter((item) => {
    const zoneOk = filters.zone === "Toutes" || item.zone === filters.zone;
    const validationOk = filters.validation === "Toutes" || item.statut_validation === filters.validation;
    const densityOk = filters.density === "Toutes" ? true : filters.density === "critique" ? Number(item.densite) >= 50 : filters.density === "moyenne" ? Number(item.densite) >= 25 && Number(item.densite) < 50 : Number(item.densite) < 25;
    const searchOk = `${item.utilisateur_nom} ${item.type_criquet} ${item.commentaire ?? ""}`.toLowerCase().includes(filters.search.toLowerCase());
    return zoneOk && validationOk && densityOk && searchOk;
  }), [data.observations, filters]);

  const criticalAlerts = data.alertes.filter((item) => item.niveau === "critique");
  const validationQueue = useMemo(() => {
    const priority = { en_attente: 0, refusee: 1, validee: 2 };
    const severity = { critique: 0, moyen: 1, modere: 1, faible: 2 };

    return [...observations].sort((left, right) => {
      const leftStatus = priority[left.statut_validation] ?? 9;
      const rightStatus = priority[right.statut_validation] ?? 9;
      if (leftStatus !== rightStatus) return leftStatus - rightStatus;

      const leftSeverity = severity[left.niveau_alerte] ?? 9;
      const rightSeverity = severity[right.niveau_alerte] ?? 9;
      if (leftSeverity !== rightSeverity) return leftSeverity - rightSeverity;

      return Number(right.densite || 0) - Number(left.densite || 0);
    });
  }, [observations]);

  async function handleValidation(id, statut_validation) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await updateObservation(id, { statut_validation });
      setMessage(response.message);
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function handleCreateIntervention(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await createIntervention(interventionForm);
      setMessage(response.message);
      setInterventionForm({ zone: "Nord", date_intervention: "", action: "" });
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const filterPanel = (
    <Panel title="Filtres" className="wide-panel">
      <div className="toolbar-row toolbar-row-wide">
        <select value={filters.zone} onChange={(event) => setFilters((current) => ({ ...current, zone: event.target.value }))}>{zoneOptions.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select>
        <select value={filters.validation} onChange={(event) => setFilters((current) => ({ ...current, validation: event.target.value }))}>{validationOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select>
        <select value={filters.density} onChange={(event) => setFilters((current) => ({ ...current, density: event.target.value }))}><option value="Toutes">Toutes densités</option><option value="critique">Critique</option><option value="moyenne">Moyenne</option><option value="faible">Faible</option></select>
        <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Agent, type, commentaire" />
        <button type="button" className="secondary-button" onClick={() => exportRows("rapport-superviseur.csv", [["ID", "Zone", "Agent", "Type", "Densité", "Validation"], ...observations.map((item) => [item.id_observation, item.zone, item.utilisateur_nom, item.type_criquet, item.densite, item.statut_validation])])}>Exporter</button>
      </div>
    </Panel>
  );

  const validationPanel = (
    <Panel title="Observations à valider">
      <div className="validation-summary-row">
        <span className="status-pill status-medium">En attente · {validationQueue.filter((item) => item.statut_validation === "en_attente").length}</span>
        <span className="status-pill status-critical">Critiques · {validationQueue.filter((item) => item.niveau_alerte === "critique").length}</span>
        <span className="status-pill subtle">Affichées · {validationQueue.length}</span>
      </div>
      {loading ? <p className="empty-state dark">Chargement...</p> : (
        <div className="stack-list limited-scroll-list">
          {validationQueue.length ? validationQueue.map((observation) => (
            <article key={observation.id_observation} className="list-card validation-card">
              <div className="list-card-main">
                <div className="list-card-header">
                  <strong>{observation.utilisateur_nom} - {observation.zone}</strong>
                  <span className={`status-pill ${severityClass(observation.niveau_alerte)}`.trim()}>{observation.niveau_alerte ?? "surveillance"}</span>
                </div>
                <p>{observation.type_criquet} · densité {observation.densite} · {formatDate(observation.date_observation)}</p>
                <span>Validation : {observation.statut_validation}</span>
                <span>{observation.commentaire || "Sans commentaire"}</span>
              </div>
              <div className="inline-actions">
                <button
                  type="button"
                  className={`ghost-button${observation.statut_validation === "validee" ? " danger" : ""}`}
                  disabled={saving}
                  onClick={() => handleValidation(
                    observation.id_observation,
                    observation.statut_validation === "validee" ? "refusee" : "validee"
                  )}
                >
                  {observation.statut_validation === "validee" ? "Refuser" : "Valider"}
                </button>
              </div>
            </article>
          )) : <p className="empty-state">Aucune observation ne correspond aux filtres.</p>}
        </div>
      )}
    </Panel>
  );

  const interventionPanel = (
    <Panel title="Planifier une intervention">
      <form className="glass-form" onSubmit={handleCreateIntervention}>
        <label><span>Zone</span><select value={interventionForm.zone} onChange={(event) => setInterventionForm((current) => ({ ...current, zone: event.target.value }))}>{zoneOptions.slice(1).map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
        <label><span>Date</span><input type="datetime-local" onChange={(event) => setInterventionForm((current) => ({ ...current, date_intervention: event.target.value.replace("T", " ") + ":00" }))} /></label>
        <label><span>Action</span><textarea rows="4" value={interventionForm.action} onChange={(event) => setInterventionForm((current) => ({ ...current, action: event.target.value }))} /></label>
        <button type="submit" className="primary-button" disabled={saving}>Créer l'intervention</button>
      </form>
    </Panel>
  );

  const stats = (
    <QuickStats items={[
      <SummaryCard key="obs" label="Observations" value={data.observations.length} tone="blue" detail="" />,
      <SummaryCard key="pending" label="En attente" value={data.observations.filter((item) => item.statut_validation === "en_attente").length} tone="green" detail="" />,
      <SummaryCard key="critical" label="Critiques" value={criticalAlerts.length} tone="amber" detail="" />,
      <SummaryCard key="interventions" label="Interventions" value={data.interventions.length} tone="purple" detail="" />,
    ]} />
  );

  let content;
  if (activeNav === "observations") content = <section className="content-columns dashboard-grid-supervisor dashboard-grid-supervisor-full">{filterPanel}{validationPanel}</section>;
  else if (activeNav === "alerts") content = <section className="content-columns dashboard-grid-supervisor"><Panel title="Alertes critiques"><AlertList alerts={criticalAlerts} emptyMessage="Aucune alerte critique pour le moment." /></Panel></section>;
  else if (activeNav === "interventions") content = <section className="content-columns dashboard-grid-supervisor">{interventionPanel}<Panel title="Interventions enregistrées"><InterventionList interventions={data.interventions} /></Panel></section>;
  else if (activeNav === "reports") content = <section className="content-columns dashboard-grid-supervisor">{filterPanel}<EmptyPanel title="Rapports" message="Utilisez les filtres puis exportez." /></section>;
  else if (activeNav === "validation") content = <section className="content-columns dashboard-grid-supervisor dashboard-grid-supervisor-full">{filterPanel}{validationPanel}</section>;
  else content = <><section>{stats}</section>{error ? <p className="error-banner">{error}</p> : null}{message ? <p className="success-banner">{message}</p> : null}<section className="content-columns dashboard-grid-supervisor"><SupervisorZonePressurePanel observations={data.observations} /><SupervisorValidationSnapshotPanel observations={data.observations} alerts={data.alertes} interventions={data.interventions} /></section></>;

  return (
    <Shell title={`Bonsoir, ${user.nom}`} subtitle="Tableau de bord" navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onLogout={onLogout} onToggleTheme={onToggleTheme} theme={theme}>
      {content}
    </Shell>
  );
}

function AdminDashboard({ data, loading, onLogout, onRefresh, onToggleTheme, theme, user }) {
  const navItems = [
    { id: "dashboard", label: "Tableau de bord", hint: "" },
    { id: "users", label: "Utilisateurs", hint: "" },
    { id: "access", label: "Accès", hint: "" },
    { id: "alerts", label: "Alertes", hint: "" },
    { id: "interventions", label: "Interventions", hint: "" },
    { id: "settings", label: "Paramètres", hint: "" },
  ];
  const [activeNav, setActiveNav] = useState("dashboard");
  const [settings, setSettings] = useState({ alert_threshold_critical: "50", alert_threshold_medium: "30" });
  const [userForm, setUserForm] = useState(initialAdminUserForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const response = await getSystemSettings();
        if (!active) return;
        const map = Object.fromEntries((response.data ?? []).map((item) => [item.cle_parametre, item.valeur_parametre]));
        setSettings({
          alert_threshold_critical: map.alert_threshold_critical ?? "50",
          alert_threshold_medium: map.alert_threshold_medium ?? "30",
        });
      } catch (e) {
        if (active) setError(e.message);
      }
    }
    loadSettings();
    return () => {
      active = false;
    };
  }, []);
  async function handleSaveUser(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        nom: userForm.nom,
        email: userForm.email,
        role: userForm.role,
        statut_compte: userForm.statut_compte,
        email_verifie: userForm.email_verifie,
        ...(userForm.mot_de_passe ? { mot_de_passe: userForm.mot_de_passe } : {}),
      };
      const response = userForm.id_utilisateur
        ? await updateUser(userForm.id_utilisateur, payload)
        : await createUser({ ...payload, mot_de_passe: userForm.mot_de_passe || "Password123!" });
      setMessage(response.message);
      setUserForm(initialAdminUserForm);
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(id) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await deleteUser(id);
      setMessage(response.message);
      if (userForm.id_utilisateur === id) setUserForm(initialAdminUserForm);
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await updateSystemSettings(settings);
      setMessage(response.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const userFormPanel = (
    <Panel title="Gestion des utilisateurs" className="wide-panel">
      <form className="glass-form" onSubmit={handleSaveUser}>
        <div className="field-grid two">
          <label><span>Nom</span><input value={userForm.nom} onChange={(event) => setUserForm((current) => ({ ...current, nom: event.target.value }))} /></label>
          <label><span>Email</span><input type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} /></label>
        </div>
        <div className="field-grid two">
          <label><span>Mot de passe</span><input value={userForm.mot_de_passe} onChange={(event) => setUserForm((current) => ({ ...current, mot_de_passe: event.target.value }))} placeholder={userForm.id_utilisateur ? "Laisser vide pour conserver" : "Obligatoire"} /></label>
          <label><span>Rôle</span><select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}><option value="Admin">Admin</option><option value="Superviseur">Superviseur</option><option value="Agent">Agent</option></select></label>
        </div>
        <div className="field-grid two">
          <label><span>Statut</span><select value={userForm.statut_compte} onChange={(event) => setUserForm((current) => ({ ...current, statut_compte: event.target.value }))}><option value="actif">Actif</option><option value="inactif">Inactif</option></select></label>
          <label><span>Email vérifié</span><select value={userForm.email_verifie ? "1" : "0"} onChange={(event) => setUserForm((current) => ({ ...current, email_verifie: event.target.value === "1" }))}><option value="1">Oui</option><option value="0">Non</option></select></label>
        </div>
        <div className="inline-actions">
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Enregistrement..." : userForm.id_utilisateur ? "Mettre à jour" : "Créer un compte"}</button>
          {userForm.id_utilisateur ? <button type="button" className="secondary-button" onClick={() => setUserForm(initialAdminUserForm)}>Annuler</button> : null}
        </div>
      </form>
    </Panel>
  );

  const settingsPanel = (
    <Panel title="Paramètres système">
      <form className="glass-form" onSubmit={handleSaveSettings}>
        <label><span>Seuil critique</span><input type="number" min="0" value={settings.alert_threshold_critical} onChange={(event) => setSettings((current) => ({ ...current, alert_threshold_critical: event.target.value }))} /></label>
        <label><span>Seuil moyen</span><input type="number" min="0" value={settings.alert_threshold_medium} onChange={(event) => setSettings((current) => ({ ...current, alert_threshold_medium: event.target.value }))} /></label>
        <button type="submit" className="primary-button" disabled={saving}>Enregistrer</button>
      </form>
    </Panel>
  );

  const activeUsersPanel = (
    <Panel title="Utilisateurs actifs">
      {loading ? <p className="empty-state dark">Chargement...</p> : (
        <div className="stack-list">
          {data.utilisateurs.length ? data.utilisateurs.map((item) => (
            <article key={item.id_utilisateur} className="list-card">
              <div className="list-card-main">
                <div className="list-card-header">
                  <strong>{item.nom}</strong>
                </div>
                <p>{item.email}</p>
                <span>{item.role} · {item.statut_compte ?? "actif"}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="ghost-button" onClick={() => setUserForm({
                  id_utilisateur: item.id_utilisateur,
                  nom: item.nom,
                  email: item.email,
                  mot_de_passe: "",
                  role: item.role,
                  statut_compte: item.statut_compte ?? "actif",
                  email_verifie: Boolean(Number(item.email_verifie ?? 0)),
                })}>Modifier</button>
                <button type="button" className="ghost-button danger" onClick={() => handleDeleteUser(item.id_utilisateur)}>Supprimer</button>
              </div>
            </article>
          )) : <p className="empty-state">Aucun utilisateur disponible.</p>}
        </div>
      )}
    </Panel>
  );

  const stats = (
    <QuickStats items={[
      <SummaryCard key="users" label="Utilisateurs" value={data.utilisateurs.length} tone="blue" detail="" />,
      <SummaryCard key="agents" label="Agents" value={data.utilisateurs.filter((item) => item.role === "Agent").length} tone="green" detail="" />,
      <SummaryCard key="sup" label="Superviseurs" value={data.utilisateurs.filter((item) => item.role === "Superviseur").length} tone="amber" detail="" />,
      <SummaryCard key="alerts" label="Critiques" value={data.alertes.filter((item) => item.niveau === "critique").length} tone="purple" detail="" />,
    ]} />
  );

  let content;
  if (activeNav === "users") content = <section className="content-columns dashboard-grid-admin">{userFormPanel}{activeUsersPanel}</section>;
  else if (activeNav === "access") content = <section className="content-columns dashboard-grid-admin"><Panel title="Accès et rôles"><div className="stack-list">{data.utilisateurs.map((item) => <article key={item.id_utilisateur} className="list-card"><div><strong>{item.nom}</strong><p>{item.email}</p><span>Rôle : {item.role}</span></div><span className="status-pill">{item.statut_compte ?? "actif"}</span></article>)}</div></Panel></section>;
  else if (activeNav === "alerts") content = <section className="content-columns dashboard-grid-admin"><Panel title="Alertes critiques"><AlertList alerts={data.alertes.filter((item) => item.niveau === "critique")} emptyMessage="Aucune alerte critique à signaler." /></Panel></section>;
  else if (activeNav === "interventions") content = <section className="content-columns dashboard-grid-admin"><Panel title="Interventions"><InterventionList interventions={data.interventions} /></Panel></section>;
  else if (activeNav === "settings") content = <section className="content-columns dashboard-grid-admin">{settingsPanel}<UserProfilePanel user={user} /></section>;
  else content = <><section>{stats}</section>{error ? <p className="error-banner">{error}</p> : null}{message ? <p className="success-banner">{message}</p> : null}<section className="content-columns dashboard-grid-admin"><AdminRoleOverviewPanel users={data.utilisateurs} /><AdminSystemSnapshotPanel settings={settings} users={data.utilisateurs} alerts={data.alertes} interventions={data.interventions} /></section></>;

  return (
    <Shell title={`Bonsoir, ${user.nom}`} subtitle="Tableau de bord" navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onLogout={onLogout} onToggleTheme={onToggleTheme} theme={theme}>
      {content}
    </Shell>
  );
}

export default function DashboardPage(props) {
  if (props.user.role === "Agent") return <AgentDashboard {...props} />;
  if (props.user.role === "Superviseur") return <SupervisorDashboard {...props} />;
  return <AdminDashboard {...props} />;
}


