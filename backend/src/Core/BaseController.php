<?php

declare(strict_types=1);

namespace App\Core;

use PDO;

abstract class BaseController
{
    protected PDO $db;
    protected Request $request;
    protected Response $response;

    public function __construct(
        Request $request,
        Response $response,
        Database $database
    ) {
        $this->request = $request;
        $this->response = $response;
        $this->db = $database->connection();
    }

    protected function input(): array
    {
        return $this->request->input();
    }

    protected function requireAuth(): array
    {
        $user = $this->request->user();

        if ($user === null) {
            Response::json(['message' => 'Authentification requise.'], 401);
        }

        return $user;
    }

    protected function requireRoles(array $roles): array
    {
        $user = $this->requireAuth();

        if (!in_array($user['role'], $roles, true)) {
            Response::json(['message' => 'Acces refuse pour ce role.'], 403);
        }

        return $user;
    }
}
