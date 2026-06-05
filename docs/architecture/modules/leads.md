# Module Leads — capture publique

> Module ARCHITECTURE — [retour à l'index](../../../ARCHITECTURE.md)


Capture des prospects depuis la landing publique `shiftly.fr` (`/`) jusqu'au
back-office `/superadmin/leads` pour qualification commerciale.

### Architecture

```
Landing /  →  fetch POST /api/leads (anonyme)
                      ↓
              LeadController::create
                · validation (Assert\Collection)
                · throttling 3/email/24h
                · persist
                · dispatch LeadCreatedEvent
                      ↓
              LeadNotifier (listener)
                · render email HTML
                · Symfony Mailer → Gmail SMTP
                · destinataire LEAD_NOTIFICATION_EMAIL
                · try/catch silencieux (log only)
                      ↓
              kevin@shiftly.fr (Gmail)
```

### Backend (`shiftly-api/`)

- `src/Entity/Lead.php` — entité hors multi-tenant, status workflow, FK nullable `handledBy → User`
- `src/Repository/LeadRepository.php` — `findFilteredForSuperAdmin`, `countRecentByEmail`, stats
- `src/Event/LeadCreatedEvent.php`
- `src/Service/Mail/LeadNotifier.php` — `#[AsEventListener]` sur `LeadCreatedEvent`
- `src/Controller/LeadController.php` — `POST /api/leads` (public)
- `src/Controller/SuperAdminLeadController.php` — endpoints back-office (`ROLE_SUPERADMIN`)
- `src/Security/Voter/LeadVoter.php` — `LEAD_VIEW` / `LEAD_EDIT` réservés à `ROLE_SUPERADMIN`
- `config/packages/security.yaml` — whitelist `^/api/leads$` (POST) en `PUBLIC_ACCESS`
- `config/services.yaml` — wiring `$notificationEmail` + `$appBaseUrl`
- `migrations/Version20260603005601.php` — table `lead` (MySQL · PostgreSQL · SQLite)

### Endpoints API

| Méthode | Route | Accès |
|---|---|---|
| POST  | `/api/leads`                       | **PUBLIC** (landing) |
| GET   | `/api/superadmin/leads/stats`      | SuperAdmin |
| GET   | `/api/superadmin/leads`            | SuperAdmin |
| GET   | `/api/superadmin/leads/{id}`       | SuperAdmin |
| PATCH | `/api/superadmin/leads/{id}`       | SuperAdmin |

### Frontend (`shiftly-app/`)

- `src/types/lead.ts` — types stricts alignés sur l'entité Symfony
- `src/hooks/useLeads.ts` — `useLeads`, `useLead`, `useLeadsStats`, `useUpdateLeadStatus`, `useUpdateLeadNotes`
- `src/components/superadmin/leads/` :
  - `leadMeta.ts` — libellés/couleurs/emojis (source de vérité UI)
  - `LeadsKpiBar.tsx` · `LeadsFilters.tsx` · `LeadsTable.tsx`
  - `LeadStatusBadge.tsx` · `LeadActionsRow.tsx` · `LeadDetailPanel.tsx`
- `src/app/superadmin/leads/page.tsx` — liste paginée
- `src/app/superadmin/leads/[id]/page.tsx` — détail (workflow + notes)
- `src/components/superadmin/SuperAdminSidebar.tsx` — item "Leads" dans Phase 3 avec badge `nouveauxNonTraités`

### Variables d'environnement (Backend)

```
GMAIL_USER=vanphavongk45@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx    # App Password Google (16 caractères)
LEAD_NOTIFICATION_EMAIL=vanphavongk45@gmail.com
APP_BASE_URL=https://app.shiftly.fr    # utilisé pour le lien profond dans l'email
MAILER_DSN=gmail+smtp://${GMAIL_USER}:${GMAIL_APP_PASSWORD}@default
```

Procédure complète App Password : `docs/SETUP_EMAIL.md`.

### Anti-flood

`LeadRepository::countRecentByEmail()` — si ≥ 3 leads avec le même email dans
les dernières 24h, le POST renvoie **429**. Garde-fou simple sans dépendance au
`RateLimiter` Symfony (qui ciblerait l'IP plutôt que l'email).

### Multi-tenancy

`Lead` est volontairement HORS multi-tenant : pas de `centre_id`. Le `LeadVoter`
teste uniquement `ROLE_SUPERADMIN`, donc seul Kévin voit les leads. Aucun
manager / employé ne peut accéder aux endpoints back-office.
