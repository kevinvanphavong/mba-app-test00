# Pont de synchronisation FGC → Shiftly

> **Décision (2026-07-03).** Répartition des rôles : le site client (`fgc-website-claude`,
> monorepo `apps/web` + `apps/api`) gère le **web** (vitrine, contenu, compte client, création
> de réservations/B2B, paiement). **Shiftly est le hub central** où ces données sont **stockées
> et gérées** (cockpit manager) et reliées à l'opérationnel (planning, staff). Flux **unidirectionnel
> FGC → Shiftly**. On garde les modules Shiftly, on **modifie FGC pour qu'il émette**.

## Principe

```
[ Site FGC (apps/web) ]  →  [ apps/api : crée résa/B2B, encaisse ]  ──push──►  [ Shiftly : stocke + gère ]
        front public                backend web propre              (endpoint ingestion)     cockpit manager + planning
```

- **Source de la création** : `apps/api` (FGC). Il reste maître de son web et de son paiement.
- **Destination de gestion** : Shiftly. Le manager voit/gère résa & B2B dans le cockpit existant.
- Le pont **ne remonte jamais** de Shiftly vers FGC (pas de bidirectionnel en v1).

## Architecture du flux

**Côté FGC (`apps/api`) — émission :**
1. Dans les State Processors existants (`BirthdayReservationProcessor`, `B2BDevisRequestProcessor`,
   et l'équivalent avis/contact), **après** la persistance locale réussie, dispatcher un message
   Messenger (`PushToShiftly`) — **async**, pour que Shiftly indisponible **ne fasse jamais échouer**
   une réservation web.
3. Un handler poste le payload vers l'endpoint d'ingestion Shiftly, avec la **clé API du centre**.
   Retry Messenger si Shiftly répond en erreur (résilience).

**Côté Shiftly — ingestion (à créer) :**
2. Nouveaux endpoints sous `^/api/ingest`, **auth machine-to-machine par clé API** (header
   `X-Shiftly-Ingest-Key`), **pas** de JWT ni de résolution par host. La clé mappe vers **un centre**.
4. Chaque endpoint valide, **mappe** le payload FGC vers l'entité Shiftly, **stocke** en le rattachant
   au `centre_id` de la clé. **Idempotent** via une référence externe (`sourceRef` = référence FGC).

## Endpoints d'ingestion Shiftly

| Méthode & route | Source FGC | Cible Shiftly | Statut |
|---|---|---|---|
| `POST /api/ingest/reservations` | `DemandeReservation` (anniversaire) | `Reservation` (+ `source`, `sourceRef`, `formule`) | **✅ v1** |
| `POST /api/ingest/demandes-b2b` | `B2BRequest` | `DemandeB2B` | ⏳ v2 |
| `POST /api/ingest/avis` *(option)* | avis / `ContactMessage` | `Avis` | ⏳ v2 |

### `POST /api/ingest/reservations` — livré (v1)

Auth machine-to-machine par **clé API de centre** : header `X-Shiftly-Ingest-Key: <clé>`
(firewall `ingest` sous `^/api/ingest`, **avant** `^/api/public` et `^/api` ; `ROLE_INGEST`).
La clé identifie LE centre → la `Reservation` est **toujours** rattachée à ce centre (jamais
un id du payload). **Idempotent** : unicité `(centre, source, sourceRef)` → rejeu du même
`sourceRef` = **200** sans doublon.

Réponses : `201` (créée) · `200` (déjà ingérée) · `401` (clé absente/inconnue) · `422` (payload invalide).

Body :
```json
{
  "sourceRef": "ANNIV-2026-000123", "source": "fgc-web", "type": "anniversaire",
  "dateCreneau": "2026-07-20T14:00:00+02:00", "nbPersonnes": 8,
  "client": { "nom": "Dupont", "email": "p.dupont@example.com", "telephone": "0600000000" },
  "formule": "super-bowler", "montantTotalCents": 16000, "statut": "confirme"
}
```

Mapping : `client.*` → champs invité ; `formule` → libellé libre (pas de table de
correspondance prestation en v1). La clé d'ingestion se (re)génère côté super-admin :
`POST /api/superadmin/centres/{id}/ingest-key`.

**Mapping des statuts (v1.1) — FGC envoie son statut BRUT, Shiftly mappe (hub maître du vocabulaire) :**

| Statut FGC (champ `statut` envoyé) | Statut Shiftly |
|---|---|
| `nouveau` | `EN_ATTENTE_ACOMPTE` |
| `contacte` | `EN_ATTENTE_ACOMPTE` |
| `confirme` | `CONFIRMEE` |
| `refuse` | `ANNULEE` |
| `passe` | `TERMINEE` |

Statut inconnu ou absent → `EN_ATTENTE_ACOMPTE` par défaut (jamais d'erreur). Les 4 valeurs
Shiftly existent (`reservation.statut`, varchar libre, sans contrainte CHECK).

**Push déclenché à la création ET à chaque transition de statut** (admin FGC) → même `sourceRef`
→ l'endpoint d'ingestion **met à jour** le statut (et nb personnes / montant) de la `Reservation`
existante (**upsert → 200**), pas de doublon. Le centre n'est jamais modifié. ✅ **livré v1.1**.

> **Clé de démo FGC** (centre 4, Family Games Center) posée pour tester le pont de bout
> en bout — à récupérer via le super-admin ou la base (`centre.ingest_key`).

Auth : `X-Shiftly-Ingest-Key: <clé du centre>` → résout le `Centre`. Clé absente/inconnue → 401.
Isolation : la donnée est **toujours** rattachée au centre de la clé (jamais un `centre_id` du payload).

## Mapping des champs (résa anniversaire)

| FGC `DemandeReservation` | Shiftly `Reservation` |
|---|---|
| `eventDate` + `timeSlot` | `dateCreneau` |
| `kidsCount` | `nbPersonnes` |
| `parentFirstName`+`parentLastName` | `nomInvite` |
| `parentEmail` / `parentPhone` | `emailInvite` / `telephoneInvite` |
| `formuleKey` | `prestation` (via table de correspondance formule→prestation) **ou** champ libre |
| `unitPriceCentsSnapshot` × `kidsCount` | `montantTotalCents` |
| `reference` | `sourceRef` (idempotence) |
| — | `source` = `"fgc-web"` |
| `status` (Nouveau/Confirmé…) | `statut` (mapping enum) |

> ⚠️ Les modèles divergent : une résa FGC est **événementielle** (anniversaire enfant), la
> `Reservation` Shiftly est orientée **prestation + créneau + Stripe**. Deux champs à ajouter côté
> Shiftly : `source` (origine) et `sourceRef` (idempotence). Le lien `formuleKey → prestation`
> demande une table de correspondance par centre (sinon stocker la formule en libellé).

## Décisions à acter avant les prompts

1. **Périmètre v1** *(reco : réservations d'abord)* — commencer par `POST /ingest/reservations`
   seul, puis B2B, puis avis. Éviter de tout brancher d'un coup.
2. **Modèle Shiftly** — enrichir `Reservation` (`source`, `sourceRef`) **ou** créer une entité
   d'ingestion dédiée si le mélange anniversaire/prestation devient trop bancal.
3. **Double stockage assumé** — FGC garde ses données (son admin s'en sert), Shiftly en reçoit une
   copie de gestion. OK en v1 ; à terme, décider si Shiftly devient la source unique.
4. **Clé API** — générée par centre côté superadmin Shiftly, stockée en secret côté FGC (`.env`).

## Ce qui NE change PAS
- Le module web/réservation existant de Shiftly (mini-site, Stripe public) n'est pas requis par ce
  pont. Décision de nettoyage `/site` traitée séparément (`PROMPT_CLAUDE_CODE_MON_SITE_HEADLESS.md`),
  **à revoir** à la lumière de cette architecture (le mini-site n'a plus de rôle pour FGC).
- Les entités & le cockpit de gestion Shiftly (Reservation, DemandeB2B, Avis) sont **conservés** —
  c'est là qu'atterrissent les données.
