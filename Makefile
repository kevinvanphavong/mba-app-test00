.PHONY: up down logs ps test fixtures migrate demo-seed stan stan-baseline csfix

# Infra Docker (Postgres + Mailpit + php) — cf. docker-compose.yml
up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

# Recharge le schéma + les fixtures Alice dans la base de dev
fixtures:
	docker compose exec php php bin/console doctrine:migrations:migrate -n
	docker compose exec php php bin/console hautelook:fixtures:load -n

migrate:
	docker compose exec php php bin/console doctrine:migrations:migrate -n

# Rafraîchit la démo : fixtures + services/plannings/pointages sur 5 semaines
# glissantes. `memory_limit` relevé : en dev, le profiler Doctrine garde toutes
# les requêtes + leur backtrace et fait exploser les 128 Mo par défaut.
demo-seed:
	cd shiftly-api && php -d memory_limit=512M bin/console app:demo:seed

# Analyse statique + style (backend)
stan:
	docker compose exec php vendor/bin/phpstan analyse --no-progress

# Régénère le baseline phpstan (à faire uniquement en connaissance de cause)
stan-baseline:
	docker compose exec php php bin/console cache:warmup --env=dev
	docker compose exec php vendor/bin/phpstan analyse --generate-baseline=phpstan-baseline.neon --no-progress

csfix:
	docker compose exec php vendor/bin/php-cs-fixer fix

# Worker Messenger : consomme les effets de bord async (mails, cleanup R2, audit).
# En prod : superviser cette commande (systemd / supervisor) avec --time-limit.
worker:
	docker compose exec php php bin/console messenger:consume async -vv --time-limit=3600

# État des files (async / failed) et rejeu des messages en échec.
worker-stats:
	docker compose exec php php bin/console messenger:stats
worker-retry:
	docker compose exec php php bin/console messenger:failed:retry -vv

# Tests back + front
test:
	docker compose exec php vendor/bin/phpunit
	cd shiftly-app && npm run test
