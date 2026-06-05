# Conventions & gestion des erreurs API

> ARCHITECTURE — [retour à l'index](../../ARCHITECTURE.md)
> Les règles absolues de code sont la source de vérité dans [CLAUDE.md](../../CLAUDE.md) — non dupliquées ici.

## Conventions de nommage


### Fichiers

| Type | Convention | Exemple |
|---|---|---|
| Composant React | PascalCase | `StaffCard.tsx` |
| Page Next.js | `page.tsx` fixe | `app/service/page.tsx` |
| Hook | camelCase + `use` | `useStaff.ts` |
| Utilitaire/lib | camelCase | `api.ts`, `colors.ts` |
| Type TS | camelCase | `types/index.ts` |
| Entité Symfony | PascalCase | `StaffCompetence.php` |
| Repository Symfony | PascalCase + `Repository` | `ServiceRepository.php` |
| Controller Symfony | PascalCase + `Controller` | `DashboardController.php` |

### Variables & fonctions TypeScript

```ts
// ✅ Bon
const staffMembers = await fetchStaff()
function getZoneColor(zoneName: string): string {}
const isManager = user.role === 'MANAGER'
type ServiceStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINE'

// ❌ Mauvais
const data = await fetch()
function calc(p: any) {}
const x = user.role === 'MANAGER'
```

### Commentaires — tous en français

```ts
// ✅ Calcule la couleur d'avatar à partir du nom de l'employé
// ❌ Calculates avatar color from employee name
```


---

## Gestion des erreurs API — standard


### Format de réponse d'erreur API Platform

```json
{
  "@type": "hydra:Error",
  "hydra:title": "An error occurred",
  "hydra:description": "Email ou mot de passe incorrect"
}
```

### Client HTTP côté front (`lib/api.ts`)

```ts
// Tous les appels API passent par ce client Axios centralisé
// Il gère automatiquement :
// - L'ajout du header Authorization: Bearer <token> depuis localStorage
// - La déconnexion si 401 (supprime token + redirect /login)
// - Content-Type: application/ld+json (JSON-LD pour API Platform)
```

### Codes d'erreur traités

```
400 → Données invalides (validation Symfony)
401 → Non authentifié → supprime token + redirect /login
403 → Non autorisé (rôle insuffisant)
404 → Ressource introuvable → afficher EmptyState
500 → Erreur serveur → message générique
```
