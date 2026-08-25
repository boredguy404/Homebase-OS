# Portable Backup

NovaShell exports selected local data to an ordinary ZIP containing
`homebase-backup.json`. Before restore, `runtime.py` compares every valid
archive entry with its actual destination and reports new files, conflicts,
preserved files, replacements, blocked entries, and bytes.

The same immutable plan drives extraction. Skip is the default; explicit
replacement first copies the existing file into ignored local recovery data.
Preferences are returned to the browser for a localStorage merge and provider
credentials are never part of the archive.
