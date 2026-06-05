# Rôles, authentification, points & navigation

> ARCHITECTURE — [retour à l'index](../../ARCHITECTURE.md)

## Gestion des rôles


```ts
// Deux rôles
type Role = 'MANAGER' | 'EMPLOYE'

// Règles d'accès par page
Dashboard            → MANAGER uniquement
Service du Jour      → MANAGER + EMPLOYE (vue différente)
Services Planning    → MANAGER uniquement
Postes               → MANAGER (édition complète : zones, missions, compétences, drag-drop reorder) | EMPLOYE (lecture)
Staff                → MANAGER (écriture + valide compétences) | EMPLOYE (lecture)
Tutoriels            → MANAGER + EMPLOYE
Réglages             → MANAGER (tout) | EMPLOYE (profil + notifs)
Éditeur tutoriels    → MANAGER uniquement (/reglages/editeur — zones/missions/compétences ont migré sur /postes)
Pointage             → MANAGER uniquement
Validation hebdo     → MANAGER uniquement (/pointage/validation)
```

---

## Flux d'authentification


```
1. User saisit email + password sur /login
2. Next.js envoie POST /api/login → Symfony (Lexik JWT)
3. Symfony vérifie credentials, retourne { token, user }
4. Token JWT stocké dans localStorage
5. Axios interceptor attache Authorization: Bearer <token> à chaque requête
6. Si 401 → supprime token localStorage + redirect /login
7. Après login Manager → redirect /dashboard
8. Après login Employé → redirect /service
```

---

## Système de points — logique métier


```
user.points = SUM(competence.points) WHERE staff_competence.user = user

Niveaux indicatifs (affichage uniquement, non stockés en BDD) :
  0–20   pts → Débutant
  21–50  pts → Intermédiaire
  51–100 pts → Avancé
  101+   pts → Expérimenté

Recalcul :
  → Déclenché à chaque ajout/suppression de StaffCompetence
  → Calculé côté backend (Symfony) sur demande
  → Ne JAMAIS calculer les points côté front
```

---

## Navigation mobile (ordre fixe)


```
Bottom nav (5 items) :
  Service · Postes · Staff · Tutoriels · Réglages

Page active : accent (#f97316) + opacity-100
Page inactive : muted (#6b7280) + opacity-40
```
