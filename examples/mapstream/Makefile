TAG ?= stable
PUSH ?= false
IMAGE_REGISTRY = quay.io/numaio/numaflow-js/mapstream-cat:${TAG}
DOCKER_FILE_PATH = examples/mapstream/Dockerfile

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
