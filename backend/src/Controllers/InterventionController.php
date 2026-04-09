<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Response;

final class InterventionController extends BaseController
{
    public function index(array $params = []): void
    {
        $this->requireAuth();

        $statement = $this->db->query(
            'SELECT
                i.id_intervention,
                i.zone,
                i.date_intervention,
                i.action,
                GROUP_CONCAT(io.observation_id ORDER BY io.observation_id SEPARATOR ",") AS observation_ids
            FROM intervention i
            LEFT JOIN intervention_observation io ON io.intervention_id = i.id_intervention
            GROUP BY i.id_intervention, i.zone, i.date_intervention, i.action
            ORDER BY i.id_intervention DESC'
        );

        $rows = array_map(static function (array $row): array {
            $row['observation_ids'] = $row['observation_ids'] !== null
                ? array_map('intval', explode(',', $row['observation_ids']))
                : [];

            return $row;
        }, $statement->fetchAll());

        Response::json(['data' => $rows]);
    }

    public function show(array $params): void
    {
        $this->requireAuth();

        $statement = $this->db->prepare(
            'SELECT id_intervention, zone, date_intervention, action
             FROM intervention
             WHERE id_intervention = :id'
        );
        $statement->execute(['id' => (int) $params['id']]);
        $intervention = $statement->fetch();

        if ($intervention === false) {
            Response::json(['message' => 'Intervention introuvable.'], 404);
        }

        $links = $this->db->prepare(
            'SELECT observation_id FROM intervention_observation WHERE intervention_id = :id ORDER BY observation_id ASC'
        );
        $links->execute(['id' => (int) $params['id']]);
        $intervention['observation_ids'] = array_map(
            static fn (array $row): int => (int) $row['observation_id'],
            $links->fetchAll()
        );

        Response::json(['data' => $intervention]);
    }

    public function store(array $params = []): void
    {
        $this->requireRoles(['Admin', 'Superviseur']);
        $data = $this->input();

        foreach (['zone', 'date_intervention', 'action'] as $field) {
            if (empty($data[$field])) {
                Response::json(['message' => "Champ requis: {$field}."], 422);
            }
        }

        $statement = $this->db->prepare(
            'INSERT INTO intervention (zone, date_intervention, action)
             VALUES (:zone, :date_intervention, :action)'
        );
        $statement->execute([
            'zone' => $data['zone'],
            'date_intervention' => $data['date_intervention'],
            'action' => $data['action'],
        ]);

        $interventionId = (int) $this->db->lastInsertId();
        $this->syncObservationLinks($interventionId, $data['observation_ids'] ?? []);

        Response::json([
            'message' => 'Intervention creee avec succes.',
            'id_intervention' => $interventionId,
        ], 201);
    }

    public function update(array $params): void
    {
        $this->requireRoles(['Admin', 'Superviseur']);
        $data = $this->input();

        $fields = [];
        $payload = ['id' => (int) $params['id']];

        foreach (['zone', 'date_intervention', 'action'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $payload[$field] = $data[$field];
            }
        }

        if ($fields !== []) {
            $sql = 'UPDATE intervention SET ' . implode(', ', $fields) . ' WHERE id_intervention = :id';
            $statement = $this->db->prepare($sql);
            $statement->execute($payload);
        }

        if (array_key_exists('observation_ids', $data)) {
            $this->syncObservationLinks((int) $params['id'], $data['observation_ids']);
        }

        Response::json(['message' => 'Intervention mise a jour avec succes.']);
    }

    public function destroy(array $params): void
    {
        $this->requireRoles(['Admin', 'Superviseur']);

        $statement = $this->db->prepare('DELETE FROM intervention WHERE id_intervention = :id');
        $statement->execute(['id' => (int) $params['id']]);

        Response::json(['message' => 'Intervention supprimee avec succes.']);
    }

    private function syncObservationLinks(int $interventionId, mixed $observationIds): void
    {
        if (!is_array($observationIds)) {
            return;
        }

        $delete = $this->db->prepare('DELETE FROM intervention_observation WHERE intervention_id = :id');
        $delete->execute(['id' => $interventionId]);

        $insert = $this->db->prepare(
            'INSERT INTO intervention_observation (intervention_id, observation_id)
             VALUES (:intervention_id, :observation_id)'
        );

        foreach ($observationIds as $observationId) {
            $insert->execute([
                'intervention_id' => $interventionId,
                'observation_id' => (int) $observationId,
            ]);
        }
    }
}

