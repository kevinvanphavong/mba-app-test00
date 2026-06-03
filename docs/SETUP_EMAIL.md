# SETUP_EMAIL — Configuration Gmail SMTP pour les notifications Leads

> Procédure pour activer l'envoi d'emails de notification à chaque nouveau Lead
> capturé via la landing publique `shiftly.fr` (`POST /api/leads`).

## Pourquoi App Password ?

Google a supprimé l'authentification SMTP par mot de passe classique en 2022.
Pour qu'une application puisse envoyer un email via Gmail SMTP, il faut :

1. Activer la **2FA** sur le compte Google.
2. Générer un **App Password** dédié à cette application (16 caractères).
3. Utiliser cet App Password dans `MAILER_DSN` (pas le mot de passe Gmail réel).

L'App Password peut être révoqué à tout moment sans toucher au mot de passe
principal. C'est la méthode officielle recommandée par Google.

## Étapes

### 1. Activer la double authentification

Si ce n'est pas déjà fait sur `vanphavongk45@gmail.com` :

- Aller sur https://myaccount.google.com/security
- Section "Connexion à Google" → activer la **validation en 2 étapes**

### 2. Générer un App Password

- Aller sur https://myaccount.google.com/apppasswords
  (la page n'apparaît que si la 2FA est active)
- "Nom de l'application" : `Shiftly Leads SMTP`
- Cliquer **Créer**
- Google affiche un mot de passe de 16 caractères (ex `abcd efgh ijkl mnop`)
- **Copier-le immédiatement, il ne sera plus jamais affiché.**

### 3. Renseigner `.env.local`

Dans `shiftly-api/.env.local` (jamais commité) :

```bash
GMAIL_USER=vanphavongk45@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop    # sans espaces
LEAD_NOTIFICATION_EMAIL=vanphavongk45@gmail.com
APP_BASE_URL=http://localhost:3000     # https://app.shiftly.fr en prod
MAILER_DSN=gmail+smtp://${GMAIL_USER}:${GMAIL_APP_PASSWORD}@default
```

### 4. Tester en local

```bash
# Symfony tourne déjà sur :8000
curl -X POST http://localhost:8000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "intent":"demo","plan":"pro","name":"Test","email":"test@example.com",
    "phone":"0102030405","centre":"Test Centre","activity":"bowling",
    "staffSize":"1-5","consent":true,"source":"setup-email-test"
  }'
```

Réponse attendue : `{"id":N,"status":"nouveau","createdAt":"..."}`.

Vérifier dans Gmail (`vanphavongk45@gmail.com`) qu'un email
"**[Shiftly] Nouveau lead · Démo en visio · Pro**" arrive sous 5 secondes.

### 5. Déployer en production (Railway)

Ajouter les variables dans Railway → Variables d'environnement :

| Variable | Valeur |
|---|---|
| `GMAIL_USER` | `vanphavongk45@gmail.com` |
| `GMAIL_APP_PASSWORD` | l'App Password 16 chars |
| `LEAD_NOTIFICATION_EMAIL` | `vanphavongk45@gmail.com` |
| `APP_BASE_URL` | `https://app.shiftly.fr` |
| `MAILER_DSN` | `gmail+smtp://${GMAIL_USER}:${GMAIL_APP_PASSWORD}@default` |

## Dépannage

| Symptôme | Cause probable | Fix |
|---|---|---|
| Lead persisté en BDD mais aucun email | App Password invalide / révoqué | Régénérer un App Password |
| 535 5.7.8 Username and Password not accepted | 2FA non activée OU App Password mal saisi (espaces) | Vérifier `myaccount.google.com/security` |
| Email envoyé mais en spam | SPF/DKIM Google par défaut OK mais reply-to pointe sur l'email du prospect | Ajouter une règle Gmail "Toujours afficher" sur le sujet `[Shiftly] Nouveau lead` |
| Erreur "Connection could not be established" | Pare-feu local bloque port 587 | Tester `telnet smtp.gmail.com 587` |

## Limites Gmail SMTP

- **500 emails / jour** par compte Gmail gratuit (largement suffisant pour notifs leads internes).
- **100 destinataires / message** (on n'envoie qu'à 1 destinataire ici).
- Si Shiftly atteint plusieurs centaines de leads/jour, migrer vers Brevo, Mailgun ou AWS SES.

## Sécurité

- Ne JAMAIS commiter `.env.local` ni un App Password en clair dans Git.
- Si un App Password est exposé (push accidentel, capture d'écran), le révoquer immédiatement
  sur https://myaccount.google.com/apppasswords et en générer un nouveau.
- L'App Password donne accès SMTP/IMAP au compte — traiter comme un secret de niveau "production".
