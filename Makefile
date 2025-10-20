# Makefile
# Використання:
# make up-local        -> docker compose --env-file .env.local up --build
# make up-staging      -> docker compose --env-file .env.staging up --build
# make silent-local    -> підняти у фоні
# make down            -> docker compose down -v
# make restart-local   -> перезапуск з .env.local

COMPOSE = docker compose
ENV_LOCAL = .env.local
ENV_STAGING = .env.staging

# default target
.PHONY: help
help:
	@echo "Makefile targets:"
	@echo "  make up-local       - up (build) with .env.local"
	@echo "  make up-staging     - up (build) with .env.staging"
	@echo "  make silent-local   - up -d with .env.local"
	@echo "  make silent-staging - up -d with .env.staging"
	@echo "  make down           - docker compose down -v"
	@echo "  make restart-local  - restart with .env.local"
	@echo "  make build          - docker compose build"
	@echo "  make rm             - docker compose rm -fs"
	@echo "  make ps             - docker compose ps"
	@echo "  make logs           - docker compose logs -f"
	@echo "  make dev-local      - run next dev locally (requires env-cmd)"

.PHONY: up-local up-staging silent-local silent-staging down restart-local build rm ps logs dev-local

up-local:
	$(COMPOSE) --env-file $(ENV_LOCAL) up --build

up-staging:
	$(COMPOSE) --env-file $(ENV_STAGING) up --build

silent-local:
	$(COMPOSE) --env-file $(ENV_LOCAL) up -d --build

silent-staging:
	$(COMPOSE) --env-file $(ENV_STAGING) up -d --build

down:
	$(COMPOSE) down -v

restart-local:
	$(COMPOSE) --env-file $(ENV_LOCAL) down -v && $(COMPOSE) --env-file $(ENV_LOCAL) up --build

build:
	$(COMPOSE) build

rm:
	$(COMPOSE) rm -fs

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

# локальний dev (не через docker)
# requires env-cmd: npm i -D env-cmd
dev-local:
	env-cmd -f $(ENV_LOCAL) npm run dev
