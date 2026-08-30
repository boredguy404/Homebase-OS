---
type: pattern
status: active
confidence: verified
source: NovaShell Relay workflow contract
reviewed: 2026-08-30
---

# Relay workflow playbook

Relay handles substantial work as a visible lifecycle instead of pretending a single chat reply performed it.

1. **Frame** — name the outcome, scope, files or app surface, and success check.
2. **Route** — choose a removable app, an allowed core edit, a local research note, or an explicit external handoff.
3. **Act** — create a tracked workflow and attach its local job when code runs.
4. **Verify** — run syntax checks, focused smoke checks, and a diff check.
5. **Reconcile** — the workflow reads the real job result and becomes completed or failed; it is not marked complete from optimistic UI state.
6. **Record** — save the decision, boundary, and outcome in the project ledger so the next task has context.

## Guardrails

- New apps live under `user-apps/` and remain removable.
- Core edits remain allowlisted and receive a local backup before the edit.
- External projects are never auto-run from NovaShell; their handoff is explicit.
- A failed check is useful evidence, not a reason to hide the workflow.
