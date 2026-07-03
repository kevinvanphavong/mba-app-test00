# Rafraîchir les données de démo (`app:demo:seed`)

Recharge le jeu de démo (fixtures Alice) **puis** étend services + plannings sur
**3 semaines glissantes** — semaine dernière (`TERMINE`), courante (`EN_COURS` le
jour même, `PLANIFIE` sinon) et prochaine (`PLANIFIE`) — toujours recalculées à la
date d'exécution. À lancer avant une présentation pour que Planning/Services
montrent du passé, du présent et du futur. Rejouable et déterministe.

Les **jours passés sont aussi pointés** (heures réalistes : retards, départs
décalés, pause repas, no-show occasionnel) et des **absences** crédibles sont
posées (REPOS/CP/RTT/MALADIE…) → la page **Validation hebdo** est utilisable en
démo sur la semaine dernière. Le jour même, les pointages en cours sont `EN_COURS`.

```bash
# Local / dev
docker compose exec php php bin/console app:demo:seed
```

> ⚠️ **La commande EFFACE et recharge toute la base** (purge + truncate). En
> `APP_ENV=prod` elle **refuse** sans `--force`, et demande une **confirmation
> interactive** avec `--force`. À n'utiliser sur la prod-démo qu'en connaissance
> de cause :
>
> ```bash
> APP_ENV=prod php bin/console app:demo:seed --force   # confirmation demandée
> ```

Génération : pour chaque centre ayant des zones + employés actifs, un `Service`
par jour ouvert (selon `openingHours`) sur les 3 semaines, garni d'une rotation
déterministe du staff sur les zones. Les services déjà détaillés par les fixtures
sont conservés tels quels ; seuls les jours vides sont remplis. Portable
MySQL/PostgreSQL (ORM uniquement, aucune SQL spécifique moteur).

---

## `app:demo:seed:public` — centres publics testables par domaine

Commande **additive et idempotente** (elle **n'efface rien**, contrairement à
`app:demo:seed`). Elle pose des données pour tester le **site public multi-client**
en local : 2 centres avec un `domaine` en `*.localhost`, contenu de site, prestations,
un gérant chacun, un abonnement (MRR), plus un super-admin de démo.

```bash
php bin/console app:demo:seed:public        # rejouable : 2 exécutions = même état
```

- **Idempotence** : centres upsertés par `domaine`, prestations par `(centre, nom)`,
  users par `email`. Le mot de passe de démo est reposé à chaque exécution.
- **Garde prod** : refuse en `APP_ENV=prod` sans `--force`.
- **Récap** imprimé en fin de commande : URLs de test + identifiants (voir ci-dessous).

Les domaines `*.localhost` résolvent vers `127.0.0.1` nativement (aucun `/etc/hosts`).
Le site public résout le centre par le **host vu par l'API** : tester directement
`http://<domaine>:8000/api/public/site` le démontre. Pour que le front `:3000` résolve
par sous-domaine, servir l'API sur le même host (`NEXT_PUBLIC_API_URL=http://<domaine>:8000/api`).

| Centre | Domaine | Gérant (démo) |
|---|---|---|
| VR Galaxie Nantes | `vrgalaxie.localhost` | `manager@vrgalaxie.test` / `demo1234` |
| Bowling de Tours | `bowling.localhost` | `manager@bowling.test` / `demo1234` |
| Console super-admin | — | `superadmin@demo.test` / `demo1234` |

> Identifiants de **démo uniquement** (données jetables). Ne jamais réutiliser ces
> mots de passe hors démo locale.

---

## `app:demo:seed:superadmin` — peupler les vues super-admin

Commande **additive et idempotente** (n'efface rien). S'appuie sur les **centres existants**
pour peupler les écrans super-admin : catalogue de **plans**, **abonnements** + **factures**
(Stripe SIMULÉ, ids `*_demo_*`, aucun appel réseau), **contacts**, **avis**, **relances**,
**demandes B2B + devis**, **réservations** (là où le centre a une prestation active).

```bash
php bin/console app:demo:seed:superadmin        # rejouable : 2 exécutions = même état
```

- **N'appelle pas** `PlanAssignmentService` (qui déclencherait le vrai gateway Stripe en dev) :
  les `Subscription`/`Invoice` sont créées directement.
- **Garde prod** : refuse en `APP_ENV=prod` sans `--force`.
- **Prérequis** : `PII_ENCRYPTION_KEY` en `.env.local` (chiffrement des contacts CRM) —
  générer une clé dev : `php -r "echo base64_encode(random_bytes(32));"`.

Alimente : `/superadmin/console` (KPI + MRR), `/superadmin/subscriptions`, `/superadmin/billing`
et les écrans CRM du cockpit (contacts, avis, relances, demandes).
