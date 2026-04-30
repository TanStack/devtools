---
"start": patch
---

Make react-start example compatible with npm-based sandboxes

Replace the 'workspace:*' dependency reference with a fixed version (^0.4.0) for @tanstack/devtools-event-client in the react/start example.

The workspace:* reference was incompatible with npm-based sandboxes like StackBlitz and CodeSandbox, causing pnpm install failures with 'ERR_PNPM_OUTDATED_LOCKFILE' error.

This change allows the example to be used in cloud-based development environments while maintaining version compatibility.
