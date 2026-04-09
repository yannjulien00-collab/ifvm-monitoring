# 🧠 Projet IFVM – Plan et Cahier de Charge Combinés

---

## 📝 Plan parfait pour toi

### 🔹 Étape 1
**Cahier de charge PRO**  
> Fournir toutes les spécifications, utilisateurs, fonctionnalités et architecture technique pour l’application de monitoring IFVM.

### 🔹 Étape 2
**Base de données (MySQL)**  
> Créer les tables : `utilisateur`, `observation`, `alerte`, `intervention`, `intervention_observation`.  
> Insérer les données tests pour pouvoir tester le backend.

### 🔹 Étape 3
**Prompt IA pour générer l’app**  
> Préparer un prompt détaillé pour Codex / GPT afin de générer le frontend React complet avec :  
> - Login et gestion des rôles  
> - Dashboard avec graphiques  
> - Carte interactive  
> - Formulaires Observations et Interventions  
> - Connexion aux endpoints PHP/MySQL

### 🔹 Étape 4
**Développement**  
> Développer et connecter :  
> - Backend PHP/MySQL  
> - Frontend React  
> - Tests des endpoints et des fonctionnalités  
> - Déploiement local (XAMPP) ou Cloud

---

## 📄 Cahier de charge – Application IFVM

### 1. Présentation du projet

#### 1.1 Contexte
L’Ivotoerana Famongorana ny Valala (IFVM) à Madagascar est chargé de surveiller et lutter contre les invasions de criquets.  
Actuellement :  
- Les données terrain sont mal centralisées  
- Le suivi en temps réel est limité  
- Les alertes ne sont pas automatisées  

> 👉 D’où la création d’une application de monitoring.

#### 1.2 Objectif
Mettre en place une application web permettant :  
- Collecte des données terrain  
- Suivi en temps réel  
- Visualisation sur carte  
- Aide à la décision

---

### 2. Objectifs spécifiques
- Centraliser les données de surveillance  
- Suivre les zones infestées  
- Générer des alertes automatiques  
- Améliorer la réactivité des équipes  
- Fournir des rapports analytiques

---

### 3. Utilisateurs cibles

| Rôle          | Description                     |
|---------------|---------------------------------|
| Admin         | Gère toute l’application        |
| Superviseur   | Analyse et valide les données   |
| Agent terrain | Envoie les observations         |

---

### 4. Fonctionnalités

#### 4.1 Authentification
- Connexion / Déconnexion  
- Gestion des rôles  
- Sécurité (mot de passe chiffré)

#### 4.2 Gestion des utilisateurs
- Ajouter / modifier / supprimer utilisateurs  
- Attribution des rôles  
- Suivi des activités

#### 4.3 Monitoring terrain
Chaque observation contient :  
- Localisation (GPS)  
- Date et heure  
- Type de criquets (larve / adulte)  
- Densité  
- Photos (optionnel)  
- Commentaire

#### 4.4 Carte interactive
- Intégration Google Maps  
- Affichage des zones :  
  - 🟢 Faible  
  - 🟡 Moyen  
  - 🔴 Critique  
- Filtrage par date / zone

#### 4.5 Système d’alerte
- Détection automatique :  
  - Forte densité  
  - Reproduction massive  
- Notification :  
  - Email  
  - Tableau de bord

#### 4.6 Tableau de bord
- Statistiques globales  
- Graphiques : évolution des infestations, zones les plus touchées  
- Indicateurs clés (KPI)

#### 4.7 Rapports
- Génération PDF / Excel  
- Export des données  
- Historique

---

### 5. Architecture technique

#### 5.1 Frontend
- HTML / CSS / JavaScript (ou React si avancé)

#### 5.2 Backend
- PHP (XAMPP) ou Python (Flask / Django)

#### 5.3 Base de données
- MySQL

#### 5.4 API externe
- Google Maps API (cartographie)

---

### 6. Base de données (structure)

#### Table : utilisateurs
- id  
- nom  
- email  
- mot_de_passe  
- role  
- date_creation

#### Table : observations
- id  
- utilisateur_id  
- latitude  
- longitude  
- type_criquet  
- densite  
- date_observation  
- commentaire

#### Table : alertes
- id  
- observation_id  
- niveau (faible/moyen/critique)  
- date_alerte

#### Table : interventions
- id  
- zone  
- date  
- action  
- responsable

---

### 7. Sécurité
- Authentification sécurisée  
- Protection contre injection SQL  
- Gestion des sessions  
- Sauvegarde régulière des données

---

### 8. Interface utilisateur
Pages principales :  
- Login  
- Dashboard  
- Carte  
- Observations  
- Utilisateurs  
- Rapports  

> 👉 Design simple, moderne et responsive

---

### 9. Déploiement
- Serveur local : XAMPP  
- Hébergement possible : VPS ou Cloud

---

### 10. Planning (exemple)

| Phase          | Durée           |
|----------------|----------------|
| Analyse        | 2 jours        |
| Conception     | 3 jours        |
| Développement  | 2–3 semaines   |
| Test           | 1 semaine      |
| Déploiement    | 2 jours        |

---

### 11. Évolutions futures
- Application mobile  
- IA pour prédiction des invasions  
- Intégration météo  
- Notifications SMS

---

### Conclusion
> Ce projet est :  
- Professionnel ✅  
- Réel (utilisé dans la vie réelle) ✅  
- Très valorisant pour ton CV ✅

---

### Prochaine étape (très important)
Dis-moi ce que tu veux maintenant :  
1️⃣ Structure SQL complète (prête à importer)  
2️⃣ Prompt IA pour générer toute l’application  
3️⃣ Interface (design + pages HTML/React)  
4️⃣ Code complet (début du projet)