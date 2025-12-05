## HOWTO build Image

Use the Makefile:

```bash
make image
```

Load it to `kind` cluster

```bash
kind image import quay.io/numaio/numaflow-js/simple-sideinput:stable --name <kind-cluster-name>
```

or `k3d`

```bash
k3d image import quay.io/numaio/numaflow-js/simple-sideinput:stable --cluster <k3d-cluster-name>
```

## Run the pipeline

```bash
kubectl apply -f simple-sideinput.yaml
```
