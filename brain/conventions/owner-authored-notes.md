---
type: convention
status: active
confidence: verified
source: NovaShell local knowledge contract
reviewed: 2026-08-30
---

# Owner-authored local notes

Second Brain can store a deliberate owner note in
`local/brain-import/owner-notes/`. This folder is ignored by Git and remains on
the local machine. Notes are visible to Relay as context, but they never expand
Relay's file, shell, network, or edit authority.

## Write contract

- The owner supplies a title, one approved folder, and up to 12,000 characters.
- NovaShell derives a safe Markdown filename and writes only inside the owner
  note folder.
- Saving the same title in the same folder intentionally updates that note.
- Imported archive content remains read-only; only the separate owner-note
  folder accepts this intentional local write.

## Use it for

Durable preferences, project context, decisions, current constraints, and open
questions. Do not store credentials, recovery codes, financial details, or
personal records that do not need to guide NovaShell work.
