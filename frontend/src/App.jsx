import { useCallback, useEffect, useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import {
  createObservation,
  deleteObservation,
  forgotPassword,
  getAlerts,
  getInterventions,
  getObservations,
  getUser,
  getUsers,
  login,
  logout,
  register,
  resetPassword,
  updateObservation,
  verifyAccount,
} from "./services/api";

const initialCredentials = {
  email: "",
  mot_de_passe: "",
};

const initialRegisterForm = {
  nom: "",
  email: "",
  mot_de_passe: "",
  role: "Agent",
};

const initialForgotForm = {
  email: "",
};

const initialVerificationForm = {
  code_verification: "",
};

const initialResetForm = {
  token_reinitialisation: "",
  nouveau_mot_de_passe: "",
};

const initialObservationForm = {
  id_observation: null,
  zone: "Nord",
  latitude: "",
  longitude: "",
  type_criquet: "",
  densite: "",
  commentaire: "",
  photo_path: "",
};

export default function App() {
  const [user, setUser] = useState(null);
  const [dashboardTheme, setDashboardTheme] = useState(() => localStorage.getItem("ifvm-dashboard-theme") || "dark");
  const [publicView, setPublicView] = useState("home");
  const [credentials, setCredentials] = useState(initialCredentials);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [forgotForm, setForgotForm] = useState(initialForgotForm);
  const [verificationForm, setVerificationForm] = useState(initialVerificationForm);
  const [resetForm, setResetForm] = useState(initialResetForm);
  const [observationForm, setObservationForm] = useState(initialObservationForm);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const [observationMessage, setObservationMessage] = useState("");
  const [observationError, setObservationError] = useState("");
  const [dashboard, setDashboard] = useState({ utilisateurs: [], observations: [], alertes: [], interventions: [] });
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoadingDashboard(true);

    try {
      const [utilisateurs, observations, alertes, interventions] = await Promise.all([
        getUsers(),
        getObservations(),
        getAlerts(),
        getInterventions(),
      ]);

      setDashboard({
        utilisateurs: utilisateurs.data ?? [],
        observations: observations.data ?? [],
        alertes: alertes.data ?? [],
        interventions: interventions.data ?? [],
      });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoadingDashboard(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function handleToggleTheme() {
    setDashboardTheme((current) => {
      const nextTheme = current === "light" ? "dark" : "light";
      localStorage.setItem("ifvm-dashboard-theme", nextTheme);
      return nextTheme;
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await login(credentials);
      setUser(response.user);
      setPublicView("auth");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await register(registerForm);
      setAuthMessage(`${response.message} Code de vérification: ${response.code_verification}`);
      setCredentials({ email: registerForm.email, mot_de_passe: registerForm.mot_de_passe });
      setVerificationForm({ code_verification: response.code_verification ?? "" });
      setRegisterForm(initialRegisterForm);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyAccount(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await verifyAccount(verificationForm);
      setAuthMessage(response.message);
      setVerificationForm(initialVerificationForm);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await forgotPassword(forgotForm);
      setAuthMessage(`${response.message} Token: ${response.token_reinitialisation}`);
      setResetForm({ token_reinitialisation: response.token_reinitialisation ?? "", nouveau_mot_de_passe: "" });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await resetPassword(resetForm);
      setAuthMessage(response.message);
      setCredentials({ email: forgotForm.email || credentials.email, mot_de_passe: resetForm.nouveau_mot_de_passe });
      setForgotForm(initialForgotForm);
      setResetForm(initialResetForm);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveObservation(event) {
    event.preventDefault();
    setIsSavingObservation(true);
    setObservationError("");
    setObservationMessage("");

    const payload = {
      zone: observationForm.zone,
      latitude: observationForm.latitude,
      longitude: observationForm.longitude,
      type_criquet: observationForm.type_criquet,
      densite: Number(observationForm.densite),
      commentaire: observationForm.commentaire,
      photo_path: observationForm.photo_path || null,
    };

    try {
      if (observationForm.id_observation) {
        const response = await updateObservation(observationForm.id_observation, payload);
        setObservationMessage(response.message);
      } else {
        const response = await createObservation(payload);
        setObservationMessage(`${response.message} Niveau d’alerte : ${response.niveau_alerte}`);
      }

      setObservationForm(initialObservationForm);
      await loadDashboard();
    } catch (error) {
      setObservationError(error.message);
    } finally {
      setIsSavingObservation(false);
    }
  }

  function handleEditObservation(observation) {
    setObservationError("");
    setObservationMessage("");
    setObservationForm({
      id_observation: observation.id_observation,
      zone: observation.zone ?? "Nord",
      latitude: String(observation.latitude ?? ""),
      longitude: String(observation.longitude ?? ""),
      type_criquet: observation.type_criquet ?? "",
      densite: String(observation.densite ?? ""),
      commentaire: observation.commentaire ?? "",
      photo_path: observation.photo_path ?? "",
    });
  }

  function handleCancelObservationEdit() {
    setObservationForm(initialObservationForm);
    setObservationError("");
    setObservationMessage("");
  }

  async function handleDeleteObservation(observationId) {
    setIsSavingObservation(true);
    setObservationError("");
    setObservationMessage("");

    try {
      const response = await deleteObservation(observationId);
      setObservationMessage(response.message);
      if (observationForm.id_observation === observationId) {
        setObservationForm(initialObservationForm);
      }
      await loadDashboard();
    } catch (error) {
      setObservationError(error.message);
    } finally {
      setIsSavingObservation(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setUser(null);
      setPublicView("home");
      setObservationForm(initialObservationForm);
      setObservationMessage("");
      setObservationError("");
      setDashboard({ utilisateurs: [], observations: [], alertes: [], interventions: [] });
    }
  }

  async function handleRefreshCurrentUser() {
    if (!user?.id_utilisateur) {
      return;
    }

    try {
      const response = await getUser(user.id_utilisateur);
      setUser(response.data ?? user);
    } catch (error) {
      setAuthError(error.message);
    }
  }

  if (!user) {
    if (publicView === "home") {
      return <HomePage onEnter={() => setPublicView("auth")} />;
    }

    return (
      <LoginPage
        authError={authError}
        authMessage={authMessage}
        credentials={credentials}
        forgotForm={forgotForm}
        isSubmitting={isSubmitting}
        onBack={() => setPublicView("home")}
        onForgotChange={setForgotForm}
        onForgotSubmit={handleForgotPassword}
        onChange={setCredentials}
        onRegisterChange={setRegisterForm}
        onRegisterSubmit={handleRegister}
        onResetChange={setResetForm}
        onResetSubmit={handleResetPassword}
        onSubmit={handleLogin}
        onVerifyChange={setVerificationForm}
        onVerifySubmit={handleVerifyAccount}
        registerForm={registerForm}
        resetForm={resetForm}
        verificationForm={verificationForm}
      />
    );
  }

  return (
    <DashboardPage
      data={dashboard}
      loading={loadingDashboard}
      observationError={observationError}
      observationForm={observationForm}
      observationMessage={observationMessage}
      onCancelObservationEdit={handleCancelObservationEdit}
      onDeleteObservation={handleDeleteObservation}
      onEditObservation={handleEditObservation}
      onLogout={handleLogout}
      onObservationChange={setObservationForm}
      onRefreshCurrentUser={handleRefreshCurrentUser}
      onSaveObservation={handleSaveObservation}
      savingObservation={isSavingObservation}
      onRefresh={loadDashboard}
      onToggleTheme={handleToggleTheme}
      theme={dashboardTheme}
      user={user}
    />
  );
}
