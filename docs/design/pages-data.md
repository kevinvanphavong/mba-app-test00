# Design system — Architecture pages, données & modules MVP

> DESIGN — [retour à l'index](../../DESIGN_SYSTEM.md)
> Le schéma BDD de référence est [`schema.sql`](../../schema.sql) ; les entités détaillées dans `ENTITES.md`. Le tableau ci-dessous reste une vue d'ensemble.

## Architecture pages (Next.js App Router)


```
app/
├── (auth)/
│   └── login/page.tsx
├── (app)/
│   ├── layout.tsx          ← Sidebar desktop + Header burger (< desktop) + MobileDrawer
│   ├── dashboard/page.tsx  ← Manager only
│   ├── service/page.tsx    ← Service du Jour
│   ├── services/page.tsx   ← Planning (Manager only)
│   ├── postes/page.tsx     ← Fiches postes
│   ├── staff/page.tsx      ← Gestion équipe
│   ├── tutoriels/page.tsx  ← Tutoriels
│   └── reglages/page.tsx   ← Paramètres
```

---

## Schéma de données (MVP — vue d'ensemble)


### Entités principales

| Entité | Champs clés |
|--------|-------------|
| **Centre** | id, nom, adresse, type_activite, horaire_ouverture/fermeture |
| **User** | id, centre_id, nom, email, role (MANAGER/EMPLOYE), actif, points_total, niveau |
| **Zone** | id, centre_id, nom, couleur, ordre, archivee |
| **Mission** | id, zone_id, titre, categorie (OUVERTURE/PENDANT/MENAGE/FERMETURE), priorite, type (FIXE/PONCTUELLE) |
| **Competence** | id, zone_id, titre, description, difficulte, priorite, points |
| **UserCompetence** | id, user_id, competence_id, validee_par, validee_le |
| **Service** | id, centre_id, date, heure_ouverture/fermeture, manager_id, statut, taux_completion |
| **Assignation** | id, service_id, user_id, zone_id |
| **TaskCompletion** | id, service_id, mission_id, user_id, completee, completee_le |
| **Incident** | id, centre_id, service_id, zone_id, description, severite, statut, cree_par |
| **Tutoriel** | id, centre_id, zone_id, titre, contenu (richtext), niveau, mis_en_avant, publie |
| **TutorielLu** | id, tutoriel_id, user_id, lu_le |

### Multi-tenant
Chaque entité est isolée par `centre_id`. Le JWT embarque `centre_id` pour filtrer auto toutes les requêtes API.


---

## Modules MVP


| # | Module | Manager | Employé | Statut |
|---|--------|---------|---------|--------|
| 1 | Dashboard | Vue synthèse complète | ✗ | Inclus |
| 2 | Service du Jour | Crée, supervise, incidents | Voit + coche | Inclus |
| 3 | Services Journaliers | Planning + historique | ✗ | Inclus |
| 4 | Postes | CRUD missions + compétences | Lecture seule | Inclus |
| 5 | Staff | CRUD complet, valide compétences | Voir collègues | Inclus |
| 6 | Tutoriels | CRUD + suivi lecture équipe | Lit + marque lu | Inclus |
| 7 | Réglages | Accès complet + éditeur | Notifs + infos | Inclus |
| 8 | Gestion du contenu | Zones + missions + compétences | ✗ | Dans Réglages |
| 9 | Pointage — Validation hebdo | Relire + valider + corriger heures | ✗ | Inclus |

