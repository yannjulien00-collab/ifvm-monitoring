<?php

declare(strict_types=1);

namespace App\Core;

final class Request
{
    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);

        if (!is_string($path) || $path === '') {
            return '/';
        }

        $scriptName = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
        $normalizedScriptDir = rtrim($scriptName, '/');

        if ($normalizedScriptDir !== '' && $normalizedScriptDir !== '.' && str_starts_with($path, $normalizedScriptDir)) {
            $path = substr($path, strlen($normalizedScriptDir));
        }

        $path = '/' . ltrim($path, '/');

        return $path === '' ? '/' : $path;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw ?: '[]', true);

        if (is_array($decoded)) {
            return $decoded;
        }

        if (!empty($_POST)) {
            return $_POST;
        }

        return [];
    }

    public function user(): ?array
    {
        return $_SESSION['user'] ?? null;
    }
}

