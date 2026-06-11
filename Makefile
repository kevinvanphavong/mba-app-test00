.PHONY: up down logs ps test fixtures migrate stan stan-baseline csfix

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

# Analyse statique + style (backend)
stan:
	docker compose exec php vendor/bin/phpstan analyse --no-progress

# Régénère le baseline phpstan (à faire uniquement en connaissance de cause)
stan-baseline:
	docker compose exec php php bin/console cache:warmup --env=dev
	docker compose exec php vendor/bin/phpstan analyse --generate-baseline=phpstan-baseline.neon --no-progress

csfix:
	docker compose exec php vendor/bin/php-cs-fixer fix

# Tests back + front
test:
	docker compose exec php vendor/bin/phpunit
	cd shiftly-app && npm run test
