USE ifvm_db;

INSERT INTO utilisateur (nom, email, mot_de_passe, role)
VALUES
('Admin IFVM', 'admin@ifvm.mg', '$2y$10$Wz3LkzY8YxJx6x.2b9O4meQ1svYl2x7e6rCq9vR8O/RZTsvk0P9yK', 'Admin'),
('Superviseur IFVM', 'superviseur@ifvm.mg', '$2y$10$Wz3LkzY8YxJx6x.2b9O4meQ1svYl2x7e6rCq9vR8O/RZTsvk0P9yK', 'Superviseur'),
('Agent Terrain', 'agent@ifvm.mg', '$2y$10$Wz3LkzY8YxJx6x.2b9O4meQ1svYl2x7e6rCq9vR8O/RZTsvk0P9yK', 'Agent');

INSERT INTO observation (utilisateur_id, zone, latitude, longitude, type_criquet, densite, commentaire, photo_path, statut_validation, valide_par, date_validation)
VALUES
(3, 'Nord', -18.879200, 47.507900, 'Larve', 20, 'Observation faible', NULL, 'validee', 2, '2026-04-07 09:00:00'),
(3, 'Sud', -18.933300, 47.516700, 'Adulte', 60, 'Densite critique, intervention necessaire', NULL, 'en_attente', NULL, NULL),
(3, 'Est', -18.900000, 47.500000, 'Adulte', 35, 'Zone moyenne, surveiller', NULL, 'refusee', 2, '2026-04-07 11:15:00');

INSERT INTO alerte (observation_id, niveau)
VALUES
(1, 'faible'),
(2, 'critique'),
(3, 'moyen');

INSERT INTO intervention (zone, date_intervention, action)
VALUES
('Nord', '2026-04-10 08:00:00', 'Traitement chimique'),
('Sud', '2026-04-11 09:00:00', 'Surveillance renforcee');

INSERT INTO intervention_observation (intervention_id, observation_id)
VALUES
(1, 2),
(2, 3);
