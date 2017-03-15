test: build
	docker-compose -f docker-compose.test.yml run sut

build: .FORCE
	docker-compose -f docker-compose.test.yml build

.FORCE:
