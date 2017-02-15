all: install server

install:
	docker run --rm -ti \
		-v $(shell pwd -P):/workspace \
		kkarczmarczyk/node-yarn:7.2 yarn install

server:
	docker run -ti --rm --name tectonic \
		-v $(shell pwd -P):/workspace \
		-p 8080:8080 \
		-p 8081:8081 \
		kkarczmarczyk/node-yarn:7.2 yarn run start 
