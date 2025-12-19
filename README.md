# Numaflow-JS

Numaflow-JS is an SDK for [Numaflow](https://numaflow.numaproj.io/) that provides the interfaces in JavaScript/TypeScript to implement different types of data processing tasks that Numaflow supports.

Currently, these include:

- [Map UDF](https://numaflow.numaproj.io/user-guide/user-defined-functions/map/map/)
    - [Streaming mode](https://numaflow.numaproj.io/user-guide/user-defined-functions/map/map/#streaming-mode)
    - [BatchMap mode](https://numaflow.numaproj.io/user-guide/user-defined-functions/map/map/#batch-map-mode)
- [Reduce UDF](https://numaflow.numaproj.io/user-guide/user-defined-functions/reduce/reduce/)
    - [Accumulator](https://numaflow.numaproj.io/user-guide/user-defined-functions/reduce/windowing/accumulator/)
    - [Session](https://numaflow.numaproj.io/user-guide/user-defined-functions/reduce/windowing/session/)
    - [Fixed](https://numaflow.numaproj.io/user-guide/user-defined-functions/reduce/windowing/fixed/)
    - [Sliding](https://numaflow.numaproj.io/user-guide/user-defined-functions/reduce/windowing/sliding/)
- [UD Sink](https://numaflow.numaproj.io/user-guide/sinks/user-defined-sinks/)
- [UD Source](https://numaflow.numaproj.io/user-guide/sources/user-defined-sources/)
- [Source Transform](https://numaflow.numaproj.io/user-guide/sources/transformer/overview/)
- [Side Input](https://numaflow.numaproj.io/user-guide/reference/side-inputs/)

This SDK is powered by [Numaflow Rust SDK](https://github.com/numaproj/numaflow-rs) through [napi.rs](https://napi.rs/) to interact with Numaflow.

## Installation

Replace `npm` with your favourite package manager (`pnpm`, `yarn`, etc.) in the following command to install the SDK.

```bash
npm install @numaproj/numaflow-js
```

## Examples

The examples are available in the [examples](https://github.com/numaproj/numaflow-js/tree/main/examples) directory.
The examples presented provide a basic overview of how to implement different types of data processing tasks using
Numaflow-JS.
Each example focuses implementing and building one specific component of Numaflow.

Most of the examples follow a similar structure:

- `Dockerfile`: Contains the instructions to build the Docker image for the example.
- `Makefile`: Contains helper commands to build the Docker image
- `README.md`: Provides details on implementing the concerned type of component and instructions to run the specific example.
- `<example-name>.ts`: Contains the TypeScript implementation of the example.
- `<example-pipeline>.yaml`: Contains the pipeline configuration which uses the image built from the specific example.

In the implementation part of all the examples presented, i.e. in `<example-name>.ts`, the pattern is mostly similar.
We need to instantiate and start an async server for the respective component being implemented.

## Implementation details with examples

Eg: Implementing UD sink component:

- To implement a UD sink need to use `sink.AsyncServer`.
- To instantiate the server, we need to provide a function `sinkFn` with a signature satisfying `AsyncServer` constructor.
- Start the server using `start` method of `AsyncServer`.
- Stop the server using `stop` method of `AsyncServer`.

Currently, `source` and `session-reduce` components require implementing all methods of an interface and passing an instance
of the same to their respective async server constructors. Rest of the components only require implementing a function with a signature
satisfying the constructor of the async server.

Following are the different ways to implement a function with a signature satisfying the constructor of the async server:

1. Using an arrow function <br>
   If the function is small and simple, we can use an arrow function.

```typescript
const sinkFn = (message: Message) => {
    console.log(message)
}

const server = new sink.AsyncServer(sinkFn)
```

Still works if defined as part of a class.

```typescript
class Sink {
    counter = 0
    sinkFn = (message: Message) => {
        this.counter++
        console.log(this.counter, message)
    }
}

let sinker = new Sink()
const server = new sink.AsyncServer(sinker.sinkFn)
```

2. Using a named function <br>

Simple named functions work the same way.

```typescript
function sinkFn(message: Message) {
    console.log(message)
}

const server = new sink.AsyncServer(sinkFn)
```

Named functions defined as part of a class may need to be bound to the instance of the class.

```typescript
class Sink {
    counter = 0
    sinkFn(message: Message) {
        this.counter++
        console.log(this.counter, message)
    }
}

let sinker = new Sink()
const server = new sink.AsyncServer(sinker.sinkFn.bind(sinker))
```

If any of the examples are failing to build or if they need further clarification, please create an [issue](https://github.com/numaproj/numaflow-js/issues/new/choose) to fix the same.
