# Rafraîchir les données de démo (`app:demo:seed`)

Recharge le jeu de démo (fixtures Alice) **puis** étend services + plannings sur
**3 semaines glissantes** — semaine dernière (`TERMINE`), courante (`EN_COURS` le
jour même, `PLANIFIE` sinon) et prochaine (`PLANIFIE`) — toujours recalculées à la
date d'exécution. À lancer avant une présentation pour que Planning/Services
montrent du passé, du présent et du futur. Rejouable et déterministe.

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
