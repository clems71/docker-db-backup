test: build
	docker-compose -f docker-compose.test.yml run sut

build:
	docker-compose -f docker-compose.test.yml build
