# Stripe en local (mode test)

Abonnements agence = compte Stripe **test**. Clés dans `.env.local` (jamais committées) :
`STRIPE_SECRET_KEY=sk_test_…` et `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET=whsec_…`.

## Recevoir les webhooks d'abonnement en local

```bash
stripe listen --forward-to localhost:8000/api/public/stripe/subscription-webhook
```

La commande affiche le `whsec_…` à mettre dans `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`.

## Tester le tunnel complet

1. Super-admin → console → assigner un plan à un centre → un **lien Checkout** s'affiche (bouton Copier).
2. Ouvrir le lien, payer avec la carte test `4242 4242 4242 4242` (date future, CVC quelconque).
3. `checkout.session.completed` → abonnement lié, statut **essai** ; puis `invoice.paid`/`payment_failed`
   → réactivation / suspension. Détacher le plan → `cancel_at_period_end`.

## Runbook — payer en navigateur sans rester bloqué « en attente de paiement »

> La redirection `/reglages?abonnement=ok` est **cosmétique**. Le passage
> `INCOMPLETE → trialing → active` se fait **uniquement** via le webhook Stripe.
> En local, Stripe ne joint pas `localhost` : il faut le relais `stripe listen`.
> **Cause classique du blocage** : `stripe listen` pas lancé (ou API/Postgres à
> l'arrêt) au moment du paiement → l'event n'atteint jamais l'API, le centre reste
> `incomplete`. Second piège : `whsec` de `stripe listen` ≠ `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`
> de `.env.local` → signature rejetée (**400**), aucun changement d'état.

**À laisser tourner pendant que tu paies (3 terminaux) :**
```bash
# 1. Base + API (Symfony lit l'env au boot : redémarre l'API après tout changement de .env.local)
docker start shiftly-saas-db-1
symfony server:start -d            # écoute sur http://127.0.0.1:8000

# 2. Relais webhooks (le laisser ouvert tout le temps du test)
stripe listen --forward-to localhost:8000/api/public/stripe/subscription-webhook
```

**Vérifier la concordance du secret AVANT de payer** (sinon 400) :
```bash
stripe listen --print-secret        # doit être IDENTIQUE à STRIPE_SUBSCRIPTION_WEBHOOK_SECRET dans .env.local
```

Puis paie avec `4242 4242 4242 4242` (date future, CVC quelconque). Dans la fenêtre
`stripe listen`, tu dois voir `checkout.session.completed … [200]` puis `invoice.paid … [200]`.
Le statut du centre se met à jour côté console super-admin.

## Rejouer un événement manqué (paiement déjà fait, centre resté « incomplete »)

Le paiement a réussi côté Stripe mais l'event n'est pas arrivé (listen éteint) :
l'abonnement existe déjà chez Stripe, il suffit de **renvoyer** l'event à l'API.

- **Dashboard** : Stripe (mode test) → *Developers → Events* → ouvrir l'event
  `checkout.session.completed` du bon client → **Resend**. Idem pour `invoice.paid`.
- **CLI** (avec `stripe listen` en cours) :
  ```bash
  stripe events list --type checkout.session.completed --limit 10   # repérer l'evt_… du bon customer
  stripe events resend evt_XXXXXXXXXXXX                              # → l'API reçoit l'event, 200
  ```

Le traitement est **idempotent** : une facture déjà enregistrée n'est pas dupliquée
et un rejeu tardif ne rétrograde pas un abonnement déjà actif. Une facture d'essai à
**0 €** enregistre la facture et réactive l'accès **sans** écraser le statut `trialing`.
