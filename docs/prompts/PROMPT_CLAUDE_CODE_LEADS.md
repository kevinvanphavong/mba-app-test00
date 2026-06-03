# PROMPT — Module Leads (prospects landing) + back-office /superadmin/leads

> Créer l'entité `Lead`, l'endpoint public `POST /api/leads` qui notifie Kévin par email Gmail, et la page back-office `/superadmin/leads` pour traiter les demandes.

## Contexte
La landing publique à `/` (cf. `PROMPT_CLAUDE_CODE_LANDING.md`) capture 3 types de demandes via une modale : **essai gratuit**, **démo en visio**, **projet sur mesure**. Chaque soumission doit créer un `Lead` côté Symfony, déclencher un email de notification vers `vanphavongk45@gmail.com`, et apparaître dans `/superadmin/leads` pour traitement manuel par Kévin. Ce chantier peut être lancé **avant** ou **en parallèle** du prompt LANDING.

## Décisions actées (à ne pas remettre en cause)
- Entité **hors multi-tenant** : pas de `centre_id`, c'est un prospect public, pas un user
- Endpoint `POST /api/leads` **public** (aucun JWT requis)
- Notification email Gmail SMTP via **App Password** Google, destinataire = `vanphavongk45@gmail.com`
- Workflow status : `nouveau → contacté → qualifié → converti | perdu`
- Accès `/superadmin/leads` : `ROLE_SUPERADMIN` uniquement (cohérent avec le reste du back-office)
- Consentement RGPD obligatoire, horodaté en BDD (preuve légale)

## Fichiers à lire avant de coder
1. `CLAUDE.md` — règles absolues (15 règles, surtout règle 15 migrations MySQL/PG safe)
2. `ARCHITECTURE.md` — patterns Symfony (Controllers, Services, Voters), Next.js superadmin
3. `DESIGN_SYSTEM.md` §11 — back-office SuperAdmin (KPI Card, Widget Shell, Status Badges)
4. `shiftly-api/src/Entity/SupportTicket.php` — pattern entité avec status / workflow / horodatage
5. `shiftly-api/src/Controller/DashboardController.php` — pattern controller custom + sérialisation
6. `shiftly-app/src/app/superadmin/centres/page.tsx` — pattern page back-office (liste + filtres)
7. `docs/maquettes/landing-shiftly.html` — JS `[Shiftly Lead]` payload de la modale (référence du contrat de données)

## Tâche

### Back-end Symfony

**Entité `Lead`** (`src/Entity/Lead.php`) — **pas** de FK vers Centre / User
- Constantes :
  - `INTENT_TRIAL`, `INTENT_DEMO`, `INTENT_CUSTOM`
  - `PLAN_STARTER`, `PLAN_PRO`, `PLAN_PREMIUM`, `PLAN_UNDECIDED`
  - `STATUS_NOUVEAU`, `STATUS_CONTACTE`, `STATUS_QUALIFIE`, `STATUS_CONVERTI`, `STATUS_PERDU`
  - `CHANNEL_MEET`, `CHANNEL_ZOOM`, `CHANNEL_TEAMS`, `CHANNEL_PHONE`
  - `ACTIVITY_BOWLING`, `ACTIVITY_LASER`, `ACTIVITY_ARCADE`, `ACTIVITY_KARAOKE`, `ACTIVITY_VR`, `ACTIVITY_MIXTE`, `ACTIVITY_AUTRE`
- Champs :
  - `id`, `intent` (string 20), `plan` (string 20)
  - `name` (string 120), `email` (string 180), `phone` (string 30)
  - `centre` (string 180), `activity` (string 30), `staffSize` (string 20)
  - `city` (string 120 nullable), `zip` (string 10 nullable)
  - `preferredSlot` (text nullable, démo)
  - `channel` (string 20 nullable, démo)
  - `customNeeds` (text nullable, sur-mesure)
  - `message` (text nullable)
  - `consent` (bool), `consentAt` (datetime_immutable)
  - `source` (string 80, ex `shiftly.fr (landing /)`)
  - `status` (string 20, default `STATUS_NOUVEAU`)
  - `notes` (text nullable, journal interne Kévin)
  - `handledBy` (ManyToOne User nullable, SuperAdmin qui prend en charge)
  - `handledAt` (datetime_immutable nullable)
  - `createdAt`, `updatedAt` (lifecycle callbacks `prePersist`, `preUpdate`)
- Index :
  - `idx_lead_status` sur `status`
  - `idx_lead_created_at` sur `created_at` DESC
  - `idx_lead_intent` sur `intent`

**Migration Doctrine** — règle 15 : vérifier la compat MySQL/PostgreSQL avant push (pas de `__temp__`, pas de double-quote SQLite-style).

**Controller public `LeadController`** (`src/Controller/LeadController.php`)
- Route `POST /api/leads` accessible sans JWT (`#[Route]` + `#[IsGranted('PUBLIC_ACCESS')]` ou config security.yaml)
- Désérialisation + validation Symfony (`#[Assert\NotBlank]`, `#[Assert\Email]`, `#[Assert\IsTrue]` sur consent)
- Throttling basique : max 3 leads avec le même email en 24h (sinon 429)
- `consentAt = new \DateTimeImmutable()` au moment du POST
- `source` accepté tel quel depuis le payload (string 80 max, fallback `inconnu`)
- Réponse 201 `{ id, status: 'nouveau', createdAt }`, jamais le détail complet (pas de risque IDOR)
- Envoie un événement `LeadCreatedEvent` (dispatcher Symfony) pour découpler la notif email

**Service `LeadNotifier`** (`src/Service/Mail/LeadNotifier.php`)
- Listener sur `LeadCreatedEvent`
- Construit un email HTML simple : titre "Nouveau lead Shiftly · {intent} · {plan}", corps avec tous les champs du lead + lien `https://app.shiftly.fr/superadmin/leads/{id}`
- Envoi via Symfony Mailer + transport SMTP Gmail (cf. variables d'env ci-dessous)
- Destinataire : valeur de `LEAD_NOTIFICATION_EMAIL` (par défaut `vanphavongk45@gmail.com`)
- Try/catch silencieux : si l'email échoue, **on ne plante pas la création du Lead** (log erreur seulement)

**Variables d'environnement** (à documenter dans `.env.example`)
```
GMAIL_USER=vanphavongk45@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx
LEAD_NOTIFICATION_EMAIL=vanphavongk45@gmail.com
MAILER_DSN=gmail+smtp://${GMAIL_USER}:${GMAIL_APP_PASSWORD}@default
```

**API Platform / endpoints back-office** (`#[ApiResource]` ou controllers custom)
- `GET /api/superadmin/leads` — liste (SuperAdmin), filtres `?status=`, `?intent=`, `?plan=`, `?q=` (search nom/email/centre), pagination par 30, tri par défaut `createdAt DESC`
- `GET /api/superadmin/leads/{id}` — détail
- `PATCH /api/superadmin/leads/{id}` — update `status`, `notes`, `handledBy` (auto-fill avec user courant)
- Voter `LeadVoter` : `VIEW`, `EDIT` réservés à `ROLE_SUPERADMIN`

### Front Next.js — back-office `/superadmin/leads`

**Types** `src/types/lead.ts` — strict, énums alignés avec constantes Symfony

**Hooks React Query** `src/hooks/useLeads.ts`
- `useLeads({ status, intent, plan, q, page })` — liste paginée
- `useLead(id)` — détail
- `useUpdateLeadStatus(id)` — PATCH status + handledBy
- `useUpdateLeadNotes(id)` — PATCH notes

**Composants** `src/components/superadmin/leads/` (≤ 150 lignes chacun)
1. `LeadsKpiBar.tsx` — 4 KPI Card : nouveaux ce mois · taux conversion · leads > 48h non traités (warning) · MRR potentiel (somme des plans choisis)
2. `LeadsFilters.tsx` — chips intent / status / plan + search input
3. `LeadsTable.tsx` — table : date, intent (emoji + label), plan (badge), nom, centre, ville, status (badge), action "Voir"
4. `LeadDetailPanel.tsx` — panel latéral ou page `/superadmin/leads/[id]` : toutes les infos + actions (Contacté / Qualifié / Converti / Perdu + textarea notes)
5. `LeadStatusBadge.tsx` — réutilise styles `Status Badges SuperAdmin` du DESIGN_SYSTEM §11.6
6. `LeadActionsRow.tsx` — boutons `mailto:` + `tel:` directs

**Pages**
- `src/app/superadmin/leads/page.tsx` — liste (default sort par status `nouveau` puis date)
- `src/app/superadmin/leads/[id]/page.tsx` — détail (ou panneau latéral, au choix selon UX)

**Sidebar SuperAdmin** (`src/components/superadmin/SuperAdminSidebar.tsx` ou navigation source)
- Ajouter item "Leads" dans **Phase 3 — Users & Support** (ou créer phase dédiée), avec badge nombre de leads `nouveau`
- Icône `📨` ou `🎯`

### Multi-tenancy
- `Lead` n'a **pas** de `centre_id` — c'est un prospect, pas un user d'un centre. Le Voter teste uniquement `ROLE_SUPERADMIN`.
- Pas de fuite : seul Kévin (SuperAdmin) voit les leads.

## Notes techniques
- **Gmail App Password** : il faut activer la 2FA sur le compte Google de Kévin puis générer un App Password (Sécurité → Mots de passe d'application). Le mot de passe à 16 caractères va dans `GMAIL_APP_PASSWORD`. Documenter dans `docs/SETUP_EMAIL.md`.
- **Migration Doctrine** : ne JAMAIS générer en SQLite. Génère sur la BDD MySQL locale puis relis le SQL produit (pas de `__temp__`, pas de `"user"` quoté).
- **Throttling** : utiliser `RateLimiter` Symfony si dispo, sinon une simple query `count(WHERE email = X AND created_at > now() - 24h)`.
- **Email HTML** : pas besoin de template Twig sophistiqué — un simple wrapper inline-styled avec les champs lisibles, lien vers le back-office. Si tu veux, base-toi sur les emails Symfony Mailer twig templates pattern.
- **Pas d'API Platform full CRUD exposé en public** : seul le POST est public. Le reste passe par controllers custom protégés.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
php bin/console doctrine:migrations:status
cd ../shiftly-app
npm run lint && npm run build
```

### Tests fonctionnels
- [ ] `curl -X POST http://localhost:8000/api/leads -d '{"intent":"demo",...}' -H "Content-Type: application/json"` → 201 + Lead persisté + email reçu sur Gmail Kévin
- [ ] Même requête sans consent → 422 erreur validation
- [ ] Même requête sans JWT → 201 (route publique)
- [ ] 4× même email en moins de 24h → 4ème en 429
- [ ] Login `/superadmin`, naviguer `/superadmin/leads` → liste visible, lead test apparaît
- [ ] Cliquer un lead → détail affiche tous les champs
- [ ] Changer status à "Contacté" → `handledBy` rempli auto avec le user courant, `handledAt` horodaté
- [ ] Filtrer par `intent=demo` → seuls les leads démo affichés
- [ ] Recherche par email du lead test → trouvé
- [ ] Login comme MANAGER (pas SuperAdmin) → accès `/superadmin/leads` refusé (403 ou redirect)

### Critères d'acceptation
- [ ] Migration Doctrine compatible MySQL ET PostgreSQL (relue manuellement)
- [ ] Aucun composant > 150 lignes
- [ ] Aucun `any` TS
- [ ] Aucun `useEffect` pour fetch API (React Query partout)
- [ ] Email reçu sous 5 secondes après POST (sinon investiguer le throttle Gmail)
- [ ] `consent=false` rejette le POST avec un message clair
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte
- [ ] Le `LeadVoter` est appelé sur **chaque** endpoint back-office (pas de fuite)

### Auto-relecture du diff
`git diff main..HEAD` et relis en hostile : peut-on flooder l'endpoint public ? le mot de passe Gmail est-il commité par erreur dans un fixture ? la migration tourne-t-elle sur Railway PostgreSQL sans erreur ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Mise à jour des docs (obligatoire fin de chantier)
- [ ] `schema.sql` ← table `lead` complète avec index
- [ ] `ENTITES.md` ← entité `Lead` (champs, énums, voter, hors multi-tenant)
- [ ] `ARCHITECTURE.md` ← route `POST /api/leads`, page `/superadmin/leads`, service `LeadNotifier`
- [ ] `DESIGN_SYSTEM.md` ← section back-office leads (KPI Lead, table layout)
- [ ] `CLAUDE.md` ← ligne modules : `/superadmin/leads` statut Production
- [ ] `.env.example` ← variables `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `LEAD_NOTIFICATION_EMAIL`
- [ ] **Nouveau** `docs/SETUP_EMAIL.md` ← procédure App Password Google en 5 étapes

## Livraison
1. Commits atomiques (`feat(lead): entity + migration`, `feat(lead): public POST endpoint`, `feat(lead): gmail notifier`, `feat(superadmin): leads list + filters`, `feat(superadmin): lead detail + actions`, etc.)
2. Rapport vérification (cases cochées + screenshot email reçu + payload curl)
3. Note : ne pas commiter le `.env` avec le vrai App Password — `.env.example` seulement
4. Tu push pas. Kévin push.
