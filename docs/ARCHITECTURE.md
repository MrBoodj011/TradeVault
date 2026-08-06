# Architecture

TradeVault is a local-first Next.js application. The production server delivers the application shell and static assets; trading records do not need to cross a network boundary.

```text
Browser
  UI and analytics
        |
  validated domain model (Zod)
        |
  IndexedDB vault
        |-- plain local record
        `-- optional AES-256-GCM encrypted envelope

Explicit user actions only
  |-- JSON backup
  `-- spreadsheet-safe CSV import/export
```

## Layers

- `src/domain`: versioned types, validation schemas, and sample data.
- `src/lib`: deterministic analytics, cryptography, storage, and portable-data boundaries.
- `src/hooks`: hydration, autosave, encryption state, and domain mutations.
- `src/components`: product views and accessible interaction flows.
- `src/app`: Next.js metadata, PWA manifest, global styles, and the application entry point.

## Data lifecycle

On first launch, TradeVault creates an empty schema-versioned workspace in IndexedDB. Changes are saved after a short debounce. Enabling encryption rewrites that record as an authenticated ciphertext envelope. The passphrase-derived key remains in memory only and is discarded when the vault is locked or the page closes.

JSON import replaces the current workspace only after complete schema validation. CSV import validates every row and reports rejected records. Exported spreadsheet strings beginning with `=`, `+`, `-`, or `@` are prefixed to prevent formula execution.

## Network boundary

The upstream application has no API routes, database connection, authentication provider, telemetry SDK, or background synchronization. Forks that add a backend must introduce authentication, authorization, tenant isolation, CSRF protection, rate limits, encrypted transport, migrations, and an updated threat model.
