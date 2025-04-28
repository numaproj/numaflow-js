# [WIP] Typescript SDK for Numaflow

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

This SDK provides the interfaces to implement [UDSources](https://numaflow.numaproj.io/user-guide/sources/user-defined-sources/), [UDTransformer](https://numaflow.numaproj.io/user-guide/sources/transformer/overview/), [Map UDF](https://numaflow.numaproj.io/user-guide/user-defined-functions/map/map/) and [UDSinks](https://numaflow.numaproj.io/user-guide/sinks/user-defined-sinks/) in Typescript.

## Getting Started

### Requirements

- Node.js 18 or later

### Build

```bash
npm run build
```

### Format

```bash
npm run format
```

### Generate Protos

```bash
npm run codegen
```

### Run Tests

```bash
npm run test
```

### Examples on how to write UDSource, Map UDF, UDSink

- **User Defined Source(UDSource)**

  - [Fixed Data Generator](examples/source/fixed-data-generator)

- **Map User Defined Function(UDF)**

  - [Forward Message](examples/map/forward-message)

- **User Defined Sink(UDSink)**
  - [Log Sink](examples/sink/log)
  - [Fallback Sink](examples/sink/fallback)

## Code Style

Use [Prettier](https://prettier.io/docs/)

## Numaflow

You can learn about Numaflow here https://numaflow.numaproj.io/
