<?php

declare(strict_types=1);

namespace App\Core;

use App\Controllers\AlerteController;
use App\Controllers\AuthController;
use App\Controllers\InterventionController;
use App\Controllers\ObservationController;
use App\Controllers\ParametreSystemeController;
use App\Controllers\UtilisateurController;

final class Router
{
    private array $routes = [];
    private Request $request;
    private Response $response;
    private Database $database;

    public function __construct(
        Request $request,
        Response $response,
        Database $database
    ) {
        $this->request = $request;
        $this->response = $response;
        $this->database = $database;
    }

    public function add(string $method, string $path, string $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'handler' => $handler,
        ];
    }

    public function dispatch(): void
    {
        $method = $this->request->method();
        $path = rtrim($this->request->path(), '/') ?: '/';

        foreach ($this->routes as $route) {
            $routePath = rtrim($route['path'], '/') ?: '/';
            $pattern = '#^' . preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>\d+)', $routePath) . '$#';

            if ($route['method'] !== $method || preg_match($pattern, $path, $matches) !== 1) {
                continue;
            }

            [$controllerName, $action] = explode('@', $route['handler'], 2);
            $controllerClass = match ($controllerName) {
                'AuthController' => AuthController::class,
                'UtilisateurController' => UtilisateurController::class,
                'ObservationController' => ObservationController::class,
                'AlerteController' => AlerteController::class,
                'InterventionController' => InterventionController::class,
                'ParametreSystemeController' => ParametreSystemeController::class,
                default => null,
            };

            if ($controllerClass === null || !method_exists($controllerClass, $action)) {
                Response::json(['message' => 'Route configuree invalide.'], 500);
            }

            $params = array_filter(
                $matches,
                static function ($key): bool {
                    return !is_int($key);
                },
                ARRAY_FILTER_USE_KEY
            );

            $controller = new $controllerClass($this->request, $this->response, $this->database);
            $controller->{$action}($params);
            return;
        }

        Response::json(['message' => 'Route introuvable.'], 404);
    }
}