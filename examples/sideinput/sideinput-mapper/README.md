## HOWTO build Image

Use the Makefile:

```bash
make image
```

Load it to `kind` cluster

```bash
kind image import quay.io/numaio/numaflow-js/sideinput-mapper:stable --name <kind-cluster-name>
```

or `k3d`

```bash
k3d image import quay.io/numaio/numaflow-js/sideinput-mapper:stable --cluster <k3d-cluster-name>
```
