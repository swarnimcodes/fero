# Architecture and Build Notes

Fero is organized as a small monorepo with a reusable protocol core and a Tauri desktop application.

## Architecture Overview

### `fero-core`

`fero-core` is the Rust crate that contains the Nearby Share / Quick Share implementation. It owns the protocol logic for discovery, mDNS, Bluetooth signaling, connection handling, transfer state, and payload metadata.

The crate is kept outside the Tauri app deliberately:

- It can be checked, tested, and evolved independently from the desktop shell.
- The protocol engine remains reusable for future tools, CLIs, or alternate frontends.
- Rust domain types can generate TypeScript bindings that the frontend imports.

The crate also publishes generated TypeScript models through its local npm package, `@swarnimcodes/fero-core`, which is linked into the Tauri frontend during development.

### `app/main`

`app/main` is the Tauri desktop application. It contains:

- the Vue frontend in `app/main/src`
- the Tauri Rust shell in `app/main/src-tauri`
- app-specific behavior such as tray integration, settings, notifications, command handlers, and packaging

The Tauri backend depends on `fero-core` as a local Rust path dependency. The Vue frontend depends on `@swarnimcodes/fero-core` as a local pnpm link dependency for shared TypeScript types.

## Build Requirements

Install the system dependencies required by Tauri and the protocol crate. On Linux this includes `protobuf-compiler`, DBus/AppIndicator development libraries, GTK/WebKit dependencies, and the usual Rust/Node toolchains.

This project uses pnpm. The pinned package manager version is declared in `app/main/package.json`.

## Common Commands

### Check `fero-core`

```bash
cd fero-core
cargo check
```

### Run the Tauri App in Development

```bash
cd app/main
pnpm install
pnpm tauri dev
```

### Typecheck and Lint the Frontend

```bash
cd app/main
pnpm ts-check
pnpm lint
```

### Build the Frontend

```bash
cd app/main
pnpm vite:build
```

### Build Desktop Packages

```bash
cd app/main
pnpm build
```

The package output is produced by Tauri under `app/main/src-tauri/target`.

## Generated Files

`fero-core` uses `ts-rs` to generate TypeScript bindings into `fero-core/bindings`. Those bindings are checked in because the frontend imports them directly through the local package link.

`app/main/dist`, `app/main/node_modules`, and Rust `target` directories are generated locally and ignored by git.
