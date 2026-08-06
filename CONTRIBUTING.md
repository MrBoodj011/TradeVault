# Contributing to TradeVault

Thank you for helping build private, evidence-driven trading software.

## Before opening a pull request

1. Search existing issues and discussions.
2. Create a focused branch from `main`.
3. Keep real trading data and secrets out of fixtures, screenshots, and logs.
4. Add or update tests for every behavior change.
5. Run the complete local check:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Development principles

- Local-first and no-network behavior is the default.
- Metrics must be deterministic and covered by unit tests.
- Stored-data changes need a schema version and migration plan.
- Risk and performance calculations must document their assumptions.
- UI changes must support keyboard navigation, mobile widths, and reduced motion.
- Dependencies need a clear purpose and must not introduce telemetry.

Pull requests should explain the problem, solution, test evidence, privacy impact, and include screenshots for visual changes.

Do not file public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).
