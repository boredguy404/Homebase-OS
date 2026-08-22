# Repository structure

Homebase keeps the public application separate from private runtime data.

- `assets/` contains browser code, styles, and the project icon, grouped by feature.
- `pages/` contains secondary application screens.
- `modules/` contains self-contained product contracts and services (Orbit, Homebase Control, and Pocket Archive).
- `scripts/` contains setup and native-launch helpers.
- `docs/` contains setup, platform, readiness, and maintenance documentation.
- `media/` contains privacy-reviewed screenshots used by the public README.
- Root files are limited to launchers, the local server, PWA metadata, and project documentation.

Private or downloaded runtime folders such as `roms/`, `bios/`, `imports/`, `saves/`, `covers/`, `emulatorjs/`, and `bin/` must remain ignored. Do not force-add their contents.

Feature files should use purpose-based names. Avoid temporary suffixes such as `final`, `new`, `fix`, or `tweaks`; replace the owning module instead.

Every major surface also has `modules/<product>/manifest.json`: an editable map of feature ownership, runtime data boundaries, and safe change rules. See `docs/CORE_TAXONOMY.md`.
