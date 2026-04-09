<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Response;

final class UtilisateurController extends BaseController
{
    private function userSelectFields(): string
    {
        return 'id_utilisateur, nom, email, role, numero_telephone, zone_affectation, adresse_postale, lieu_travail, photo_profil_path, statut_compte, email_verifie, dernier_login, date_creation';
    }

    public function register(array $params = []): void
    {
        $data = $this->input();

        foreach (['nom', 'email', 'mot_de_passe'] as $field) {
            if (empty($data[$field])) {
                Response::json(['message' => "Champ requis: {$field}."], 422);
            }
        }

        if (!filter_var((string) $data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::json(['message' => 'Adresse email invalide.'], 422);
        }

        if (strlen((string) $data['mot_de_passe']) < 8) {
            Response::json(['message' => 'Le mot de passe doit contenir au moins 8 caracteres.'], 422);
        }

        $role = $data['role'] ?? 'Agent';
        if (!in_array($role, ['Admin', 'Superviseur', 'Agent'], true)) {
            Response::json(['message' => 'Role invalide.'], 422);
        }

        $check = $this->db->prepare('SELECT id_utilisateur FROM utilisateur WHERE email = :email LIMIT 1');
        $check->execute(['email' => $data['email']]);
        if ($check->fetch() !== false) {
            Response::json(['message' => 'Cet email existe deja.'], 409);
        }

        $statement = $this->db->prepare(
            'INSERT INTO utilisateur (nom, email, mot_de_passe, role, numero_telephone, zone_affectation, adresse_postale, lieu_travail, photo_profil_path, statut_compte, email_verifie)
             VALUES (:nom, :email, :mot_de_passe, :role, :numero_telephone, :zone_affectation, :adresse_postale, :lieu_travail, :photo_profil_path, :statut_compte, :email_verifie)'
        );
        $statement->execute([
            'nom' => $data['nom'],
            'email' => $data['email'],
            'mot_de_passe' => password_hash($data['mot_de_passe'], PASSWORD_BCRYPT),
            'role' => $role,
            'numero_telephone' => $data['numero_telephone'] ?? null,
            'zone_affectation' => $data['zone_affectation'] ?? null,
            'adresse_postale' => $data['adresse_postale'] ?? null,
            'lieu_travail' => $data['lieu_travail'] ?? null,
            'photo_profil_path' => $data['photo_profil_path'] ?? null,
            'statut_compte' => 'actif',
            'email_verifie' => 0,
        ]);

        $userId = (int) $this->db->lastInsertId();
        $verificationCode = bin2hex(random_bytes(16));

        $verification = $this->db->prepare(
            'INSERT INTO verification_compte (utilisateur_id, code_verification, expire_le)
             VALUES (:utilisateur_id, :code_verification, DATE_ADD(NOW(), INTERVAL 1 DAY))'
        );
        $verification->execute([
            'utilisateur_id' => $userId,
            'code_verification' => $verificationCode,
        ]);

        Response::json([
            'message' => 'Compte cree avec succes. Veuillez verifier votre compte.',
            'id_utilisateur' => $userId,
            'code_verification' => $verificationCode,
        ], 201);
    }

    public function verifyAccount(array $params = []): void
    {
        $data = $this->input();
        $code = $data['code_verification'] ?? null;

        if (empty($code)) {
            Response::json(['message' => 'Champ requis: code_verification.'], 422);
        }

        $statement = $this->db->prepare(
            'SELECT id_verification, utilisateur_id, expire_le, verifie_le
             FROM verification_compte
             WHERE code_verification = :code
             LIMIT 1'
        );
        $statement->execute(['code' => $code]);
        $verification = $statement->fetch();

        if ($verification === false) {
            Response::json(['message' => 'Code de verification invalide.'], 404);
        }

        if ($verification['verifie_le'] !== null) {
            Response::json(['message' => 'Ce compte est deja verifie.']);
        }

        if (strtotime((string) $verification['expire_le']) < time()) {
            Response::json(['message' => 'Le code de verification a expire.'], 410);
        }

        $this->db->beginTransaction();

        try {
            $updateUser = $this->db->prepare(
                'UPDATE utilisateur
                 SET email_verifie = 1, statut_compte = :statut_compte
                 WHERE id_utilisateur = :id'
            );
            $updateUser->execute([
                'statut_compte' => 'actif',
                'id' => (int) $verification['utilisateur_id'],
            ]);

            $updateVerification = $this->db->prepare(
                'UPDATE verification_compte
                 SET verifie_le = NOW()
                 WHERE id_verification = :id'
            );
            $updateVerification->execute([
                'id' => (int) $verification['id_verification'],
            ]);

            $this->db->commit();
        } catch (\Throwable $exception) {
            $this->db->rollBack();
            Response::json([
                'message' => 'Verification du compte impossible.',
                'error' => $exception->getMessage(),
            ], 500);
        }

        Response::json(['message' => 'Compte verifie avec succes.']);
    }

    public function forgotPassword(array $params = []): void
    {
        $data = $this->input();

        if (empty($data['email'])) {
            Response::json(['message' => 'Champ requis: email.'], 422);
        }

        $statement = $this->db->prepare(
            'SELECT id_utilisateur, email FROM utilisateur WHERE email = :email LIMIT 1'
        );
        $statement->execute(['email' => $data['email']]);
        $user = $statement->fetch();

        if ($user === false) {
            Response::json(['message' => 'Aucun compte ne correspond a cet email.'], 404);
        }

        $token = bin2hex(random_bytes(24));

        $cleanup = $this->db->prepare(
            'DELETE FROM reinitialisation_mot_de_passe WHERE utilisateur_id = :id'
        );
        $cleanup->execute(['id' => (int) $user['id_utilisateur']]);

        $insert = $this->db->prepare(
            'INSERT INTO reinitialisation_mot_de_passe (utilisateur_id, token_reinitialisation, expire_le)
             VALUES (:utilisateur_id, :token_reinitialisation, DATE_ADD(NOW(), INTERVAL 1 HOUR))'
        );
        $insert->execute([
            'utilisateur_id' => (int) $user['id_utilisateur'],
            'token_reinitialisation' => $token,
        ]);

        Response::json([
            'message' => 'Demande de reinitialisation enregistree.',
            'token_reinitialisation' => $token,
            'expire_dans' => '1 heure',
        ]);
    }

    public function resetPassword(array $params = []): void
    {
        $data = $this->input();

        foreach (['token_reinitialisation', 'nouveau_mot_de_passe'] as $field) {
            if (empty($data[$field])) {
                Response::json(['message' => "Champ requis: {$field}."], 422);
            }
        }

        if (strlen((string) $data['nouveau_mot_de_passe']) < 8) {
            Response::json(['message' => 'Le nouveau mot de passe doit contenir au moins 8 caracteres.'], 422);
        }

        $statement = $this->db->prepare(
            'SELECT id_reinitialisation, utilisateur_id, expire_le, utilise_le
             FROM reinitialisation_mot_de_passe
             WHERE token_reinitialisation = :token
             LIMIT 1'
        );
        $statement->execute(['token' => $data['token_reinitialisation']]);
        $reset = $statement->fetch();

        if ($reset === false) {
            Response::json(['message' => 'Token de reinitialisation invalide.'], 404);
        }

        if ($reset['utilise_le'] !== null) {
            Response::json(['message' => 'Ce token a deja ete utilise.'], 409);
        }

        if (strtotime((string) $reset['expire_le']) < time()) {
            Response::json(['message' => 'Le token de reinitialisation a expire.'], 410);
        }

        $this->db->beginTransaction();

        try {
            $updateUser = $this->db->prepare(
                'UPDATE utilisateur
                 SET mot_de_passe = :mot_de_passe
                 WHERE id_utilisateur = :id'
            );
            $updateUser->execute([
                'mot_de_passe' => password_hash($data['nouveau_mot_de_passe'], PASSWORD_BCRYPT),
                'id' => (int) $reset['utilisateur_id'],
            ]);

            $updateReset = $this->db->prepare(
                'UPDATE reinitialisation_mot_de_passe
                 SET utilise_le = NOW()
                 WHERE id_reinitialisation = :id'
            );
            $updateReset->execute(['id' => (int) $reset['id_reinitialisation']]);

            $this->db->commit();
        } catch (\Throwable $exception) {
            $this->db->rollBack();
            Response::json([
                'message' => 'Reinitialisation du mot de passe impossible.',
                'error' => $exception->getMessage(),
            ], 500);
        }

        Response::json(['message' => 'Mot de passe mis a jour avec succes.']);
    }

    public function index(array $params = []): void
    {
        $this->requireAuth();

        $statement = $this->db->query(
            'SELECT ' . $this->userSelectFields() . '
             FROM utilisateur
             ORDER BY id_utilisateur DESC'
        );

        Response::json(['data' => $statement->fetchAll()]);
    }

    public function show(array $params): void
    {
        $this->requireAuth();

        $statement = $this->db->prepare(
            'SELECT ' . $this->userSelectFields() . '
             FROM utilisateur
             WHERE id_utilisateur = :id'
        );
        $statement->execute(['id' => (int) $params['id']]);
        $user = $statement->fetch();

        if ($user === false) {
            Response::json(['message' => 'Utilisateur introuvable.'], 404);
        }

        Response::json(['data' => $user]);
    }

    public function store(array $params = []): void
    {
        $this->requireRoles(['Admin']);
        $data = $this->input();

        foreach (['nom', 'email', 'mot_de_passe', 'role'] as $field) {
            if (empty($data[$field])) {
                Response::json(['message' => "Champ requis: {$field}."], 422);
            }
        }

        $statement = $this->db->prepare(
            'INSERT INTO utilisateur (nom, email, mot_de_passe, role, numero_telephone, zone_affectation, adresse_postale, lieu_travail, photo_profil_path, statut_compte, email_verifie)
             VALUES (:nom, :email, :mot_de_passe, :role, :numero_telephone, :zone_affectation, :adresse_postale, :lieu_travail, :photo_profil_path, :statut_compte, :email_verifie)'
        );
        $statement->execute([
            'nom' => $data['nom'],
            'email' => $data['email'],
            'mot_de_passe' => password_hash($data['mot_de_passe'], PASSWORD_BCRYPT),
            'role' => $data['role'],
            'numero_telephone' => $data['numero_telephone'] ?? null,
            'zone_affectation' => $data['zone_affectation'] ?? null,
            'adresse_postale' => $data['adresse_postale'] ?? null,
            'lieu_travail' => $data['lieu_travail'] ?? null,
            'photo_profil_path' => $data['photo_profil_path'] ?? null,
            'statut_compte' => $data['statut_compte'] ?? 'actif',
            'email_verifie' => isset($data['email_verifie']) ? (int) ((bool) $data['email_verifie']) : 1,
        ]);

        Response::json([
            'message' => 'Utilisateur cree avec succes.',
            'id_utilisateur' => (int) $this->db->lastInsertId(),
        ], 201);
    }

    public function update(array $params): void
    {
        $authUser = $this->requireAuth();
        $data = $this->input();
        $targetId = (int) $params['id'];
        $isSelfUpdate = (int) $authUser['id_utilisateur'] === $targetId;

        if (!$isSelfUpdate && $authUser['role'] !== 'Admin') {
            Response::json(['message' => 'Acces refuse pour cette mise a jour.'], 403);
        }

        $fields = [];
        $payload = ['id' => $targetId];

        $allowedFields = $isSelfUpdate
            ? ['nom', 'email', 'numero_telephone', 'zone_affectation', 'adresse_postale', 'lieu_travail', 'photo_profil_path']
            : ['nom', 'email', 'role', 'numero_telephone', 'zone_affectation', 'adresse_postale', 'lieu_travail', 'photo_profil_path', 'statut_compte', 'dernier_login'];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $payload[$field] = $data[$field];
            }
        }

        if (!$isSelfUpdate && array_key_exists('email_verifie', $data)) {
            $fields[] = 'email_verifie = :email_verifie';
            $payload['email_verifie'] = (int) ((bool) $data['email_verifie']);
        }

        if (!empty($data['mot_de_passe'])) {
            $fields[] = 'mot_de_passe = :mot_de_passe';
            $payload['mot_de_passe'] = password_hash($data['mot_de_passe'], PASSWORD_BCRYPT);
        }

        if ($fields === []) {
            Response::json(['message' => 'Aucune donnee a mettre a jour.'], 422);
        }

        $sql = 'UPDATE utilisateur SET ' . implode(', ', $fields) . ' WHERE id_utilisateur = :id';
        $statement = $this->db->prepare($sql);
        $statement->execute($payload);

        Response::json(['message' => 'Utilisateur mis a jour avec succes.']);
    }

    public function destroy(array $params): void
    {
        $this->requireRoles(['Admin']);

        $statement = $this->db->prepare('DELETE FROM utilisateur WHERE id_utilisateur = :id');
        $statement->execute(['id' => (int) $params['id']]);

        Response::json(['message' => 'Utilisateur supprime avec succes.']);
    }
}
