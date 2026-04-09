<?php

declare(strict_types=1);

namespace App\Services;

use PDO;

final class AlertService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function levelFromDensity(int $density): string
    {
        $critical = $this->getThreshold('alert_threshold_critical', 50);
        $medium = $this->getThreshold('alert_threshold_medium', 30);

        if ($density >= $critical) {
            return 'critique';
        }

        if ($density >= $medium) {
            return 'moyen';
        }

        return 'faible';
    }

    public function syncObservationAlert(int $observationId, int $density): string
    {
        $level = $this->levelFromDensity($density);

        $statement = $this->db->prepare('SELECT id_alerte FROM alerte WHERE observation_id = :observation_id');
        $statement->execute(['observation_id' => $observationId]);
        $existing = $statement->fetch();

        if ($existing !== false) {
            $update = $this->db->prepare('UPDATE alerte SET niveau = :niveau, date_alerte = NOW() WHERE observation_id = :observation_id');
            $update->execute([
                'niveau' => $level,
                'observation_id' => $observationId,
            ]);

            return $level;
        }

        $insert = $this->db->prepare('INSERT INTO alerte (observation_id, niveau) VALUES (:observation_id, :niveau)');
        $insert->execute([
            'observation_id' => $observationId,
            'niveau' => $level,
        ]);

        return $level;
    }

    private function getThreshold(string $key, int $default): int
    {
        $statement = $this->db->prepare('SELECT valeur_parametre FROM parametre_systeme WHERE cle_parametre = :cle LIMIT 1');
        $statement->execute(['cle' => $key]);
        $row = $statement->fetch();

        if ($row === false) {
            return $default;
        }

        return (int) $row['valeur_parametre'];
    }
}