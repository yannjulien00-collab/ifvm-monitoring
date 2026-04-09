<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Response;

final class AlerteController extends BaseController
{
    public function index(array $params = []): void
    {
        $this->requireAuth();

        $sql = 'SELECT
                    a.id_alerte,
                    a.observation_id,
                    a.niveau,
                    a.date_alerte,
                    o.latitude,
                    o.longitude,
                    o.type_criquet,
                    o.densite
                FROM alerte a
                INNER JOIN observation o ON o.id_observation = a.observation_id';

        $payload = [];
        if ($this->request->query('niveau') !== null) {
            $sql .= ' WHERE a.niveau = :niveau';
            $payload['niveau'] = (string) $this->request->query('niveau');
        }

        $sql .= ' ORDER BY a.id_alerte DESC';

        $statement = $this->db->prepare($sql);
        $statement->execute($payload);

        Response::json(['data' => $statement->fetchAll()]);
    }
}

