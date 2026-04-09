const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/projet-yann/STAGE/backend/public";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload.message || "Une erreur est survenue.");
  }

  return payload;
}

export function login(credentials) { return request("/login", { method: "POST", body: JSON.stringify(credentials) }); }
export function logout() { return request("/logout", { method: "POST" }); }
export function register(payload) { return request("/register", { method: "POST", body: JSON.stringify(payload) }); }
export function verifyAccount(payload) { return request("/verify-account", { method: "POST", body: JSON.stringify(payload) }); }
export function forgotPassword(payload) { return request("/forgot-password", { method: "POST", body: JSON.stringify(payload) }); }
export function resetPassword(payload) { return request("/reset-password", { method: "POST", body: JSON.stringify(payload) }); }
export function createObservation(payload) { return request("/observations", { method: "POST", body: JSON.stringify(payload) }); }
export function updateObservation(id, payload) { return request(`/observations/${id}`, { method: "PUT", body: JSON.stringify(payload) }); }
export function deleteObservation(id) { return request(`/observations/${id}`, { method: "DELETE" }); }
export function createIntervention(payload) { return request("/interventions", { method: "POST", body: JSON.stringify(payload) }); }
export function createUser(payload) { return request("/utilisateurs", { method: "POST", body: JSON.stringify(payload) }); }
export function updateUser(id, payload) { return request(`/utilisateurs/${id}`, { method: "PUT", body: JSON.stringify(payload) }); }
export function deleteUser(id) { return request(`/utilisateurs/${id}`, { method: "DELETE" }); }
export function getUser(id) { return request(`/utilisateurs/${id}`); }
export function getSystemSettings() { return request("/parametres-systeme"); }
export function updateSystemSettings(payload) { return request("/parametres-systeme", { method: "PUT", body: JSON.stringify(payload) }); }
export function getUsers() { return request("/utilisateurs"); }
export function getObservations() { return request("/observations"); }
export function getAlerts() { return request("/alertes"); }
export function getInterventions() { return request("/interventions"); }
