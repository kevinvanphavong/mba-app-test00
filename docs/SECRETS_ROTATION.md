# Rotation des secrets & purge d'historique (JWT)

> Contexte : `JWT_PASSPHRASE` a été committé en clair dans `shiftly-api/.env`
> (`da89…`). La valeur est désormais **vidée** dans `.env` (déférée à `.env.local` en
> dev, aux variables Railway en prod) et la paire de clés a été **régénérée** en local.
> **Deux actions restent MANUELLES** (Claude ne les fait pas) :

## 1. Rotation en prod (Railway) — à faire par Kévin

L'ancienne passphrase a fuité : les clés prod générées avec elle sont compromises.

1. Générer une nouvelle passphrase forte : `openssl rand -hex 32`.
2. Dans Railway → variables : mettre `JWT_PASSPHRASE=<nouvelle valeur>`.
3. Régénérer la paire de clés prod avec cette passphrase (sur l'instance / au deploy) :
   `php bin/console lexik:jwt:generate-keypair --overwrite`.
4. Redéployer. ⚠️ **Tous les JWT existants sont invalidés** → les utilisateurs se
   reconnectent (comportement attendu). Vérifier login gérant + super-admin après deploy.

## 2. Purge de l'historique Git — à faire par Kévin

La passphrase `da89…` reste lisible dans les **anciens commits**. La vider dans `.env`
ne suffit pas ; il faut réécrire l'historique :

```bash
# avec git-filter-repo (recommandé) — remplace la valeur dans tout l'historique
git filter-repo --replace-text <(echo 'da89022e821438ad9cba3e128516f8d972f3b0f5d734c9a5b11d59acfe881dc2==>REDACTED')
git push --force-with-lease --all      # coordonner avec les collaborateurs (ré-clone requis)
```

## Doctrine (rappel)

- **Secrets** → `.env.local` (dev, gitignoré) et variables Railway (prod). Jamais dans un fichier committé.
- `.env` reste committé : il ne contient QUE des **défauts non-secrets** (dont `DATABASE_URL`
  et `MESSENGER_TRANSPORT_DSN` requis par la CI et les tests) ; `JWT_PASSPHRASE` y est vide.
  `/.env` est ajouté au `.gitignore` pour empêcher toute future recréation locale d'être committée.
- Clés JWT (`config/jwt/*.pem`) : déjà gitignorées, jamais committées.
