# Basic React example

Run the example from the repository root:

```sh
pnpm --filter @tanstack/devtools-example-react-basic dev
```

The accessibility plugin is registered only in development builds. The page's `A11yAuditFixture` deliberately includes three violations so the plugin has deterministic findings to display:

- `image-alt`: an image without alternative text
- `button-name`: an icon-only button without an accessible name
- `label`: an input without an associated label

The fixture is intentionally invalid test content, not an accessibility pattern to copy. Browser extensions, environment differences, or future audit rules may report additional findings.
