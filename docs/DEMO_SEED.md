# Rafraîchir les données de démo (`app:demo:seed`)

Recharge le jeu de démo (fixtures Alice) **puis** étend services + plannings sur
**5 semaines glissantes** — semaine dernière (`TERMINE`), courante (`EN_COURS` le
jour même, `PLANIFIE` sinon) et les **trois suivantes** (`PLANIFIE`) — toujours
recalculées à la date d'exécution. À lancer avant une présentation pour que
Planning/Services montrent du passé, du présent et du futur, et qu'on puisse
naviguer vers l'avant sans tomber sur une semaine vide. Rejouable et déterministe.

Les **jours passés sont aussi pointés** (heures réalistes : retards, départs
décalés, pause repas, no-show occasionnel) et des **absences** crédibles sont
posées (REPOS/CP/RTT/MALADIE…) → la page **Validation hebdo** est utilisable en
démo sur la semaine dernière. Le jour même, les pointages en cours sont `EN_COURS`.

La commande réaligne aussi les **`Contact::emailHash`** du CRM : le hash est salé
par l'id du centre, inconnu au moment d'écrire le YAML, donc les fixtures posent un
placeholder que la commande remplace par le vrai HMAC. Sans ce passage, la
déduplication des contacts (dépôt d'avis public, ingestion externe) créerait des
doublons. C'est la raison pour laquelle il faut préférer `DEMO_SEED=1` à
`LOAD_FIXTURES=1` en prod-démo.

```bash
# Local / dev
make demo-seed
# ou : cd shiftly-api && php -d memory_limit=512M bin/console app:demo:seed
```

> `memory_limit` relevé : en `APP_ENV=dev`, le profiler Doctrine conserve chaque
> requête SQL avec sa backtrace et dépasse les 128 Mo par défaut sur ce volume.
> En prod le profiler est désactivé, la commande tient dans la mémoire standard.

> ⚠️ **La commande EFFACE et recharge toute la base** (purge + truncate). En
> `APP_ENV=prod` elle **refuse** sans `--force`, et demande une **confirmation
> interactive** avec `--force`. À n'utiliser sur la prod-démo qu'en connaissance
> de cause :
>
> ```bash
> APP_ENV=prod php bin/console app:demo:seed --force   # confirmation demandée
> ```

Génération : pour chaque centre ayant des zones + employés actifs, un `Service`
par jour ouvert (selon `openingHours`) sur les 5 semaines, garni d'une rotation
déterministe du staff sur les zones. Les services déjà détaillés par les fixtures
sont conservés tels quels ; seuls les jours vides sont remplis. Portable
MySQL/PostgreSQL (ORM uniquement, aucune SQL spécifique moteur).

---

## Centre de démonstration client — Espace Bourges

`fixtures/espace-bourges.yaml` est le centre destiné aux **démos commerciales**.
Il reprend les informations publiques réelles de l'établissement (raison sociale,
adresse, téléphone, horaires, catalogue de prestations relevé sur le site) et
remplit tous les modules du cockpit :

| Module | Contenu |
|---|---|
| Service du jour / Planning / Pointage | 5 zones, 51 missions, 9 salariés, 5 semaines glissantes |
| Mon site | 14 prestations avec les tarifs publics du site |
| Réservations | 14 réservations, dont 3 ingérées d'une billetterie externe (`source: funow`) |
| Clients | 8 contacts CRM (segments b2c / b2b / no_show), PII chiffrées |
| Avis | 6 avis notés 2→5, dont 3 déjà répondus |
| Relances | 3 relances no-show (à rédiger / à envoyer / envoyée) |
| Demandes B2B | 4 demandes + 3 devis (brouillon, envoyé, accepté) |
| Registre du personnel | 9 contrats (CDI / CDD / extra) |

Pour amener ce centre en prod et le présenter : **[RUNBOOK_DEMO_CLIENT.md](RUNBOOK_DEMO_CLIENT.md)**.

Conventions à respecter en modifiant ce fichier :

- **Personnes fictives, e-mails en `@exemple.fr`** (domaine réservé RFC 2606) :
  aucun envoi de démo ne peut atteindre une vraie boîte. Seul le compte gérant
  utilise le domaine réel de l'établissement.
- **Aucun jour de semaine en dur dans un texte** : les dates sont relatives à la
  date d'exécution du seed, un « samedi dernier » écrit en clair devient faux le
  lendemain. Quand un texte impose un jour, contraindre la date (`next thursday
  +3 weeks`) plutôt que d'utiliser un décalage en jours.
- **Tarifs non publiés** (BattleKart, mini-golf, billard) : marqués « tarif à
  confirmer » en commentaire et dans la description — à valider avec le gérant
  avant toute présentation chiffrée.
- La zone bar doit s'appeler exactement **`Bar`** : `CentreHaccpSeedListener` crée
  sinon une seconde zone de ce nom pour y rattacher les missions HACCP.

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

# Laisse un centre totalement intact (répétable) : à utiliser pour tout centre
# présenté à un vrai prospect, à qui on ne veut ni abonnement ni CRM générique.
php bin/console app:demo:seed:superadmin --skip-centre=espace-bourges
```

- **À lancer APRÈS `app:demo:seed`**, qui purge la base : l'inverse efface ce que
  cette commande vient de poser.
- **N'appelle pas** `PlanAssignmentService` (qui déclencherait le vrai gateway Stripe en dev) :
  les `Subscription`/`Invoice` sont créées directement.
- **Garde prod** : refuse en `APP_ENV=prod` sans `--force`.
- **Prérequis** : `PII_ENCRYPTION_KEY` en `.env.local` (chiffrement des contacts CRM) —
  générer une clé dev : `php -r "echo base64_encode(random_bytes(32));"`.

Alimente : `/superadmin/console` (KPI + MRR), `/superadmin/subscriptions`, `/superadmin/billing`
et les écrans CRM du cockpit (contacts, avis, relances, demandes).
