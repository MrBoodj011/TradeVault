# Threat model

## Protected assets

- trade history, notes, screenshots, strategies, and account size;
- encryption passphrases and decrypted in-memory data;
- backup integrity and availability;
- the software supply chain and release artifacts.

## Trust boundaries

The browser profile and operating system are trusted. Imported JSON and CSV files, screenshot URLs, dependencies, pull requests, and container base images are untrusted.

## Main threats and mitigations

| Threat                               | Mitigation                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Another person reads browser storage | Optional AES-256-GCM vault encryption with a memory-only key                                   |
| Malicious or corrupt import          | File-size limits, strict schema validation, row rejection, and bounded collections             |
| Spreadsheet formula injection        | Dangerous CSV prefixes are neutralized before export                                           |
| Cross-site scripting                 | React escaping, HTTPS-only screenshot URLs, no raw HTML rendering, and Content Security Policy |
| Clickjacking and data exfiltration   | `frame-ancestors 'none'`, restrictive connect policy, referrer and permissions policies        |
| Dependency or secret compromise      | Lockfile installs, Dependabot, dependency review, CodeQL, Gitleaks, and SBOM-enabled releases  |
| Container escape                     | Non-root process, dropped capabilities, read-only filesystem, and no-new-privileges            |
| Data loss                            | Explicit JSON and CSV backups; the user controls backup frequency and location                 |

## Out of scope

TradeVault cannot protect an unlocked vault from a compromised operating system, malicious browser extension, memory inspection, keylogger, or a user who publishes an unencrypted backup. It is not an execution venue and does not protect brokerage accounts.

## Security invariants

- Core functionality must never require telemetry or an external API.
- Imported data is untrusted until validated.
- Stored schema changes require a version and migration path.
- Decryption failures must not partially expose or overwrite data.
- A remote-data feature must be opt-in and update this document before release.
