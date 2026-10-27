# Repository Guidelines

## Project Structure & Module Organization

This directory currently contains `prompt_inicial.md`, the Portuguese specification for **Preço Artesão**, an offline pricing calculator for artisans. No application source, tests, assets, or dependency manifests are present yet. Read the specification before implementing features and follow its phased delivery strategy.

As code is introduced, separate pricing calculations, versioned tax rules, IndexedDB persistence, and UI components. Document actual source, test, and asset locations in `README.md`.

## Build, Test, and Development Commands

No build, development, lint, or test commands are configured. Do not assume `npm test` or `npm run build` exists.

For a future static HTML application, `python3 -m http.server 8000` can serve files at `http://localhost:8000`; it does not compile TypeScript or install dependencies. When tooling is added, document installation, development, build, and test commands in `README.md`, including Linux and Windows instructions.

## Coding Style & Naming Conventions

No formatter, linter, or indentation convention is established. Follow existing file style and configure consistent formatting when introducing application code. Use descriptive names and small modules. Prefer semantic HTML, CSS variables, and JavaScript or TypeScript.

Use Brazilian Portuguese for user-facing text and BRL formatting. Store money as integer cents or exact decimals. Keep tax rules independent from pricing and version them by effective period.

## Testing Guidelines

No testing framework or coverage threshold is configured. Add automated tests for unit conversions, batch recipes, labor, expense allocation, margin versus markup, rounding, and impossible pricing scenarios. Cover tax-regime distinctions, backup restoration, schema migrations, and offline operation. Use descriptive test names identifying the scenario and expected result. Validate complex tax fixtures against official sources or accounting review.

## Commit & Pull Request Guidelines

Git history is unavailable in this checkout, so no commit convention can be confirmed. Use concise, imperative commit subjects. Pull requests should explain the change, reference the relevant specification section or issue, and record validation performed. Include screenshots for UI changes and migration details for storage changes.

## Privacy & Offline Requirements

Keep business data local. Avoid telemetry, mandatory backends, and runtime CDN dependencies. Validate imported backups and preserve records during migrations. Verify current official legislation before implementing tax values; clearly label hypothetical scenarios.
