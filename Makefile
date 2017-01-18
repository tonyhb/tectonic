all: docbuilder docs

docbuilder:
	docker run --rm -v $(shell pwd -P)/docs-builder:/go/src/docs \
	-v $(shell pwd -P)/docs-builder/bin:/go/bin \
	golang:1.7.4-alpine \
	go install docs

docs: clean
	docker run --rm -v $(shell pwd -P):/data alpine:3.4 /data/docs-builder/bin/docs

clean:
	rm -f docs/*.html

test:
	docker run --rm -ti -v $(shell pwd -P)/packages/tectonic:/workspace kkarczmarczyk/node-yarn:7.2-slim sh -c 'yarn install && yarn test'

flow:
	docker run --rm -ti -v $(shell pwd -P)/packages/tectonic:/workspace tonyhb/flow:0.37.4 flow

lint:
	docker run --rm -ti -v $(shell pwd -P)/packages/tectonic:/workspace kkarczmarczyk/node-yarn:7.2-slim sh -c 'yarn install && yarn lint'

ci: lint flow test

.PHONY: docs test flow lint
