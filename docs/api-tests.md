# Tests API IFVM

Ce guide permet de tester rapidement le backend PHP avec Postman ou un client HTTP similaire.

## URL de base

Si le projet est place dans `htdocs/ifvm`, l'URL de base sera :

```text
http://localhost/ifvm/backend/public
```

Si vous avez mis le dossier ailleurs dans XAMPP, adaptez simplement le chemin.

## Important

- utilisez `Content-Type: application/json`
- conservez les cookies de session dans Postman pour rester connecte apres le login
- les routes protegees renvoient `401` si vous n'etes pas connecte

## 1. Login

**POST** `/login`

```json
{
  "email": "admin@ifvm.mg",
  "mot_de_passe": "Password123!"
}
```

Reponse attendue :
- message de connexion reussie
- objet `user`

## 2. Liste des utilisateurs

**GET** `/utilisateurs`

Reponse attendue :
- tableau `data` avec les utilisateurs de test

## 3. Creer un utilisateur

**POST** `/utilisateurs`

```json
{
  "nom": "Nouvel Agent",
  "email": "nouvel.agent@ifvm.mg",
  "mot_de_passe": "Password123!",
  "role": "Agent"
}
```

Reponse attendue :
- message de creation
- `id_utilisateur`

## 4. Liste des observations

**GET** `/observations`

Reponse attendue :
- tableau `data`
- chaque observation peut inclure `niveau_alerte`

## 5. Creer une observation

**POST** `/observations`

```json
{
  "latitude": -18.95,
  "longitude": 47.52,
  "type_criquet": "Adulte",
  "densite": 55,
  "commentaire": "Nouvelle zone critique"
}
```

Reponse attendue :
- message de creation
- `id_observation`
- `niveau_alerte: "critique"`

## 6. Filtrer les alertes

**GET** `/alertes`

Puis :

**GET** `/alertes?niveau=critique`

Reponse attendue :
- liste des alertes
- filtrage correct selon le niveau

## 7. Liste des interventions

**GET** `/interventions`

Reponse attendue :
- tableau `data`
- presence des `observation_ids`

## 8. Creer une intervention

**POST** `/interventions`

```json
{
  "zone": "Zone C",
  "date_intervention": "2026-04-12 10:00:00",
  "action": "Pulverisation ciblee",
  "observation_ids": [2, 3]
}
```

Reponse attendue :
- message de creation
- `id_intervention`

## 9. Logout

**POST** `/logout`

Reponse attendue :
- message de deconnexion

## Ordre de test recommande

1. `POST /login`
2. `GET /utilisateurs`
3. `GET /observations`
4. `POST /observations`
5. `GET /alertes`
6. `GET /interventions`
7. `POST /interventions`
8. `POST /logout`
