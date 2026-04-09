<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Response;
use App\Services\AlertService;

final class ObservationController extends BaseController
{
    public function index(array $params = []): void
    {
        $this->requireAuth();

        $conditions = [];
        $payload = [];

        if ($this->request->query('utilisateur_id') !== null) {
            $conditions[] = 'o.utilisateur_id = :utilisateur_id';
            $payload['utilisateur_id'] = (int) $this->request->query('utilisateur_id');
        }

        if ($this->request->query('niveau') !== null) {
            $conditions[] = 'a.niveau = :niveau';
            $payload['niveau'] = (string) $this->request->query('niveau');
        }

        if ($this->request->query('zone') !== null) {
            $conditions[] = 'o.zone = :zone';
            $payload['zone'] = (string) $this->request->query('zone');
        }

        if ($this->request->query('statut_validation') !== null) {
            $conditions[] = 'o.statut_validation = :statut_validation';
            $payload['statut_validation'] = (string) $this->request->query('statut_validation');
        }

        $sql = 'SELECT
                    o.id_observation,
                    o.utilisateur_id,
                    u.nom AS utilisateur_nom,
                    o.zone,
                    o.latitude,
                    o.longitude,
                    o.type_criquet,
                    o.densite,
                    o.commentaire,
                    o.photo_path,
                    o.statut_validation,
                    o.valide_par,
                    sv.nom AS valide_par_nom,
                    o.date_validation,
                    o.date_observation,
                    a.niveau AS niveau_alerte
                FROM observation o
                INNER JOIN utilisateur u ON u.id_utilisateur = o.utilisateur_id
                LEFT JOIN utilisateur sv ON sv.id_utilisateur = o.valide_par
                LEFT JOIN alerte a ON a.observation_id = o.id_observation';

        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY o.id_observation DESC';

        $statement = $this->db->prepare($sql);
        $statement->execute($payload);

        Response::json(['data' => $statement->fetchAll()]);
    }

    public function show(array $params): void
    {
        $this->requireAuth();

        $statement = $this->db->prepare(
            'SELECT
                o.id_observation,
                o.utilisateur_id,
                o.zone,
                o.latitude,
                o.longitude,
                o.type_criquet,
                o.densite,
                o.commentaire,
                o.photo_path,
                o.statut_validation,
                o.valide_par,
                o.date_validation,
                o.date_observation,
                a.niveau AS niveau_alerte
            FROM observation o
            LEFT JOIN alerte a ON a.observation_id = o.id_observation
            WHERE o.id_observation = :id'
        );
        $statement->execute(['id' => (int) $params['id']]);
        $observation = $statement->fetch();

        if ($observation === false) {
            Response::json(['message' => 'Observation introuvable.'], 404);
        }

        Response::json(['data' => $observation]);
    }

    public function store(array $params = []): void
    {
        $user = $this->requireAuth();
        $data = $this->input();

        foreach (['zone', 'latitude', 'longitude', 'type_criquet', 'densite'] as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === '') {
                Response::json(['message' => "Champ requis: {$field}."], 422);
            }
        }

        if (!in_array((string) $data['zone'], ['Nord', 'Sud', 'Est', 'Ouest'], true)) {
            Response::json(['message' => 'Zone invalide.'], 422);
        }

        $utilisateurId = isset($data['utilisateur_id']) && in_array($user['role'], ['Admin', 'Superviseur'], true)
            ? (int) $data['utilisateur_id']
            : (int) $user['id_utilisateur'];

        $statement = $this->db->prepare(
            'INSERT INTO observation (
                utilisateur_id, zone, latitude, longitude, type_criquet, densite, commentaire, photo_path, statut_validation, valide_par, date_validation
             ) VALUES (
                :utilisateur_id, :zone, :latitude, :longitude, :type_criquet, :densite, :commentaire, :photo_path, :statut_validation, NULL, NULL
             )'
        );
        $statement->execute([
            'utilisateur_id' => $utilisateurId,
            'zone' => $data['zone'],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'type_criquet' => $data['type_criquet'],
            'densite' => (int) $data['densite'],
            'commentaire' => $data['commentaire'] ?? null,
            'photo_path' => $data['photo_path'] ?? null,
            'statut_validation' => 'en_attente',
        ]);

        $observationId = (int) $this->db->lastInsertId();
        $alertService = new AlertService($this->db);
        $niveau = $alertService->syncObservationAlert($observationId, (int) $data['densite']);

        Response::json([
            'message' => 'Observation creee avec succes.',
            'id_observation' => $observationId,
            'niveau_alerte' => $niveau,
        ], 201);
    }

    public function update(array $params): void
    {
        $user = $this->requireAuth();
        $data = $this->input();

        $statement = $this->db->prepare('SELECT utilisateur_id FROM observation WHERE id_observation = :id');
        $statement->execute(['id' => (int) $params['id']]);
        $existing = $statement->fetch();

        if ($existing === false) {
            Response::json(['message' => 'Observation introuvable.'], 404);
        }

        $isOwner = (int) $existing['utilisateur_id'] === (int) $user['id_utilisateur'];
        $canSupervise = in_array($user['role'], ['Admin', 'Superviseur'], true);

        if (!$isOwner && !$canSupervise) {
            Response::json(['message' => 'Modification non autorisee.'], 403);
        }

        if (array_key_exists('zone', $data) && !in_array((string) $data['zone'], ['Nord', 'Sud', 'Est', 'Ouest'], true)) {
            Response::json(['message' => 'Zone invalide.'], 422);
        }

        if (array_key_exists('statut_validation', $data) && !in_array((string) $data['statut_validation'], ['en_attente', 'validee', 'refusee'], true)) {
            Response::json(['message' => 'Statut de validation invalide.'], 422);
        }

        $fields = [];
        $payload = ['id' => (int) $params['id']];

        foreach (['zone', 'latitude', 'longitude', 'type_criquet', 'densite', 'commentaire', 'photo_path'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $payload[$field] = $field === 'densite' ? (int) $data[$field] : $data[$field];
            }
        }

        if ($canSupervise && array_key_exists('statut_validation', $data)) {
            $fields[] = 'statut_validation = :statut_validation';
            $payload['statut_validation'] = $data['statut_validation'];
            $fields[] = 'valide_par = :valide_par';
            $payload['valide_par'] = (int) $user['id_utilisateur'];
            $fields[] = 'date_validation = NOW()';
        }

        if ($fields === []) {
            Response::json(['message' => 'Aucune donnee a mettre a jour.'], 422);
        }

        $sql = 'UPDATE observation SET ' . implode(', ', $fields) . ' WHERE id_observation = :id';
        $update = $this->db->prepare($sql);
        $update->execute($payload);

        if (array_key_exists('densite', $data)) {
            $alertService = new AlertService($this->db);
            $alertService->syncObservationAlert((int) $params['id'], (int) $data['densite']);
        }

        Response::json(['message' => 'Observation mise a jour avec succes.']);
    }

    public function destroy(array $params): void
    {
        $user = $this->requireAuth();

        $statement = $this->db->prepare('SELECT utilisateur_id FROM observation WHERE id_observation = :id');
        $statement->execute(['id' => (int) $params['id']]);
        $existing = $statement->fetch();

        if ($existing === false) {
            Response::json(['message' => 'Observation introuvable.'], 404);
        }

        $isOwner = (int) $existing['utilisateur_id'] === (int) $user['id_utilisateur'];
        if (!$isOwner && !in_array($user['role'], ['Admin', 'Superviseur'], true)) {
            Response::json(['message' => 'Suppression non autorisee.'], 403);
        }

        $delete = $this->db->prepare('DELETE FROM observation WHERE id_observation = :id');
        $delete->execute(['id' => (int) $params['id']]);

        Response::json(['message' => 'Observation supprimee avec succes.']);
    }
}