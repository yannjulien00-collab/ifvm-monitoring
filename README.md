# IFVM Monitoring

Application de suivi IFVM composee de :

- un backend PHP/MySQL pour l'authentification, les observations, les alertes et les interventions
- un frontend React/Vite pour le tableau de bord, la carte et les formulaires
- des scripts SQL pour initialiser la base de donnees

## Vue d'ensemble

- `backend/` : API PHP exposee depuis `backend/public`
- `frontend/` : interface React
- `database/` : schema SQL, seeds et migrations
- `docs/` : notes de reference et scenarios de test API

## Prerequis

Avant de lancer le projet, verifiez que vous avez :

- PHP 8+ avec MySQL/PDO
- MySQL ou MariaDB
- Node.js 18+ et `npm`
- XAMPP ou un environnement Apache/PHP equivalent

## Installation rapide

### 1. Cloner ou placer le projet dans `htdocs`

Exemple dans ce workspace :

```text
C:\xampp\htdocs\projet-yann\STAGE
```

Si vous utilisez un autre chemin, adaptez les URLs dans les fichiers `.env`.

### 2. Initialiser la base de donnees

Importez les fichiers suivants dans MySQL dans cet ordre :

1. `database/sql/schema.sql`
2. `database/seeds/seed.sql`

Le schema cree la base `ifvm_db` si elle n'existe pas deja.

### 3. Configurer le backend

Copiez `backend/.env.example` vers `backend/.env` si besoin, puis verifiez les variables :

```env
APP_NAME=IFVM API
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost/projet-yann/STAGE/backend/public

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ifvm_db
DB_USER=root
DB_PASSWORD=
```

Note :
- le projet contient deja un exemple de configuration dans `backend/.env.example`
- si votre dossier est installe ailleurs que `projet-yann/STAGE`, mettez a jour `APP_URL`

### 4. Configurer le frontend

Copiez `frontend/.env.example` vers `frontend/.env` si vous souhaitez surcharger la configuration, puis verifiez :

```env
VITE_API_BASE_URL=http://localhost/projet-yann/STAGE/backend/public
```

Cette URL doit pointer vers le backend accessible depuis votre navigateur.

### 5. Installer les dependances frontend

Depuis `frontend/` :

```bash
npm install
```

## Lancer le projet

### Backend

Demarrez Apache et MySQL via XAMPP, puis ouvrez l'URL :

```text
http://localhost/projet-yann/STAGE/backend/public
```

Le backend autorise deja les origines locales courantes, notamment `http://localhost:5173`.

### Frontend

Depuis `frontend/` :

```bash
npm run dev
```

Vite expose ensuite l'application en local, generalement sur :

```text
http://localhost:5173
```

## Workflow recommande

1. Demarrer Apache et MySQL
2. Importer `database/sql/schema.sql` puis `database/seeds/seed.sql`
3. Verifier `backend/.env`
4. Verifier `frontend/.env`
5. Lancer `npm run dev` dans `frontend/`
6. Ouvrir le frontend dans le navigateur

## Scripts utiles

Dans `frontend/package.json` :

```bash
npm run dev
npm run build
npm run preview
```

## Arborescence

```text
.
|-- backend
|   |-- public
|   |-- src
|   |   |-- Controllers
|   |   |-- Core
|   |   |-- Routes
|   |   `-- Services
|   |-- storage
|   `-- tests
|-- frontend
|   |-- public
|   `-- src
|       |-- assets
|       |-- components
|       |-- features
|       |-- layouts
|       |-- pages
|       |-- routes
|       |-- services
|       |-- styles
|       `-- utils
|-- database
|   |-- migrations
|   |-- seeds
|   `-- sql
`-- docs
```

## Documentation complementaire

- `backend/README.md` : structure du backend
- `frontend/README.md` : structure du frontend
- `database/README.md` : organisation des scripts de base de donnees
- `docs/api-tests.md` : jeux de tests rapides pour l'API

## Etat actuel

Le projet est deja structure pour un usage local avec :

- un backend PHP sans framework lourd, charge depuis `backend/public/index.php`
- un frontend React/Vite
- une base MySQL `ifvm_db`

Si une URL ne fonctionne pas, le premier reflexe est de verifier que les chemins configures dans `backend/.env` et `frontend/.env` correspondent bien a votre emplacement local.
