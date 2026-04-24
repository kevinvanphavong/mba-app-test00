# SuperAdmin — Plan global

> Plan détaillé du back-office SuperAdmin de Shiftly, accessible uniquement à Kévin Vanphavong (fondateur). Document à valider avant production des maquettes HTML, qui elles-mêmes seront validées avant le code.

---

## 1. Vue d'ensemble

Le SuperAdmin est un **dashboard interne** qui te permet de superviser tous les centres clients depuis une interface centralisée. Il n'est jamais visible par tes clients (managers ou employés).

### Objectifs

1. **Observer** : santé globale du SaaS (centres, MRR, erreurs, adoption)
2. **Diagnostiquer** : identifier rapidement quel client a un problème, quel module est utilisé
3. **Agir** : impersonate un manager, suspendre un centre, gérer le pricing, traiter le support
4. **Décider** : disposer des metrics business pour piloter la stratégie produit

### Décisions actées

| Sujet | Décision |
|---|---|
| **Auth** | Route séparée `/superadmin/login` avec mot de passe distinct (option B) |
| **URL** | Sous-route `/superadmin` (pas de sous-domaine pour l'instant) |
| **Layout widgets** | Figé, pas de drag-and-drop |
| **Impersonation** | Incluse dès Phase 1 avec audit trail complet |
| **Sentry** | Intégré en parallèle dans le même chantier que la Phase 1 |
| **Phasage** | 4 phases, plan complet validé avant tout code |
| **Maquettes** | HTML produites pour chaque page avant Claude Code |

---

## 2. Roadmap des 4 phases

```
Phase 1 — MVP Monitoring          ~5 jours    Aucune dépendance
Phase 2 — Billing & Subscriptions ~5 jours    Dépend du chantier Stripe
Phase 3 — Users globaux & Support ~4 jours    Aucune dépendance
Phase 4 — Activity & Settings     ~4 jours    Dépend des phases 1-3
```

---

## PHASE 1 — MVP Monitoring (~5 jours)

> **Objectif** : avoir une vue temps réel de tous les centres, pouvoir se loguer en tant que n'importe quel manager pour debug, et voir les erreurs en production.

### Pages de l'interface

1. **`/superadmin/login`** — Page de connexion dédiée (mot de passe séparé)
2. **`/superadmin`** — Dashboard (KPIs + graphique MRR + activité récente + santé Sentry)
3. **`/superadmin/centres`** — Liste de tous les centres avec filtres
4. **`/superadmin/centres/[id]`** — Détail d'un centre (stats, users, erreurs, actions)
5. **Bandeau d'impersonation** — Composant global affiché en haut de l'app pendant l'impersonation

### Composants frontend

```
src/app/(superadmin)/
  layout.tsx                              ← layout dédié (sidebar SuperAdmin)
  login/page.tsx                          ← connexion
  page.tsx                                ← dashboard
  centres/page.tsx                        ← liste
  centres/[id]/page.tsx                   ← détail

src/components/superadmin/
  SuperAdminSidebar.tsx
  SuperAdminHeader.tsx
  ImpersonationBanner.tsx                 ← bandeau rouge global
  DashboardKpiCards.tsx                   ← 4 KPIs : Centres / MRR / Users / Erreurs 7j
  MrrChart.tsx                            ← graphique mensuel
  RecentActivityWidget.tsx
  SentryHealthWidget.tsx                  ← état des erreurs / centres impactés
  CentresTable.tsx                        ← liste filtrable
  CentreDetailHeader.tsx
  CentreDetailStats.tsx                   ← KPIs spécifiques au centre
  CentreDetailUsers.tsx                   ← liste des users du centre
  CentreDetailErrors.tsx                  ← erreurs Sentry filtrées sur centre_id
  CentreActionsPanel.tsx                  ← Impersonate / Suspendre / Notes internes
```

### Backend Symfony

**Entités**

- Modifier `User` : ajouter constante `ROLE_SUPERADMIN` (utilisée uniquement pour ton compte)
- Créer `AuditLog` :
  - `id`, `superAdminUser`, `action` (string), `targetType` (`centre|user|pointage|...`), `targetId`, `metadata` (json), `ip`, `userAgent`, `createdAt`
- Créer `CentreNote` (notes internes attachées à un centre, visibles par toi uniquement) :
  - `id`, `centre`, `superAdminUser`, `contenu`, `createdAt`

**Controllers et endpoints**

```
SuperAdminAuthController
  POST   /api/superadmin/auth/login        Login mot de passe (compte séparé)
  POST   /api/superadmin/auth/logout
  GET    /api/superadmin/auth/me           Vérifie session

SuperAdminDashboardController
  GET    /api/superadmin/dashboard         KPIs + MRR + activité + Sentry stats

SuperAdminCentresController
  GET    /api/superadmin/centres           Liste filtrable (search, plan, statut)
  GET    /api/superadmin/centres/{id}      Détail complet
  POST   /api/superadmin/centres/{id}/impersonate   Génère JWT impersonation
  POST   /api/superadmin/centres/{id}/notes         Ajoute note interne
  POST   /api/superadmin/centres/{id}/suspend       Suspend (action douce, lecture seule)
  POST   /api/superadmin/centres/{id}/reactivate
```

**Sécurité**

- Voter `SuperAdminVoter` : tous les endpoints `/api/superadmin/*` bloqués sauf si `ROLE_SUPERADMIN`
- Rate limiting sur `/api/superadmin/auth/login` : 5 tentatives / 15 min par IP
- Cookie session SuperAdmin séparé du JWT classique (durée 4h, renouvelable)

**Logique d'impersonation**

1. POST `/api/superadmin/centres/{id}/impersonate` retourne un JWT temporaire avec :
   ```json
   {
     "userId": <managerIdDuCentre>,
     "centreId": <centreId>,
     "impersonatedBy": <kevinUserId>,
     "exp": <now + 30 min>
   }
   ```
2. Frontend stocke ce JWT à la place du JWT normal
3. Toute requête API avec ce JWT logge automatiquement dans `AuditLog`
4. Bandeau rouge global : "🔴 Mode impersonation — Tu es connecté en tant que [Manager] du centre [Centre] — [Quitter]"
5. Actions destructrices (DELETE) refusées en mode impersonation
6. Bouton "Quitter" supprime le JWT impersonation et restaure la session SuperAdmin

### Sentry — intégration parallèle

**Setup**
- Compte Sentry gratuit, créer 2 projets : `shiftly-api` et `shiftly-app`
- Backend : `composer require sentry/sentry-symfony`, configurer DSN dans `.env`
- Frontend : `npm install @sentry/nextjs`, configurer wizard

**Tags ajoutés à chaque erreur** (côté back ET front)
- `centre_id`
- `centre_nom`
- `user_id`
- `user_role`
- `module` (pointage / planning / dashboard / ...)

**Implémentation**
- Côté Symfony : event subscriber qui hook sur l'auth et configure le scope Sentry
- Côté Next.js : dans `authStore.ts`, après login, appel `Sentry.setUser()` + `Sentry.setTags()`

**Intégration au SuperAdmin**
- Widget `SentryHealthWidget.tsx` dans le dashboard : nombre d'erreurs 7 jours + top 3 centres impactés
- Section `CentreDetailErrors.tsx` dans le détail centre : liste des erreurs Sentry filtrées sur le `centre_id` correspondant
- Utilise l'API REST Sentry (clé d'API stockée en `.env.local` et `.env`)

### Maquettes HTML à produire (Phase 1)

1. `superadmin-login.html`
2. `superadmin-dashboard.html` (refonte de l'existant pour s'aligner sur les décisions)
3. `superadmin-centres-list.html`
4. `superadmin-centre-detail.html`
5. `superadmin-impersonation-banner.html` (snippet à intégrer en haut de n'importe quelle page de l'app classique)

---

## PHASE 2 — Billing & Subscriptions (~5 jours)

> **Objectif** : visualiser et gérer tous les abonnements, voir les factures émises, gérer les plans tarifaires.
> **Pré-requis** : le chantier Stripe (chantier 2 du plan général) doit être terminé avant.

### Pages de l'interface

6. **`/superadmin/subscriptions`** — Liste de tous les abonnements actifs / suspendus / résiliés
7. **`/superadmin/billing`** — Liste des factures émises avec statuts paiement
8. **`/superadmin/pricing`** — Gestion des plans tarifaires (Starter / Pro / Enterprise)

### Composants frontend

```
src/app/(superadmin)/
  subscriptions/page.tsx
  billing/page.tsx
  pricing/page.tsx

src/components/superadmin/billing/
  SubscriptionsTable.tsx                  ← filtres : statut, plan, période
  SubscriptionDetailModal.tsx
  InvoicesTable.tsx                       ← filtres : période, statut
  InvoicePreviewModal.tsx
  PricingPlanCard.tsx                     ← édition d'un plan
  MrrEvolutionChart.tsx                   ← courbe MRR + new MRR + churn MRR
  ChurnAnalyticsWidget.tsx
```

### Backend Symfony

**Entités** (créées par le chantier Stripe, exploitées ici)

- `Subscription` (sync Stripe)
- `Invoice` (sync Stripe)
- `PricingPlan` (gestion locale, sync vers Stripe Products)

**Controllers et endpoints**

```
SuperAdminSubscriptionsController
  GET    /api/superadmin/subscriptions     Liste filtrable
  GET    /api/superadmin/subscriptions/{id}
  POST   /api/superadmin/subscriptions/{id}/cancel       Action exceptionnelle
  POST   /api/superadmin/subscriptions/{id}/refund

SuperAdminBillingController
  GET    /api/superadmin/invoices          Liste factures
  GET    /api/superadmin/invoices/{id}/download  PDF
  GET    /api/superadmin/billing/mrr-evolution

SuperAdminPricingController
  GET    /api/superadmin/pricing-plans
  POST   /api/superadmin/pricing-plans     Crée + push vers Stripe
  PATCH  /api/superadmin/pricing-plans/{id}
```

### Maquettes HTML à produire (Phase 2)

6. `superadmin-subscriptions.html`
7. `superadmin-billing.html`
8. `superadmin-pricing.html`

---

## PHASE 3 — Users globaux & Support (~4 jours)

> **Objectif** : voir tous les utilisateurs (tous centres confondus) et gérer les demandes de support entrantes.

### Pages de l'interface

9. **`/superadmin/users`** — Liste de tous les users de tous les centres
10. **`/superadmin/support`** — Tickets de support (demandes envoyées par les managers)

### Composants frontend

```
src/app/(superadmin)/
  users/page.tsx
  support/page.tsx

src/components/superadmin/users/
  UsersTable.tsx                          ← filtres : centre, rôle, statut, dernière connexion
  UserDetailDrawer.tsx                    ← infos + historique pointages + actions
  UserSearchBar.tsx

src/components/superadmin/support/
  SupportTicketsTable.tsx
  SupportTicketDetail.tsx
  SupportReplyForm.tsx
  TicketStatusBadge.tsx
```

### Backend Symfony

**Entités**

- Créer `SupportTicket` :
  - `id`, `centre`, `user` (auteur), `sujet`, `message`, `statut` (`OUVERT|EN_COURS|RESOLU|FERME`), `priorite` (`BASSE|MOYENNE|HAUTE|URGENTE`), `createdAt`, `assigneA`, `closedAt`
- Créer `SupportReply` :
  - `id`, `ticket`, `auteur` (user ou superadmin), `message`, `createdAt`, `interne` (bool — note interne non visible par le client)

**Controllers et endpoints**

```
SuperAdminUsersController
  GET    /api/superadmin/users             Liste filtrable
  GET    /api/superadmin/users/{id}
  POST   /api/superadmin/users/{id}/reset-password
  POST   /api/superadmin/users/{id}/disable

SuperAdminSupportController
  GET    /api/superadmin/support           Liste tickets
  GET    /api/superadmin/support/{id}
  POST   /api/superadmin/support/{id}/reply
  PATCH  /api/superadmin/support/{id}/status
  PATCH  /api/superadmin/support/{id}/priority

SupportController (côté app classique, pour le manager)
  POST   /api/support                      Créer un ticket depuis l'app
  GET    /api/support/mes-tickets          Voir ses propres tickets
```

### Maquettes HTML à produire (Phase 3)

9. `superadmin-users.html`
10. `superadmin-support.html`

---

## PHASE 4 — Activity & Settings (~4 jours)

> **Objectif** : avoir un audit trail complet et des réglages globaux pour piloter la plateforme.

### Pages de l'interface

11. **`/superadmin/activity`** — Audit log complet avec filtres avancés
12. **`/superadmin/settings`** — Réglages globaux (feature flags, config par centre, maintenance)

### Composants frontend

```
src/app/(superadmin)/
  activity/page.tsx
  settings/page.tsx

src/components/superadmin/activity/
  ActivityTimeline.tsx                    ← feed temporel
  ActivityFilters.tsx                     ← centre / user / type / période
  ActivityDetailModal.tsx

src/components/superadmin/settings/
  FeatureFlagsTable.tsx                   ← active/désactive modules par centre
  CentreFeatureToggle.tsx
  MaintenanceModeToggle.tsx               ← passe l'app en mode maintenance global
  GlobalLegalConfigPanel.tsx              ← valeurs par défaut IDCC 1790
  EmailTemplatesPanel.tsx
```

### Backend Symfony

**Entités**

- Créer `CentreFeature` :
  - `id`, `centre`, `featureKey` (string : `pointage`, `planning`, `tutoriels`, `entreprises`, `reservations`, ...), `enabled` (bool)
- Créer `MaintenanceMode` (singleton) :
  - `id`, `enabled` (bool), `message`, `startsAt`, `endsAt`

**Controllers et endpoints**

```
SuperAdminActivityController
  GET    /api/superadmin/activity          Audit log filtrable
  GET    /api/superadmin/activity/{id}

SuperAdminSettingsController
  GET    /api/superadmin/features          Liste features par centre
  PATCH  /api/superadmin/features/{centreId}/{featureKey}
  GET    /api/superadmin/maintenance
  PATCH  /api/superadmin/maintenance
  GET    /api/superadmin/global-legal-config
  PATCH  /api/superadmin/global-legal-config
```

### Maquettes HTML à produire (Phase 4)

11. `superadmin-activity.html`
12. `superadmin-settings.html`

---

## 3. Synthèse des maquettes HTML à produire

| # | Fichier | Phase |
|---|---|---|
| 1 | `superadmin-login.html` | 1 |
| 2 | `superadmin-dashboard.html` *(refonte)* | 1 |
| 3 | `superadmin-centres-list.html` | 1 |
| 4 | `superadmin-centre-detail.html` | 1 |
| 5 | `superadmin-impersonation-banner.html` | 1 |
| 6 | `superadmin-subscriptions.html` | 2 |
| 7 | `superadmin-billing.html` | 2 |
| 8 | `superadmin-pricing.html` | 2 |
| 9 | `superadmin-users.html` | 3 |
| 10 | `superadmin-support.html` | 3 |
| 11 | `superadmin-activity.html` | 4 |
| 12 | `superadmin-settings.html` | 4 |

Chaque maquette utilisera des **données fictives mais cohérentes** :
- 12 centres clients avec noms réalistes (bowlings, laser games, parcs)
- Des managers et employés fictifs
- Des metrics de MRR cohérentes (ex. 12 centres × 100€ ≈ 1 200€ MRR)
- Des erreurs Sentry plausibles
- Des dates récentes et cohérentes entre elles

---

## 4. Récap entités à créer / modifier (toutes phases)

| Entité | Phase | Action |
|---|---|---|
| `User` | 1 | + constante `ROLE_SUPERADMIN` |
| `AuditLog` | 1 | nouvelle |
| `CentreNote` | 1 | nouvelle |
| `Subscription` | 2 | nouvelle (créée par chantier Stripe) |
| `Invoice` | 2 | nouvelle (créée par chantier Stripe) |
| `PricingPlan` | 2 | nouvelle |
| `SupportTicket` | 3 | nouvelle |
| `SupportReply` | 3 | nouvelle |
| `CentreFeature` | 4 | nouvelle |
| `MaintenanceMode` | 4 | nouvelle |

---

## 5. Dépendances inter-phases et chantiers

```
Sentry              ──┐
Phase 1 SuperAdmin  ──┴──> Disponible immédiatement

Chantier Stripe     ────> Phase 2 SuperAdmin (Billing)

Phase 1 SuperAdmin  ──┐
Phase 2 SuperAdmin  ──┼──> Phase 4 SuperAdmin (Activity & Settings utilise les données accumulées)
Phase 3 SuperAdmin  ──┘
```

---

## 6. Prochaine étape

1. **Tu valides ce plan** (modifications souhaitées ?)
2. Je produis les **5 maquettes HTML de la Phase 1** dans la foulée (lot 1)
3. Tu les valides
4. Je rédige le **prompt Claude Code Phase 1** (incluant Sentry)
5. Tu lances dans Claude Code
6. Une fois Phase 1 livrée, on enchaîne sur les maquettes Phase 2 puis le code, etc.

---

## 7. Documents impactés à mettre à jour

À chaque phase livrée, mise à jour obligatoire (règle CLAUDE.md #15) :
- `ARCHITECTURE.md` (nouvelle route `/superadmin`, nouveaux composants, nouveaux hooks)
- `DESIGN_SYSTEM.md` (nouveaux composants partagés)
- `ENTITES.md` (nouvelles entités)
- `schema.sql` (migrations)
- `SUPERADMIN_MODULE.md` (nouveau document, à créer en même temps que la Phase 1)
