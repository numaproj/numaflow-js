.PHONY: update
update: update-package
	rm -rf node_modules
	rm package-lock.json
	npm install

.PHONY: update-package
update-package:
	rm -f numaflow-*.tgz && cd ../../../ && npm run build && npm pack --pack-destination examples/sink/log/
	mv numaflow-*.tgz numaflow.tgz

.PHONY: image
image: update-package
	docker build -t log-sink .