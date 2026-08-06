# Security policy

## Supported versions

Security fixes are applied to the latest tagged release and `main`.

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository. Include the affected version and browser, a minimal reproduction, security impact, and a suggested remediation when possible.

Do not include real trades, account data, access tokens, or vault passphrases. Allow the maintainer a reasonable remediation window before public disclosure.

## Scope

Relevant reports include encryption flaws, unsafe imports, cross-site scripting, unexpected network transmission, backup corruption, container weaknesses, and supply-chain risks. Social engineering and attacks requiring a fully compromised operating system are generally out of scope.

## Secret handling

TradeVault requires no application secret. Never commit `.env*`, browser profiles, private journal exports, screenshots containing account data, or generated vault files.
