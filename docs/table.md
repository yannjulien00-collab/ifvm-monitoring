# Base SQL de l'application IFVM

Le schéma de référence de l'application est dans `database/sql/schema.sql`.
Ce document résume les tables réellement utilisées par le backend et le frontend.

## Création de la base

```sql
CREATE DATABASE IF NOT EXISTS ifvm_db;
USE ifvm_db;
```

## Tables principales

### `utilisateur`

```sql
CREATE TABLE utilisateur (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    numero_telephone VARCHAR(30) NULL,
    zone_affectation VARCHAR(30) NULL,
    adresse_postale VARCHAR(255) NULL,
    lieu_travail VARCHAR(150) NULL,
    photo_profil_path VARCHAR(255) NULL,
    statut_compte VARCHAR(20) NOT NULL DEFAULT 'actif',
    email_verifie TINYINT(1) NOT NULL DEFAULT 0,
    dernier_login DATETIME NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `verification_compte`

```sql
CREATE TABLE verification_compte (
    id_verification INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    code_verification VARCHAR(100) NOT NULL,
    expire_le DATETIME NOT NULL,
    verifie_le DATETIME NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_verification_utilisateur (utilisateur_id),
    UNIQUE KEY unique_code_verification (code_verification),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);
```

### `reinitialisation_mot_de_passe`

```sql
CREATE TABLE reinitialisation_mot_de_passe (
    id_reinitialisation INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    token_reinitialisation VARCHAR(100) NOT NULL,
    expire_le DATETIME NOT NULL,
    utilise_le DATETIME NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_token_reinitialisation (token_reinitialisation),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);
```

### `parametre_systeme`

```sql
CREATE TABLE parametre_systeme (
    cle_parametre VARCHAR(100) PRIMARY KEY,
    valeur_parametre VARCHAR(255) NOT NULL,
    date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `observation`

```sql
CREATE TABLE observation (
    id_observation INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    zone VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    type_criquet VARCHAR(50) NOT NULL,
    densite INT NOT NULL,
    commentaire TEXT,
    photo_path VARCHAR(255) NULL,
    statut_validation VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    valide_par INT NULL,
    date_validation DATETIME NULL,
    date_observation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    FOREIGN KEY (valide_par) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL
);
```

### `alerte`

```sql
CREATE TABLE alerte (
    id_alerte INT AUTO_INCREMENT PRIMARY KEY,
    observation_id INT NOT NULL,
    niveau VARCHAR(20) NOT NULL,
    date_alerte DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (observation_id) REFERENCES observation(id_observation) ON DELETE CASCADE
);
```

### `intervention`

```sql
CREATE TABLE intervention (
    id_intervention INT AUTO_INCREMENT PRIMARY KEY,
    zone VARCHAR(100) NOT NULL,
    date_intervention DATETIME NOT NULL,
    action TEXT NOT NULL
);
```

### `intervention_observation`

```sql
CREATE TABLE intervention_observation (
    intervention_id INT NOT NULL,
    observation_id INT NOT NULL,
    PRIMARY KEY (intervention_id, observation_id),
    FOREIGN KEY (intervention_id) REFERENCES intervention(id_intervention) ON DELETE CASCADE,
    FOREIGN KEY (observation_id) REFERENCES observation(id_observation) ON DELETE CASCADE
);
```

## Données de test

Le script de test à utiliser est `database/seeds/seed.sql`.

Il fournit :
- 3 utilisateurs de base
- 3 observations couvrant plusieurs niveaux
- 3 alertes liées à ces observations
- 2 interventions liées aux zones utilisées dans l'application

## Notes importantes

- Les zones manipulées par l'interface sont `Nord`, `Sud`, `Est` et `Ouest`.
- Les statuts de validation attendus sont `en_attente`, `validee` et `refusee`.
- Les rôles attendus sont `Admin`, `Superviseur` et `Agent`.
- Le mot de passe de test prévu dans les données seed est `Password123!`.
