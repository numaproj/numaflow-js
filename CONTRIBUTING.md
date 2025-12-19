# Contributing to Numaflow-JS

This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Building the Project](#building-the-project)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Adding a New Feature](#adding-a-new-feature)
- [Updating Documentation](#updating-documentation)

## Overview

Numaflow-JS is a JavaScript/TypeScript SDK for [Numaflow](https://numaflow.numaproj.io/) that leverages Rust FFI through [NAPI-RS](https://napi.rs/) to
provide bindings for the [Numaflow Rust SDK](https://github.com/numaproj/numaflow-rs).

The codebase consists of following layers:

<!-- Added an HTML table below to allow merging cells across columns -->
<table style="text-align: center; vertical-align: middle;">
  <tr>
    <td colspan="2">
      User's TS/JS Code 
    </td>
  </tr>
  <tr >
    <td>
       <b>index.ts / index.js</b> <br> JavaScript wrapper layer <br> Adds JS conveniences
    </td>
    <td>
      <b>index.d.ts</b> <br> TypeScript type definitions <br> (compile-time only)
    </td>
  </tr>
  <tr>
    <td>
      <b> binding.js (auto-generated) </b> <br> Platform detection & loader
    </td>
    <td>
      <b> binding.d.ts (auto-generated) </b> <br> Types for Rust bindings
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b> src/*.rs (Rust source code) </b> <br> Implements NAPI bindings using <a href="https://github.com/numaproj/numaflow-rs">Numaflow-rs </a>
    </td>
</tr>
<tr>
    <td colspan="2">
      <b>numaflow-js.(platform).node (compiled native binary)</b> <br> Platform-specific compiled node addon binary
    </td>
  </tr>
</table>

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Tools

| Tool        | Version               | Installation                                                     |
| ----------- | --------------------- | ---------------------------------------------------------------- |
| **Node.js** | \>= 20                | [nodejs.org](https://nodejs.org/) or use `nvm`                   |
| **pnpm**    | 10.24.0+              | `npm install -g pnpm` or [pnpm.io](https://pnpm.io/installation) |
| **Rust**    | stable (2024 edition) | [rustup.rs](https://rustup.rs/)                                  |
| **Cargo**   | (comes with Rust)     | Included with Rust installation                                  |

### Verify Installation

```shell
node --version
pnpm --version
rustc --version
cargo --version
```

## Development Setup

1. **Clone the repository**

```shell
git clone https://github.com/numaproj/numaflow-js.git
cd numaflow-js
```

2. **Install dependencies**

```shell
pnpm install
```

3. **Build the project**

Debug build (faster compilation, includes debug symbols)

```shell
pnpm build:debug
```

OR Release build (optimized, slower to compile)

```shell
pnpm build
```

4. **Run tests to verify setup**

```shell
pnpm test
```

## Building the Project

The build process has two stages:

### 1. Build Rust to Native Binary

Debug build (development)

```shell
pnpm build:rs
```

Release build (production)

```shell
pnpm build:rs --release
```

This compiles the Rust code in `src/` and generates:

- `numaflow-js.*.node` - Platform-specific native binary
- `binding.js` - JavaScript loader with platform detection
- `binding.d.ts` - TypeScript definitions for the Rust bindings

### 2. Build TypeScript Wrapper

```shell
pnpm build:ts
```

This compiles `index.ts` to generate:

- `index.js` - JavaScript wrapper with additional conveniences
- `index.d.ts` - TypeScript definitions for the wrapper

### Full Build

Instead of the above two separate steps, we can use the following commands to build the whole project.
This also includes formatting and linting steps.

Debug (recommended for development)

```shell
pnpm build:debug
```

Release (for production/publishing)

```shell
pnpm build
```

## Running Tests

Tests are located in `tests/__test__/` and use [Vitest](https://vitest.dev/).

Run all tests

```shell
pnpm test
```

Run a specific test file

```shell
pnpm vitest run tests/__test__/sink-integration.spec.ts
```

Run a subset of tests

```shell
pnpm vitest run -t "source"
```

### Test Structure

The test suite currently only includes integration tests.
Each test under `tests/__test__/` does the following:

1. Starts the JS test async server for the respective component defined in `<test-name>.spec.ts`.
2. Runs the respective Rust test binary from `tests/src/`
3. The Rust test binary creates a client and calls the JS test async server.
4. The Rust test binary asserts the expected behavior.

The tests require the Rust test binaries to be built first, which happens through the test setup.

## Project Structure

```
numaflow-js/
├── src/                     # Rust source code (NAPI bindings)
│   ├── lib.rs               # Main library entry point
│   ├── sink.rs              # Sink implementation
│   ├── source.rs            # Source implementation
│   ├── map.rs               # Map UDF implementation
│   ├── reduce.rs            # Reduce UDF implementation
│   └── ...                  # Other components
├── tests/
│   ├── src/                 # Rust test client binaries
│   └── __test__/            # TypeScript/Vitest test files
├── examples/                # Example implementations
│   ├── sinker/
│   ├── mapper/
│   ├── reduce/
│   └── ...
├── index.ts                 # TypeScript wrapper (Manually created wrapper over generated `binding`)
├── index.js                 # JavaScript wrapper (generated)
├── index.d.ts               # TypeScript definitions (generated)
├── binding.js               # Native binding loader (auto-generated by napi.rs)
├── binding.d.ts             # Binding types (auto-generated by napi.rs)
├── Cargo.toml               # Rust workspace configuration
└── package.json             # Node.js package configuration
```

## Adding a New Feature

When adding a new Numaflow component or feature:

1. Implement in Rust
2. Build to generate bindings using napi.rs
3. Update/Create TypeScript wrapper if required
4. Add tests
5. Update/Create an example if required

## Updating Documentation

The API documentation is generated using [TypeDoc](https://typedoc.org/) and hosted on GitHub Pages from the `docs-site` branch.

### Generate Documentation Locally

```shell
pnpm docs:build
```

This generates the documentation in the `docs/` directory. You can preview it by opening `docs/index.html` in a browser. You may also view the docs locally by:
```shell
pnpm docs:serve
```

### Update the docs-site Branch

After making changes to the documentation (updating JSDoc comments, README, etc.), follow these steps to update the live documentation site:

```shell
# Ensure you're on the main branch with latest changes
git checkout main
git pull origin main

# Generate fresh documentation
pnpm docs:build

# Copy docs to a temporary location
cp -r docs /tmp/numaflow-docs

# Switch to the docs-site branch
git checkout docs-site

# Remove old documentation files
git rm -rf .

# Copy new documentation (including hidden files)
cp -r /tmp/numaflow-docs/. .

# Commit and push
git add -A
git commit -S -s -m "Update documentation"
git push origin docs-site

# Return to main branch
git checkout main

# Cleanup temporary files
rm -rf /tmp/numaflow-docs
```

The documentation will be available at: https://numaproj.github.io/numaflow-js/
