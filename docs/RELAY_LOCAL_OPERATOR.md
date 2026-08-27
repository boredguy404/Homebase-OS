# Relay Local Operator

Relay has two intentionally separate paths:

- **Offline Operator** is deterministic and local-only. It can read safe metadata for the device, owned-game index, local app manifests, and Project Board, or navigate to selected NovaShell screens. It cannot execute shell commands, read file contents, write files, access credentials, or make a network request.
- **Local Codex** is a separate developer runner. It is fixed to this checkout, requires the exact `RUN LOCAL CODEX` confirmation, and streams its milestones to Project Board. It does not depend on Relay's provider-key profile.
- **Optional AI routes** are external-provider connections. Saving a key is local only; a provider request happens only after an explicit Send, Test, or AI-draft action. Provider free tiers are external policies, not an offline feature or a guarantee.

The operator follows a compact agent pattern: a visible state/capability snapshot, a constrained tool registry, an action trace, and explicit confirmation for any coding runner. It is implemented directly in NovaShell without importing a third-party agent framework or adding a remote dependency.
