import { useState } from "react";
import heroImage from "../../img/ifvm 1.jpeg";

function updateField(values, field, value) {
  return {
    ...values,
    [field]: value,
  };
}

const tabs = [
  { id: "login", label: "Connexion" },
  { id: "register", label: "Compte" },
  { id: "forgot", label: "Recuperation" },
];

const tabContent = {
  login: {
    title: "Acces prive",
    description: "Une entree claire, securisee et rapide pour les equipes IFVM.",
    chips: ["Securise", "Fluide", "Professionnel"],
  },
  register: {
    title: "Creation de compte",
    description: "Creation, verification et mise en service dans une interface plus nette.",
    chips: ["Compte", "Verification", "Controle"],
  },
  forgot: {
    title: "Recuperation",
    description: "Retrouver l acces sans friction avec un parcours simple et rassurant.",
    chips: ["Token", "Rapide", "Rassurant"],
  },
};

export default function LoginPage({
  authError,
  authMessage,
  credentials,
  forgotForm,
  isSubmitting,
  onBack,
  onChange,
  onForgotChange,
  onForgotSubmit,
  onRegisterChange,
  onRegisterSubmit,
  onResetChange,
  onResetSubmit,
  onSubmit,
  onVerifyChange,
  onVerifySubmit,
  registerForm,
  resetForm,
  verificationForm,
}) {
  const [activeTab, setActiveTab] = useState("login");
  const activeMeta = tabContent[activeTab];

  return (
    <div className="login-page">
      <img src={heroImage} alt="Fond IFVM" className="login-background-image" />
      <div className="login-backdrop" />
      <div className="login-topbar">
        <button type="button" className="back-link back-link-floating" onClick={onBack}>
          Retour accueil
        </button>
      </div>
      <section className="login-shell">
        <article className="login-showcase">
          <div className="showcase-copy">
            <span className="showcase-kicker">Private access</span>
            <h2>{activeMeta.title}</h2>
            <p>{activeMeta.description}</p>
          </div>

          <div className="showcase-chip-row">
            {activeMeta.chips.map((chip) => (
              <span key={chip} className="showcase-chip">
                {chip}
              </span>
            ))}
          </div>

          <div className="showcase-quote">
            <strong>IFVM</strong>
            <span>Monitoring terrain premium</span>
          </div>
        </article>

        <article className="login-panel">
          <div className="login-panel-inner">
            <div className="login-heading">
              <span className="panel-kicker">Espace prive</span>
              <h2>Connexion</h2>
              <p>Connexion securisee pour administrer, superviser et suivre le terrain.</p>
            </div>

            <div className="tabs login-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-button${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "login" ? (
              <form className="login-form auth-form login-card" onSubmit={onSubmit}>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(event) => onChange(updateField(credentials, "email", event.target.value))}
                    placeholder="nom@ifvm.mg"
                  />
                </label>

                <label>
                  <span>Mot de passe</span>
                  <input
                    type="password"
                    value={credentials.mot_de_passe}
                    onChange={(event) =>
                      onChange(updateField(credentials, "mot_de_passe", event.target.value))
                    }
                    placeholder="Votre mot de passe"
                  />
                </label>
                <p className="login-helper-line">Acces reserve aux comptes autorises de la plateforme IFVM.</p>

                {authError ? <p className="error-banner">{authError}</p> : null}
                {authMessage ? <p className="success-banner">{authMessage}</p> : null}

                <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Connexion..." : "Entrer"}
                </button>
              </form>
            ) : null}

            {activeTab === "register" ? (
              <div className="auth-stack">
                <form className="login-form auth-form login-card" onSubmit={onRegisterSubmit}>
                  <label>
                    <span>Nom complet</span>
                    <input
                      type="text"
                      value={registerForm.nom}
                      onChange={(event) =>
                        onRegisterChange(updateField(registerForm, "nom", event.target.value))
                      }
                      placeholder="Nom de l'utilisateur"
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        onRegisterChange(updateField(registerForm, "email", event.target.value))
                      }
                      placeholder="nouveau@ifvm.mg"
                    />
                  </label>
                  <label>
                    <span>Mot de passe</span>
                    <input
                      type="password"
                      value={registerForm.mot_de_passe}
                      onChange={(event) =>
                        onRegisterChange(updateField(registerForm, "mot_de_passe", event.target.value))
                      }
                      placeholder="Mot de passe"
                    />
                  </label>
                  <label>
                    <span>Role</span>
                    <select
                      value={registerForm.role}
                      onChange={(event) =>
                        onRegisterChange(updateField(registerForm, "role", event.target.value))
                      }
                    >
                      <option value="Admin">Admin</option>
                      <option value="Superviseur">Superviseur</option>
                      <option value="Agent">Agent</option>
                    </select>
                  </label>
                  <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creation..." : "Creer"}
                  </button>
                </form>

                <form
                  className="login-form auth-form secondary-form login-card secondary-card"
                  onSubmit={onVerifySubmit}
                >
                  <label>
                    <span>Code de verification</span>
                    <input
                      type="text"
                      value={verificationForm.code_verification}
                      onChange={(event) =>
                        onVerifyChange(
                          updateField(verificationForm, "code_verification", event.target.value)
                        )
                      }
                      placeholder="Code recu"
                    />
                  </label>
                  {authError ? <p className="error-banner">{authError}</p> : null}
                  {authMessage ? <p className="success-banner">{authMessage}</p> : null}
                  <button type="submit" className="secondary-button" disabled={isSubmitting}>
                    {isSubmitting ? "Verification..." : "Verifier"}
                  </button>
                </form>
              </div>
            ) : null}

            {activeTab === "forgot" ? (
              <div className="auth-stack">
                <form className="login-form auth-form login-card" onSubmit={onForgotSubmit}>
                  <label>
                    <span>Email du compte</span>
                    <input
                      type="email"
                      value={forgotForm.email}
                      onChange={(event) =>
                        onForgotChange(updateField(forgotForm, "email", event.target.value))
                      }
                      placeholder="admin@ifvm.mg"
                    />
                  </label>
                  <p className="helper-text subtle-text">Un token sera genere pour restaurer l'acces.</p>
                  <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Generation..." : "Generer"}
                  </button>
                </form>

                <form
                  className="login-form auth-form secondary-form login-card secondary-card"
                  onSubmit={onResetSubmit}
                >
                  <label>
                    <span>Token</span>
                    <input
                      type="text"
                      value={resetForm.token_reinitialisation}
                      onChange={(event) =>
                        onResetChange(
                          updateField(resetForm, "token_reinitialisation", event.target.value)
                        )
                      }
                      placeholder="Token recu"
                    />
                  </label>
                  <label>
                    <span>Nouveau mot de passe</span>
                    <input
                      type="password"
                      value={resetForm.nouveau_mot_de_passe}
                      onChange={(event) =>
                        onResetChange(
                          updateField(resetForm, "nouveau_mot_de_passe", event.target.value)
                        )
                      }
                      placeholder="Nouveau mot de passe"
                    />
                  </label>
                  {authError ? <p className="error-banner">{authError}</p> : null}
                  {authMessage ? <p className="success-banner">{authMessage}</p> : null}
                  <button type="submit" className="secondary-button" disabled={isSubmitting}>
                    {isSubmitting ? "Mise a jour..." : "Mettre a jour"}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
