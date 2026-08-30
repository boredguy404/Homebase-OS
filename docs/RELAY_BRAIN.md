# Relay Brain

## Owner-authored local knowledge

Second Brain can save a deliberate owner note to the ignored local path
`local/brain-import/owner-notes/`. The note is indexed as local context and can
be read by Relay, but it never adds tool authority or becomes a Git-tracked
project file. The browser accepts only a title, an approved knowledge folder,
and a bounded Markdown body. See `brain/conventions/owner-authored-notes.md` for
the full boundary.

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
