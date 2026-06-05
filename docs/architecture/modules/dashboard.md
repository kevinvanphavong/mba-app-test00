# Module Dashboard — refonte V2

> Module ARCHITECTURE — [retour à l'index](../../../ARCHITECTURE.md)

La page `/dashboard` (manager uniquement) consomme un seul endpoint enrichi (`GET /api/dashboard/{centreId}` → `DashboardController::__invoke`). Trois zones ont été refondues en V2 :

| Composant | Rôle |
|---|---|
| `components/dashboard/HeroService.tsx` | Hero V2 : statut LIVE animé + nom du jour + horaires + manager responsable + cercle global + grille zones triées + équipe en service |
| `components/dashboard/KPIGrid.tsx` | 4 KPIs (Tâches du jour, Staff actifs, Incidents ouverts, Tutos lus) avec tag contextuel `StatCard.tag` |
| `components/dashboard/StaffRanking.tsx` | Panel « Progression équipe », top 5 sans toggle, lien `Voir tout →` |

Le payload `service.today` côté API ajoute trois listes :
- `zones[]` : id, nom, couleur, completed, total, pct (triées `pct ASC` puis `nom ASC`).
- `managersResponsables[]` : issu de `Service::getManagers` (relation existante `service_manager`).
- `staffEnService[]` : users distincts ayant un `Poste` sur le service du jour.

Le payload `staff` est désormais un objet `{ members: [...], nouveauxCeMois }` (compteur des users du centre créés depuis le 1er du mois en cours, fuseau Europe/Paris). `IncidentsList` et la section Alertes ne sont **pas** concernés par cette V2.

Cf. [`docs/design/superadmin.md`](../../design/superadmin.md) (« Hero Service V2 ») pour le layout adaptatif des zones et le pulse `LIVE`.
