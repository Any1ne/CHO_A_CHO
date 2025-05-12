up:
	docker-compose up --build

down:
	docker-compose down -v

restart:
	docker-compose down -v && docker-compose up --build

build:
	docker compose build

rm:
	docker compose rm -fs 

silent:
	docker compose up -d

rebuild: rm build silent


ps:
	docker-compose ps

logs:
	docker-compose logs -f