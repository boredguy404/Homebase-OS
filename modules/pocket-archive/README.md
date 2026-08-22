# Pocket Archive module

This folder is the semantic contract for Pocket Archive. The live page remains
`/pages/arcade.html` during the incremental migration, but new functionality
belongs in named feature files—not in the page's legacy inline script.

Read `manifest.json` before changing the Archive. It says who owns each part,
where its data comes from, and the boundaries that protect private ROMs.

## Adding a feature

1. Put interaction code in `assets/scripts/arcade/<feature>.js`.
2. Put its CSS in `assets/styles/arcade/<feature>.css`.
3. Load it from the Arcade branch of `assets/scripts/shared/theme-sync.js`.
4. Add an entry to `manifest.json`.
5. Check touch scrolling, keyboard, and Xbox navigation before publishing.

Do not put ROMs, BIOS files, saves, or personal artwork in this module.
