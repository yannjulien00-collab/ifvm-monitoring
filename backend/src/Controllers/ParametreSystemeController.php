<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Response;

final class ParametreSystemeController extends BaseController
{
    public function index(array $params = []): void
    {
        $this->requireRoles(['Admin']);

        $statement = $this->db->query(
            'SELECT cle_parametre, valeur_parametre, date_mise_a_jour
             FROM parametre_systeme
             ORDER BY cle_parametre ASC'
        );

        Response::json(['data' => $statement->fetchAll()]);
    }

    public function update(array $params = []): void
    {
        $this->requireRoles(['Admin']);
        $data = $this->input();

        foreach (['alert_threshold_critical', 'alert_threshold_medium'] as $key) {
            if (!array_key_exists($key, $data)) {
                Response::json(['message' => "Champ requis: {$key}."], 422);
            }
        }

        $critical = (int) $data['alert_threshold_critical'];
        $medium = (int) $data['alert_threshold_medium'];

        if ($critical <= $medium || $medium < 0) {
            Response::json(['message' => 'Les seuils d\'alerte sont invalides.'], 422);
        }

        $statement = $this->db->prepare(
            'INSERT INTO parametre_systeme (cle_parametre, valeur_parametre)
             VALUES (:cle_parametre, :valeur_parametre)
             ON DUPLICATE KEY UPDATE valeur_parametre = VALUES(valeur_parametre)'
        );

        $statement->execute([
            'cle_parametre' => 'alert_threshold_critical',
            'valeur_parametre' => (string) $critical,
        ]);
        $statement->execute([
            'cle_parametre' => 'alert_threshold_medium',
            'valeur_parametre' => (string) $medium,
        ]);

        Response::json(['message' => 'Parametres systeme mis a jour avec succes.']);
    }
}