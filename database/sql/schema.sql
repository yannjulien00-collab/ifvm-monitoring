CREATE DATABASE IF NOT EXISTS ifvm_db;
USE ifvm_db;

CREATE TABLE IF NOT EXISTS utilisateur (
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

ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS numero_telephone VARCHAR(30) NULL;
ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS zone_affectation VARCHAR(30) NULL;
ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS adresse_postale VARCHAR(255) NULL;
ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS lieu_travail VARCHAR(150) NULL;
ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS photo_profil_path VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS verification_compte (
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

CREATE TABLE IF NOT EXISTS reinitialisation_mot_de_passe (
    id_reinitialisation INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    token_reinitialisation VARCHAR(100) NOT NULL,
    expire_le DATETIME NOT NULL,
    utilise_le DATETIME NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_token_reinitialisation (token_reinitialisation),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parametre_systeme (
    cle_parametre VARCHAR(100) PRIMARY KEY,
    valeur_parametre VARCHAR(255) NOT NULL,
    date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observation (
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

CREATE TABLE IF NOT EXISTS alerte (
    id_alerte INT AUTO_INCREMENT PRIMARY KEY,
    observation_id INT NOT NULL,
    niveau VARCHAR(20) NOT NULL,
    date_alerte DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (observation_id) REFERENCES observation(id_observation) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS intervention (
    id_intervention INT AUTO_INCREMENT PRIMARY KEY,
    zone VARCHAR(100) NOT NULL,
    date_intervention DATETIME NOT NULL,
    action TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS intervention_observation (
    intervention_id INT NOT NULL,
    observation_id INT NOT NULL,
    PRIMARY KEY (intervention_id, observation_id),
    FOREIGN KEY (intervention_id) REFERENCES intervention(id_intervention) ON DELETE CASCADE,
    FOREIGN KEY (observation_id) REFERENCES observation(id_observation) ON DELETE CASCADE
);

INSERT INTO parametre_systeme (cle_parametre, valeur_parametre)
VALUES
('alert_threshold_critical', '50'),
('alert_threshold_medium', '30')
ON DUPLICATE KEY UPDATE valeur_parametre = VALUES(valeur_parametre);
