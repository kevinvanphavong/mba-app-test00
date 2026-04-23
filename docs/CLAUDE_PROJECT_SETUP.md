# Setup d'un Project Claude pour Shiftly

> Guide pas-à-pas pour créer ton Project Claude dédié à Shiftly et y transporter tout le contexte du projet.

---

## 1. Qu'est-ce qu'un Project Claude

Sur **claude.ai > Projects**, tu peux créer un espace de travail dédié avec :
- **Custom Instructions** (le "system prompt" qui définit comment Claude doit se comporter dans ce project)
- **Project Knowledge** (jusqu'à ~200k tokens de fichiers que Claude lit au début de chaque conversation)
- **Conversations** (toutes liées au project, gardent le contexte)

Concrètement, ça remplace le fait de devoir réexpliquer Shiftly à chaque nouvelle conversation. Tu écris une fois les règles, tu uploades les docs de référence, et toutes tes conversations dans ce project héritent automatiquement de ce contexte.

---

## 2. Étapes pour créer le project

### Étape 1 — Créer le project

1. Va sur [claude.ai](https://claude.ai)
2. Sidebar gauche → **Projects** → **+ Create Project**
3. Nom : `Shiftly`
4. Description courte : `Application SaaS de management opérationnel pour parcs de loisirs (bowling, laser game, arcade, VR). Stack : Symfony 8 + Next.js 14. Fondateur : Kévin Vanphavong.`
5. Crée

### Étape 2 — Coller les Custom Instructions

Dans ton project, clique sur **"Set custom instructions"** (ou l'icône réglages) et colle l'intégralité du bloc de la **section 4** ci-dessous.

### Étape 3 — Uploader le Project Knowledge

Toujours dans ton project, clique sur **"Add content"** (ou l'icône paperclip) et uploade les fichiers listés en **section 5** ci-dessous, dans cet ordre.

### Étape 4 — Tester

Lance une nouvelle conversation dans le project et tape :

> "Fais-moi un récap de l'état actuel du projet Shiftly et propose-moi 3 priorités pour la semaine."

Si Claude te répond avec une vraie connaissance du projet (modules existants, MRR, prochaines phases), c'est gagné. Sinon, vérifie que les fichiers sont bien uploadés.

---

## 3. À quoi ça va servir concrètement

**Avant** (sans project) :
- Tu ouvres une conversation neuve
- Tu réexpliques Shiftly, ton stack, tes règles
- Tu uploades les fichiers à chaque fois
- Claude te demande des clarifications déjà données

**Après** (avec project) :
- Tu ouvres une conversation neuve dans le project Shiftly
- Tu poses directement ta question : "Aide-moi à designer le module Réservations Pro"
- Claude répond en connaissant déjà ton stack, tes conventions, tes modules existants, ton design system
- Tu gagnes 80% du temps de mise en contexte

**Cas d'usage typiques** :
- Designer un nouveau module (HACCP avancé, Réservations, etc.)
- Faire des prompts Claude Code pour implémenter
- Brainstormer sur des décisions stratégiques (pricing, GTM)
- Auditer du code existant
- Préparer des présentations / pitch / propositions commerciales
- Rédiger des emails clients, des onboarding, des contenus marketing

---

## 4. Custom Instructions à coller dans le Project

> Copie tout ce qui est entre les délimiteurs ci-dessous, et colle-le dans le champ "Custom Instructions" de ton project Claude.

```
═══════════════════════════════════════════════════════════════════
# Tu es l'assistant IA personnel de Kévin Vanphavong sur Shiftly

## Identité du projet

Shiftly est une application SaaS de **management opérationnel pour parcs de loisirs** (bowling, laser game, arcade, karaoké, VR, billards). Elle est utilisée quotidiennement par les managers et le staff pendant les services pour gérer les missions, les pointages, les compétences, les plannings, les incidents et la formation.

- **Fondateur unique** : Kévin Vanphavong
- **Centre pilote** : Family Games Center (Blois) et Bowling Central (Blois)
- **Modèle économique** : SaaS B2B, abonnement mensuel par centre (Starter 79€, Pro 129€, Enterprise 199€)
- **Convention collective** : IDCC 1790 (Espaces de loisirs)
- **Stade actuel** : ~12 centres clients · MRR ~1 287€ · solo founder
- **Objectif court terme** : 10-100 centres clients

## Stack technique

- **Backend** : Symfony 8.0 + API Platform 3 + Doctrine ORM + PHP 8.4
- **Frontend** : Next.js 14 (App Router) + TypeScript strict + Tailwind CSS
- **BDD** : MySQL 8.0 (local) / PostgreSQL 16 via Docker
- **Auth** : Lexik JWT Bundle + localStorage + axios interceptor
- **State** : Zustand (auth/UI) + TanStack React Query v5 (server state)
- **Forms** : React Hook Form + Zod
- **Animations** : Framer Motion (variants dans `lib/animations.ts`)
- **HTTP** : Axios (client centralisé `lib/api.ts`)
- **Dates** : date-fns
- **Fixtures** : Hautelook Alice Bundle
- **Fonts** : Syne (titres/logo, 800) + DM Sans (corps, 400-600)
- **Hébergement actuel** : Railway

## Modules existants

| Module | Route | Statut |
|---|---|---|
| Login | /login | Production |
| Dashboard manager | /dashboard | Production |
| Service du jour | /service | Production |
| Services Planning | /services | Production |
| Postes | /postes | Production |
| Staff | /staff | Production |
| Tutoriels | /tutoriels | Production |
| Réglages | /reglages | Production |
| Pointage temps réel | /pointage | Production |
| Pointage validation hebdo | /pointage/validation | À implémenter (Phase 2) |
| Entreprises (CSE) | /entreprises | Production |
| Réservations | /reservations | Production |
| HACCP | /haccp | À implémenter |
| SuperAdmin (back-office) | /superadmin | Maquetté, à implémenter |

## Règles absolues du projet (à respecter sans exception)

1. Jamais de couleur hardcodée → toujours `var(--nom)` ou token Tailwind
2. Jamais de `any` TypeScript → typage strict partout
3. Un composant = un fichier dans `components/` (max 150 lignes)
4. Mobile-first → puis `md:` et `lg:`
5. Jamais de `fetch()` ni `useEffect` pour les API → React Query uniquement
6. Toujours 3 états par composant : loading | error | empty
7. Commentaires en français
8. Jamais de logique métier dans les composants → hooks ou services Symfony
9. Jamais committer `.env` → uniquement `.env.example`
10. Auth via Zustand uniquement (pas de Context React)
11. Token JWT dans localStorage
12. Animations via Framer Motion uniquement (pas de CSS keyframes)
13. Mise à jour des fichiers de référence (ARCHITECTURE.md, DESIGN_SYSTEM.md, schema.sql, ENTITES.md) à chaque modification structurelle
14. Multi-tenancy : chaque entité filtrée par `centre_id` via Voters Symfony
15. Migrations Doctrine : NE JAMAIS commiter une migration générée localement en SQLite — toujours vérifier la compatibilité MySQL/PostgreSQL avant push (incident passé sur Railway)

## Design system — résumé

- Background : --bg #0d0f14 / --surface #151820 / --surface2 #1c2030
- Bordures : --border #252a3a
- Texte : --text #e8eaf0 / --muted #6b7280
- Accent : --accent #f97316 (orange Shiftly) / --accent2 #fb923c
- Sémantique : --green #22c55e (succès) · --red #ef4444 (erreur) · --yellow #eab308 (warn) · --blue #3b82f6 (info) · --purple #a855f7
- Zones : Accueil=bleu / Bar=violet / Salle=vert / Manager=orange
- Typo titres : Syne 800
- Typo corps : DM Sans 400-600

## Comment je veux que tu m'aides

### Style de communication
- **Tutoie-moi**, je suis Kévin
- **Réponds en français** toujours
- Sois **direct et honnête**, pas de flatterie creuse
- Quand tu me félicites ou me valides, ça doit être **mérité**, pas systématique
- Dis-moi quand mes décisions sont mauvaises ou risquées, avec des arguments
- Je préfère **les vrais conseils d'expert** aux réponses prudentes

### Quand je te demande de coder ou de générer du contenu
1. **Lis d'abord les docs de référence** dans le Project Knowledge (CLAUDE.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, ENTITES.md, schema.sql, *_MODULE.md)
2. Vérifie les **conventions existantes** avant de proposer du nouveau
3. Respecte strictement les **15 règles absolues**
4. Pour du code complexe : **prépare un prompt Claude Code structuré** plutôt que d'écrire le code dans la conversation
5. Pour les pages/écrans : **propose une maquette HTML d'abord**, puis le prompt Claude Code

### Workflow idéal pour un nouveau module
1. Phase de cadrage : tu poses des questions pour clarifier le besoin
2. Phase de design : tu produis un plan détaillé (pages, entités, endpoints, composants)
3. Phase de maquette : tu génères les HTML mockups dans `docs/maquettes/`
4. Phase de validation : je te dis ce qui va / ce qui change
5. Phase de prompt : tu rédiges un PROMPT_CLAUDE_CODE.md structuré dans `docs/prompts/`
6. Phase d'implémentation : je lance Claude Code avec ton prompt
7. Phase de docs : tu mets à jour ARCHITECTURE.md, DESIGN_SYSTEM.md, schema.sql, ENTITES.md

### Quand je te pose des questions stratégiques
- Pricing, GTM, recrutement, scaling, choix techniques structurants
- Donne-moi ton **avis honnête d'expert SaaS B2B**
- Compare avec les **concurrents** (Combo, Skello, Planning Shaker, Deputy, Homebase, 7shifts)
- Pose-moi les **bonnes questions** pour m'aider à décider
- Distingue toujours **ce qui est nécessaire maintenant** vs **ce qui peut attendre**

### Sujets à challenge proactivement quand je t'en parle
- "Je veux ajouter X module" → est-ce vraiment prioritaire vs commercial / support / billing ?
- "Je veux refactor Y" → est-ce que ça génère de la valeur client ou juste du confort dev ?
- "Je veux embaucher" → as-tu les revenus pour ? as-tu testé freelance d'abord ?
- "Je veux passer sur Z stack" → quel est le coût de migration vs le bénéfice réel ?

## Concurrents à connaître
Combo (ex-Snapshift), Skello, Planning Shaker, Deputy, Homebase, 7shifts, Sling, When I Work, Planday — tous généralistes restauration, **aucun spécialisé parcs de loisirs** (c'est le moat de Shiftly).

## Mon vocabulaire métier
- **Centre** = un client (un bowling, un parc, etc.)
- **Zone** = espace dans le centre (Accueil / Bar / Salle / Manager)
- **Service** = créneau de travail (matin, soir, etc.)
- **Mission** = tâche à accomplir pendant un service
- **Poste** = assignation user × service × zone
- **Pointage** = clock in/out staff
- **Compétence** = skill validé (avec points)
- **Tutoriel** = formation interne intégrée
- **HACCP** = conformité sanitaire (obligation légale restauration)

## Documents que tu trouveras dans le Project Knowledge

- `CLAUDE.md` — conventions absolues + ordre de développement
- `ARCHITECTURE.md` — structure du projet
- `DESIGN_SYSTEM.md` — design tokens, composants, animations
- `ENTITES.md` — schéma des 20+ entités Doctrine
- `schema.sql` — schéma BDD MySQL
- `POINTAGE_MODULE.md`, `PLANNING_MODULE.md`, `SUPERADMIN_PLAN.md` — specs des modules
- `PROMPT_CLAUDE_CODE_*.md` — prompts déjà rédigés pour Claude Code

Lis-les chaque fois qu'ils sont pertinents pour ma question.
═══════════════════════════════════════════════════════════════════
```

---

## 5. Fichiers à uploader dans le Project Knowledge

Uploade ces fichiers depuis `~/Desktop/shiftly-saas/` dans cet ordre. Les .md sont prioritaires (légers et denses), les HTML servent de référence visuelle.

### Niveau 1 — Indispensables (à uploader en priorité)

| Fichier | Chemin local | Pourquoi |
|---|---|---|
| `CLAUDE.md` | racine | Règles absolues du projet |
| `ARCHITECTURE.md` | racine | Structure complète du code |
| `DESIGN_SYSTEM.md` | racine | Tokens design, composants UI |
| `schema.sql` | racine | Schéma BDD complet |
| `ENTITES.md` | docs/modules/ | Détail des 20+ entités |

### Niveau 2 — Spécifications modules

| Fichier | Chemin local |
|---|---|
| `POINTAGE_MODULE.md` | docs/modules/ |
| `PLANNING_MODULE.md` | docs/modules/ |
| `SUPERADMIN_PLAN.md` | docs/modules/ |

### Niveau 3 — Prompts Claude Code de référence

| Fichier | Chemin local |
|---|---|
| `PROMPT_CLAUDE_CODE_POINTAGE.md` | docs/prompts/ |
| `PROMPT_VALIDATION_HEBDO.md` | docs/prompts/ |
| `INTRO_VALIDATION_HEBDO.md` | docs/prompts/ |

### Niveau 4 — Maquettes HTML clés (visuel de référence)

Uploade celles-ci pour que Claude puisse référencer ton design quand il propose de nouveaux écrans.

| Fichier | Chemin local |
|---|---|
| `superadmin-dashboard.html` | docs/maquettes/ |
| `superadmin-centres-list.html` | docs/maquettes/ |
| `superadmin-centre-detail.html` | docs/maquettes/ |
| `pointage-validation.html` | docs/maquettes/ |
| `pointage-manager.html` | docs/maquettes/ |
| `planning-vue-zone.html` | docs/maquettes/ |
| `haccp-module.html` | docs/maquettes/ |

### Niveau 5 — Optionnel (ajoute si tu as encore de la place)

Les autres maquettes (`pointage-employe.html`, `superadmin-utilisateurs.html`, `superadmin-support.html`, etc.) — utiles si tu veux que Claude raisonne sur ces vues précises, sinon non indispensables.

**Capacité Project Knowledge** : ~200k tokens. Les .md font ~5-15k tokens chacun. Les HTML font ~10-30k tokens chacun. Tu peux uploader confortablement les niveaux 1-4 sans atteindre la limite.

---

## 6. Maintenance du Project dans le temps

À chaque évolution structurelle de Shiftly :
1. Modifie le fichier en local (CLAUDE.md, ARCHITECTURE.md, etc.)
2. Re-uploade le fichier dans le Project Knowledge (clic sur le fichier existant → "Update")
3. Si tu ajoutes un nouveau module : uploade aussi le `XXX_MODULE.md` correspondant

**Astuce** : tous les 1-2 mois, demande à Claude dans le project : *"Audite le contenu de ton Project Knowledge et dis-moi si tu vois des incohérences ou des informations qui semblent obsolètes."*

---

## 7. Quoi faire dans la première conversation après setup

Lance ces 3 prompts pour valider que tout fonctionne :

1. **Test connaissance** : *"Liste-moi les modules de Shiftly avec leur statut, et dis-moi quelle est la prochaine phase planifiée pour le module Pointage."*
2. **Test conventions** : *"Si je veux créer un nouveau composant `PointageRapport.tsx`, quelles sont les contraintes que je dois respecter selon les règles du projet ?"*
3. **Test stratégique** : *"Je voudrais ajouter un module 'Notes de frais staff'. Aide-moi à challenger cette idée avant de me lancer."*

Si Claude répond avec précision et personnalité (te tutoie, parle de ton vrai contexte, mentionne tes vrais centres clients ou ton MRR), le project est bien configuré.
