TAG ?= stable
PUSH ?= false
IMAGE_REGISTRY = quay.io/numaio/numaflow-js/simple-source-transform:${TAG}
DOCKER_FILE_PATH = examples/source-transform/Dockerfile

.PHONY: update
update:
	cargo check
	cargo update

.PHONY: image
image:
	cd ../../ && docker build \
	-f ${DOCKER_FILE_PATH}  \
	-t ${IMAGE_REGISTRY} . --load
	@if [ "$(PUSH)" = "true" ]; then docker push ${IMAGE_REGISTRY}; fi
