<?php

declare(strict_types=1);

return [
    ['method' => 'POST', 'path' => '/login', 'handler' => 'AuthController@login'],
    ['method' => 'POST', 'path' => '/logout', 'handler' => 'AuthController@logout'],
    ['method' => 'POST', 'path' => '/register', 'handler' => 'UtilisateurController@register'],
    ['method' => 'POST', 'path' => '/verify-account', 'handler' => 'UtilisateurController@verifyAccount'],
    ['method' => 'POST', 'path' => '/forgot-password', 'handler' => 'UtilisateurController@forgotPassword'],
    ['method' => 'POST', 'path' => '/reset-password', 'handler' => 'UtilisateurController@resetPassword'],
    ['method' => 'GET', 'path' => '/parametres-systeme', 'handler' => 'ParametreSystemeController@index'],
    ['method' => 'PUT', 'path' => '/parametres-systeme', 'handler' => 'ParametreSystemeController@update'],
    ['method' => 'GET', 'path' => '/utilisateurs/{id}', 'handler' => 'UtilisateurController@show'],
    ['method' => 'GET', 'path' => '/utilisateurs', 'handler' => 'UtilisateurController@index'],
    ['method' => 'POST', 'path' => '/utilisateurs', 'handler' => 'UtilisateurController@store'],
    ['method' => 'PUT', 'path' => '/utilisateurs/{id}', 'handler' => 'UtilisateurController@update'],
    ['method' => 'DELETE', 'path' => '/utilisateurs/{id}', 'handler' => 'UtilisateurController@destroy'],
    ['method' => 'GET', 'path' => '/observations/{id}', 'handler' => 'ObservationController@show'],
    ['method' => 'GET', 'path' => '/observations', 'handler' => 'ObservationController@index'],
    ['method' => 'POST', 'path' => '/observations', 'handler' => 'ObservationController@store'],
    ['method' => 'PUT', 'path' => '/observations/{id}', 'handler' => 'ObservationController@update'],
    ['method' => 'DELETE', 'path' => '/observations/{id}', 'handler' => 'ObservationController@destroy'],
    ['method' => 'GET', 'path' => '/alertes', 'handler' => 'AlerteController@index'],
    ['method' => 'GET', 'path' => '/interventions/{id}', 'handler' => 'InterventionController@show'],
    ['method' => 'GET', 'path' => '/interventions', 'handler' => 'InterventionController@index'],
    ['method' => 'POST', 'path' => '/interventions', 'handler' => 'InterventionController@store'],
    ['method' => 'PUT', 'path' => '/interventions/{id}', 'handler' => 'InterventionController@update'],
    ['method' => 'DELETE', 'path' => '/interventions/{id}', 'handler' => 'InterventionController@destroy'],
];