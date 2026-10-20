# Contributing to Mantle Icons

Mantle Icons is an independent community-maintained icon library continued
from the MIT-licensed PrimeIcons 7.0.0 codebase.

Mantle UI is not affiliated with PrimeTek, PrimeReact, or ngrok.

Thank you for contributing. This document explains how contributions are
reviewed and the terms under which they are accepted.

## Contribution Terms

By submitting a contribution to Mantle UI, you confirm that:

- You have the legal right to submit the contribution.
- The contribution is your own original work, or you otherwise have the
  right to license it for this project.
- You are submitting the contribution under the same MIT license used by
  this repository.

By submitting a pull request, patch, issue attachment, or other material
intended for inclusion in the project, you agree that your contribution may
be used, modified, distributed, and relicensed by downstream users under the
repository's MIT license.

This project does not require a separate Contributor License Agreement.

## What to Contribute

Contributions are welcome for:

- Bug fixes
- Accessibility improvements
- Tests
- Documentation improvements
- Performance improvements
- New icons or features that fit the project direction

Before starting larger work, open an issue or discussion so the approach can
be reviewed before implementation begins.

## Contribution Process

1. Fork the repository and create a branch for your work.
2. Keep changes focused and scoped to a clear problem or feature.
3. Add or update tests when behavior changes.
4. Open a pull request with a clear description of the change.

Pull requests may be reviewed for correctness, maintainability, API impact,
documentation impact, accessibility, and consistency with the project
direction. Not every contribution will be merged.

## Code and Documentation Standards

- Code must build and work correctly.
- New behavior should include tests where practical.
- Comments, commit messages, identifiers, and documentation should be in
  English.
- Follow the repository's local coding conventions and build workflow.

## Icon Sources and Validation

The imported icons retain their IcoMoon `selection.json`, 24×24 filled-outline
`raw-svg/` sources, and `fonts/primeicons.*` assets. The font filenames and internal
identity remain unchanged for existing consumers.

New additions are registered in `scripts/icon-additions.json` with kebab-case
names, search tags and permanently assigned private-use codepoints. Never reuse
or renumber an existing codepoint. `paint-bucket` uses U+EA3A and `eyedropper` uses
U+EA3B, immediately after the highest imported assignment, U+EA39.

1. Run `npm ci`.
2. Edit a filled-outline SVG in `raw-svg/` with `viewBox="0 0 24 24"`. Use the
   existing rounded outline style and approximately 1.5px source line weight.
3. Run `npm run generate` to update the TTF, WOFF, WOFF2 and EOT fonts, append
   SVG font glyphs, and synchronize the IcoMoon selection, CSS aliases and gallery.
   The generator normalizes new art to the existing 1024 em / 6.25% baseline.
   It retains imported TTF outlines and metrics rather than reimporting old SVGs.
4. Run `npm run build` and `npm run pack:check`. Build verifies generated files
   are current and tests all binary font formats against the 7.1.1 compatibility
   fingerprints in `tests/fixtures/legacy-glyphs.json`. Do not regenerate that
   fixture to accept an unintended change to an existing glyph.
5. Use the existing `demo.html` gallery to inspect rendering at normal icon sizes,
   and inspect the corresponding `raw-svg/` sources.

Commit the source, registry, generated assets and relevant tests/docs together.
Font tooling is pinned as a development dependency and is not shipped to consumers.

## Licensing and Attribution

Mantle Icons is distributed under the MIT license. Contributions accepted into
the repository become part of that MIT-licensed codebase.

Mantle Icons remains a continuation of the MIT-licensed PrimeIcons 7.0.0
codebase.
Upstream copyright and license notices must be preserved where required by
the MIT license.

## Conduct

Be respectful, direct, and constructive in issues, discussions, and pull
requests. Technical disagreement is normal; personal attacks are not.
