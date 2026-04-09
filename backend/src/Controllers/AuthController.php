<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Response;

final class AuthController extends BaseController
{
    public function login(array $params = []): void
    {
        $data = $this->input();

        if (empty($data['email']) || empty($data['mot_de_passe'])) {
            Response::json(['message' => 'Email et mot de passe requis.'], 422);
        }

        $statement = $this->db->prepare(
            'SELECT id_utilisateur, nom, email, mot_de_passe, role, numero_telephone, zone_affectation, adresse_postale, lieu_travail, photo_profil_path, statut_compte, email_verifie
             FROM utilisateur
             WHERE email = :email
             LIMIT 1'
        );
        $statement->execute(['email' => $data['email']]);
        $user = $statement->fetch();

        if ($user === false || !password_verify($data['mot_de_passe'], $user['mot_de_passe'])) {
            Response::json(['message' => 'Identifiants invalides.'], 401);
        }

        if (($user['statut_compte'] ?? 'actif') !== 'actif') {
            Response::json(['message' => 'Ce compte est inactif.'], 403);
        }

        $update = $this->db->prepare(
            'UPDATE utilisateur SET dernier_login = NOW() WHERE id_utilisateur = :id'
        );
        $update->execute(['id' => (int) $user['id_utilisateur']]);

        unset($user['mot_de_passe']);
        $_SESSION['user'] = $user;

        Response::json([
            'message' => 'Connexion reussie.',
            'user' => $user,
        ]);
    }

    public function logout(array $params = []): void
    {
        $_SESSION = [];

        if (session_id() !== '') {
            session_destroy();
        }

        Response::json(['message' => 'Deconnexion reussie.']);
    }
}
