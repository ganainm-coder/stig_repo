
# Pathfinder 2e Remaster Character Builder

An experimental browser-based character builder using Python through Pyodide.

## Features

- English interface
- Create at a selected character level
- Level-up workflow
- Basic ability modifier calculations
- Illustrative hit point calculation
- Browser-local character saving
- JSON character import and export
- Static hosting compatible with GitHub Pages

## Run locally

Because the app loads Python and its engine file asynchronously, use a local
HTTP server instead of opening index.html directly.

With Python installed, run this command from the project directory:

    python -m http.server 8000

Then open:

    http://localhost:8000

## GitHub Pages

Commit the files to the branch and folder configured in the repository's
Pages settings. Wait for the Pages deployment to complete, then open the
published URL.

The first visit requires internet access to download Pyodide from its CDN.

## Important limitations

This is a starter prototype, not a complete Pathfinder rules implementation.
Its sample ancestry and class data and HP calculations are not a substitute
for full rules validation. It does not yet include complete feats, spells,
equipment, proficiency progression, prerequisites, or legal-build checking.

## Data and licensing

Before adding content from official publications, check the applicable
publisher's licenses and policies. Keep original rules text and other
copyrighted material out of the project unless you have permission to use it.
Prefer independently authored data, permitted references, and links to
authorized sources.
