# Palier 1 — JWT en cookie httpOnly + rate limiting login

> Supprimer la faille n°1 (token JWT lisible en JS via localStorage) et fermer le
> brute-force sur le login.

## Contexte
Le login renvoie le JWT en JSON, le front le stocke en localStorage et l'envoie via
un intercepteur Axios → XSS = vol de session. Le rate limiter n'existe que sur le
login superadmin. Prérequis : palier 0 livré (CI verte sur Postgres).

## Décisions actées (ne pas rouvrir)
- Cookie `HttpOnly; Secure; SameSite=Lax` posé par le **backend**. Le JS ne lit
  jamais le token. Pas de header `Authorization` côté front.
- CSRF : SameSite=Lax + en-tête custom exigé sur les mutations (double-submit léger),
  pas de bundle lourd.

## Fichiers à lire avant de coder
- `shiftly-api/config/packages/security.yaml` — firewalls login/superadmin
- `shiftly-api/config/packages/lexik_jwt_authentication.yaml` — token_extractors
- `shiftly-api/config/packages/rate_limiter.yaml` — pattern superadmin existant
- `shiftly-api/config/packages/nelmio_cors.yaml` — credentials + headers
- `shiftly-app/src/lib/api.ts` — client Axios + intercepteur à supprimer
- `shiftly-app/src/store/authStore.ts` — stockage token à retirer
- `shiftly-app/src/middleware.ts` (ou équivalent) — garde de routes

## Tâche
1. Success handler custom (les 2 firewalls) : pose le cookie httpOnly (TTL aligné
   sur le TTL JWT), réponse JSON = user/centre **sans token**.
2. `lexik_jwt_authentication.yaml` : token_extractor **cookie** (désactiver header).
3. Endpoint `POST /api/auth/logout` : expire le cookie.
4. Rate limiter `login` (sliding window 5/15min, comme superadmin) branché sur
   `/api/auth/login` + remplacer l'anti-flood maison de `LeadController` (~l.41) par
   un rate limiter framework.
5. CORS : `allow_credentials: true`, `allow_headers` en liste explicite (fini `['*']`).
6. Front : `withCredentials: true` dans `lib/api.ts`, supprimer token du store/localStorage
   et l'intercepteur Authorization ; middleware Next lit le cookie pour les redirections ;
   logout appelle le nouvel endpoint. Envoyer l'en-tête CSRF custom sur les mutations.
7. État user : `GET /api/me` (s'il n'existe pas, le créer) pour réhydrater Zustand au mount.

## Auto-vérification (obligatoire)
> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

```bash
docker compose exec php vendor/bin/phpunit
php bin/console lint:container
cd shiftly-app && npm run lint && npm run test && npm run build
```

- [ ] Test fonctionnel : login → `Set-Cookie` httpOnly présent, **aucun token dans le body**
- [ ] Test : requête API authentifiée par cookie seul → 200 ; sans cookie → 401
- [ ] Test : logout → cookie expiré → requête suivante 401
- [ ] Test : 6e tentative de login en 15 min → 429
- [ ] `grep -ri "localStorage" shiftly-app/src` → zéro occurrence liée au token
- [ ] Parcours manuel : login, navigation, refresh (session survit), logout
- [ ] `git diff` relu : pas de régression superadmin, CORS toujours fonctionnel en dev

## Livraison
1. Commits atomiques (`feat(auth): …`, `fix(security): …`)
2. Rapport : cases + sorties curl des tests cookie/429
3. Note de risque : invalider les sessions actives à la mise en prod (tokens localStorage morts)
4. Tu push pas. Kévin push.
