# Numaflow-JS

Numaflow-JS is a SDK for [Numaflow](https://numaflow.numaproj.io/) that provides the interfaces in JavaScript/TypeScript to implement different types of data processing tasks that Numaflow supports.

Currently, these include:

- [Map UDF](https://numaflow.numaproj.io/user-guide/user-defined-functions/map/map/)
- [UDSink](https://numaflow.numaproj.io/user-guide/sinks/user-defined-sinks/)
- [Source Transform](https://numaflow.numaproj.io/user-guide/sources/transformer/overview/)

The SDK leverages Rust FFIs provided by [napi.rs](https://napi.rs/) to interact with Numaflow.

## Installation

Replace `npm` with your favourite package manager (`pnpm`, `yarn`, etc.) in the following command to install the SDK.

```bash
npm install @numaproj/numaflow-js
```

## Examples

The examples are available in the [examples](./examples) directory.
