# Relay Brain

Relay keeps lightweight, local Markdown knowledge alongside the code it can review.

## Scopes

- **App workspace**: removable apps under `user-apps/`; Relay may draft them from a prompt.
- **Developer workspace**: the small allowlist in `server.py`; Relay may draft a replacement, but a person reviews and explicitly confirms every write. A timestamped backup is made first.

## Note types

Write one focused note per fact in `brain/<type>/`:

- `map` — where a subsystem attaches.
- `convention` — rules editors must preserve.
- `decision` — why a choice was made; supersede rather than rewrite.
- `constraint` — safety or privacy boundary.
- `incident` — a failure and its symptom.
- `domain` — product vocabulary.
- `open` — unresolved work.

Each note should record source, confidence, and review date. Relay treats stale notes as leads, not facts.
