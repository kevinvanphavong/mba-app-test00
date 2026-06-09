.PHONY: up down logs ps test

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

test:
	cd shiftly-api && vendor/bin/phpunit
	cd shiftly-app && npm run test
