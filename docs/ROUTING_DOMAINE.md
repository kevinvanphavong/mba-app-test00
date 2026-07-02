# Routing par domaine (middleware host → espace)

> En prod, chaque client a son **propre domaine** (`vr-galaxie-nantes.fr`). Le
> middleware Next (`shiftly-app/src/middleware.ts`) mappe l'URL selon le **HOST**.
> La résolution du **centre** reste côté API (par host) — le front ne la décide jamais.

## Comportement

| Type de host | Exemple | Routage |
|---|---|---|
| **Plateforme** | `shiftly.app` (marketing), `app.shiftly.app` (gérant), `admin.shiftly.app` (super-admin), `localhost`, `*.localhost` | Routage **normal** (aucune réécriture) : `/`=marketing, `/dashboard`=app, `/superadmin`=admin, `/site`=site public |
| **Client** | tout autre host (`vr-galaxie-nantes.fr`) | **Rewrite** `/*` → `/site/*` : ne sert **que** l'espace public. Les routes internes (`/dashboard`, `/superadmin`, `/login`) deviennent `/site/...` → **404** |

- **Rewrite, pas redirect** : l'URL du client reste propre (`vr-galaxie-nantes.fr/reserver`).
- Le middleware **ne résout jamais le centre** : il mappe l'URL. L'API résout le centre
  par host et renvoie **404** si le domaine est inconnu.
- **Auth inchangée** : le gating reste côté client (`useCurrentUser`/`/api/me` + intercepteur 401).

## Hosts plateforme = en env (jamais en dur)

`NEXT_PUBLIC_PLATFORM_HOSTS` (séparés par des virgules), cf. `.env.example` :

```bash
# Prod (exemple)
NEXT_PUBLIC_PLATFORM_HOSTS=shiftly.app,www.shiftly.app,app.shiftly.app,admin.shiftly.app
```

`localhost` et `*.localhost` sont **toujours** plateforme (dans le code, pour le dev).

## Tester plusieurs clients en local

### Hosts plateforme (dev)
- `http://localhost:3000/` → marketing · `/dashboard` → app gérant · `/superadmin` → console.
- Site public d'un centre : comme `*.localhost` est **plateforme**, on l'atteint par le
  chemin explicite `http://vrgalaxie.localhost:3000/site` (pas de rewrite).

### Simuler un vrai domaine client (rewrite `/` → `/site`)
Un host client = un host **non** plateforme (donc **pas** en `*.localhost`). Deux options :

**Option A — `/etc/hosts`** (recommandée)
```
# /etc/hosts
127.0.0.1   vr-galaxie-nantes.test
```
Puis `http://vr-galaxie-nantes.test:3000/` → réécrit vers `/site` ; `/reserver` → `/site/reserver`.

**Option B — vérifier le middleware seul (sans /etc/hosts)** via l'en-tête `Host` :
```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: vr-galaxie-nantes.test" http://127.0.0.1:3000/reserver   # 200 (rewrite)
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: localhost"              http://127.0.0.1:3000/reserver   # 404 (route inexistante)
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: vr-galaxie-nantes.test" http://127.0.0.1:3000/dashboard # 404 (route interne bloquée)
```

### Pour que le site client **affiche ses données** en dev
Le middleware ne fait que router l'URL. Pour voir le contenu :
1. Un `Centre` doit avoir `domaine` = ce host (ex. `vr-galaxie-nantes.test`), sinon l'API renvoie 404.
2. Le front doit appeler l'API **sur ce même host** (résolution du centre par host).
   En dev, `NEXT_PUBLIC_API_URL` est fixé sur `localhost:8000` (partage du cookie d'auth) ;
   pour un test « vrai domaine client », le laisser vide fait suivre le host du navigateur
   (`resolveApiBase()` dans `lib/api.ts`), et le CORS back autorise déjà `*.localhost`.

> En **prod**, front et API sont servis sous le domaine du client (ou via le rewrite
> same-origin `/api/*` de `next.config.mjs`) : la résolution par host est native.
