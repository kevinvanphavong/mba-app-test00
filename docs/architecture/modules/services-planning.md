# Module Services Planning — vue mobile vs desktop

> Module ARCHITECTURE — [retour à l'index](../../../ARCHITECTURE.md)

La page `/services` propose **deux orchestrations** distinctes selon la largeur :

| Viewport | Composant | Rendu |
|---|---|---|
| `< lg` (mobile/tablette) | `ServicesMobileView` | Sections empilées « Aujourd'hui / À venir / Passés » + cards `ServiceCard` (comportement historique préservé) |
| `≥ lg` (desktop) | `ServicesDesktopView` | Hero + onglets (En cours / À venir / Historique) + filtre période + tableau dense dépliant |

Les **deux vues partagent un seul appel API** (`useServicesList` dans `page.tsx`). Le filtrage onglet + période est entièrement front via `lib/serviceFilters.ts` (`getTabBuckets`, `filterByPeriod`, `computeClotureRate`, `getPeriodShortcut`). Aucune logique métier n'est dupliquée — les composants atomiques (`ServicesHero`, `ServicesTabs`, etc.) consomment les helpers purs.

Le panneau dépliant (`ServicesTableExpanded`) reproduit le pattern note (édition/lecture) déjà présent dans `ServiceCard`, et utilise `useDeletePoste` pour le retrait inline d'un membre. La modale d'assignation (`ModalAssignerPoste`) est portée localement à `ServicesDesktopView` (state `assignTarget`).
