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
