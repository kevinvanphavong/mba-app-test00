# Runbook — préparer une démo client en prod

Procédure pour amener un centre de démonstration en production et le présenter à
un prospect. Écrite pour **Espace Bourges / Nicolas Groelly**, réutilisable telle
quelle pour un autre centre en changeant le slug.

Contexte technique : API sur **Railway** — projet `shiftly-app`, service
`shiftly-project`, root directory `/shiftly-api`, branche connectée **`main`**
avec **auto-deploy activé et « Wait for CI » désactivé** : un push sur `main`
part en production immédiatement, sans attendre GitHub Actions. Le rechargement
de la démo est déclenché par la variable d'environnement `DEMO_SEED`, pas par une
commande manuelle.

---

## 1. Avant de déployer

- [ ] Merger la branche de travail sur `main` — la CI ne tourne que sur `main`
      (`.github/workflows/ci.yml`) et c'est `main` qui part en prod.
- [ ] CI verte : lint + PHPStan + PHPUnit + rejeu des migrations sur Postgres.
- [ ] Vérifier sur Railway que **`PII_ENCRYPTION_KEY`** est définie. Sans elle, le
      seed refuse de s'exécuter (garde-fou, base laissée intacte) et la démo n'aura
      ni contacts, ni avis, ni relances — tout le CRM est chiffré avec cette clé.
      Générer une clé : `php -r "echo base64_encode(random_bytes(32));"`
      Un échec de semis ne fait plus tomber le container (l'entrypoint isole
      l'appel), mais la démo ne sera pas rechargée pour autant.
- [ ] Ne **jamais changer** cette clé une fois des contacts en base : les PII
      déjà chiffrées deviendraient illisibles.
- [ ] Vérifier que `LOAD_FIXTURES` est à `0`. C'est `DEMO_SEED` qu'il faut
      utiliser : `LOAD_FIXTURES` charge les fixtures brutes sans recalculer les
      `Contact::emailHash` ni générer plannings et pointages.

## 2. Déployer et semer

1. Pousser `main` → Railway rebuild l'API, les migrations tournent au démarrage.
2. Passer `DEMO_SEED=1` sur Railway, redémarrer le service.
3. Lire les logs : la commande doit afficher `10 centres · … plannings · …
   services`, précédé de `Contacts CRM : N emailHash recalculés.`
4. **Remettre `DEMO_SEED=0`.** Sinon la base est réécrasée à chaque redémarrage
   du container — y compris en pleine démo.

Optionnel, si tu veux montrer la console super-admin (MRR, abonnements,
factures), depuis la console Railway :

```bash
php bin/console app:demo:seed:superadmin --force --skip-centre=espace-bourges
```

`--skip-centre` laisse le centre du prospect totalement intact : ni abonnement,
ni plan, ni CRM générique par-dessus ses vraies données de démo. À lancer
**après** `DEMO_SEED`, qui purge la base.

## 3. Vérifier en prod

Se connecter sur `https://app.shiftly.fr/login` avec le compte gérant, puis
passer sur chaque écran — aucun ne doit être vide :

| Écran | Attendu |
|---|---|
| Dashboard | 5 zones, 9 staff actifs, incidents ouverts |
| Service du jour | 51 missions réparties sur 5 zones |
| Planning | lundi vide (fermé), navigation S-1 → S+3 |
| Pointage / Validation hebdo | heures pointées sur S-1, retards, no-show |
| Réservations | 14 réservations, tous statuts |
| Clients | 8 contacts, segments b2c/b2b/no_show |
| Avis | 6 avis, dont 3 répondus |
| Relances | 3 relances no-show |
| Demandes B2B | 4 demandes, 3 devis |
| Mon site | 14 prestations tarifées |
| Réglages | raison sociale, adresse, téléphone, horaires |

## 4. Le jour de la démo

- [ ] **Relancer `DEMO_SEED=1` la veille ou le matin même**, puis le remettre à 0.
      Les dates sont glissantes et recalculées à l'exécution : un seed vieux d'un
      mois place « S+3 » dans le passé et vide le planning à venir.
- [ ] Ne pas démarrer la démo entre minuit et l'heure de bascule : l'app affiche
      alors le service de la **veille** (`ActiveDayResolver`, gestion des services
      de nuit). Normal, mais déroutant si on ne l'a pas anticipé.
- [ ] Avoir l'identifiant et le mot de passe du gérant sous la main.

## 5. Ce qui reste à valider avec le client

- **Tarifs non publiés** : BattleKart, mini-golf et billard ne sont pas affichés
  sur le site public. Les valeurs du seed sont plausibles mais inventées, et
  marquées « tarif à confirmer » dans la description de la prestation. À faire
  corriger avant toute discussion chiffrée.
- **Horaires** : ceux du seed sont les horaires « hors vacances » du site
  (lundi fermé, mar–jeu 17h–00h, ven 17h–01h, sam 10h–01h, dim 14h–19h).
  L'établissement affiche des horaires élargis en période de vacances.
- **Staff** : les 9 salariés sont fictifs, seul le compte gérant porte le nom
  réel. Proposer de les remplacer par la vraie équipe si la démo se transforme
  en essai.

## 6. Envois d'e-mails — ce qui peut partir

Le chargement des fixtures ne déclenche aucun envoi. Une action pendant la démo
peut en déclencher un, mais jamais vers une vraie boîte :

| Action | Destinataire |
|---|---|
| Confirmer une réservation | `emailInvite` de la réservation → `@exemple.fr` |
| Demande d'avis automatique | idem |
| Envoyer une relance | contact de la relance → `@exemple.fr` |
| Nouveau lead sur le site | `LEAD_NOTIFICATION_EMAIL` (toi) |

`@exemple.fr` est un domaine réservé (RFC 2606) : les messages ne sortent pas.
**Aucun envoi n'est adressé au compte gérant** — l'adresse du prospect ne reçoit
rien, même en manipulant l'application.
