---
type: decision
status: active
confidence: verified
source: owner-approved local archive and FTP metadata review
reviewed: 2026-08-30
---

# Source-informed builds are clean rebuilds

NovaShell may learn from reviewed private sources, but it does not silently turn them into product dependencies. A source review can contribute a capability, interaction pattern, or architectural lesson. The NovaShell implementation is then written against NovaShell's own app contract.

## What can move forward

- A clearly described capability with an obvious local-first use.
- A general interaction pattern, such as a recovery timer, local playlist loop, data browser, or plain-file note map.
- A public or owner-confirmed dependency that passes license and security review.

## What stays out

- Personal notes, people, conversations, uploads, accounts, credentials, logs, databases, analytics, private media, and production configuration.
- Opaque code copied solely because it happens to work.
- Features that depend on unreviewed licensing, safety, financial, or location claims.

## Completion gate

A source-informed feature is only called stable after it is modular, has a manifest when it is a user app, works with local data, can be removed without damaging NovaShell, and passes a smoke test. The source stays an audit reference, not a runtime requirement.
