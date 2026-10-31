# npm dependency audit

Audited the npm lockfile against the npm advisory registry on 2026-10-31. This is a dependency advisory review, not a full application security assessment or a demonstration that an advisory is exploitable in Snap. Python dependencies and container base images were not audited in this pass.

The initial audit reported 27 affected packages: one low, 20 moderate, and six high. `npm audit fix --package-lock-only --ignore-scripts` updated compatible resolutions without running package lifecycle scripts. The resulting lockfile audit reports 21 affected packages: two low and 19 moderate, with no high or critical entries. These numbers count affected packages, including dependents, not distinct vulnerabilities.

The production-dependency view (`npm audit --omit=dev`) reports six affected packages: two low and four moderate. They trace to `shadcn` through `deepmerge` and `ts-morph`/`minimatch`. Snap imports `shadcn/tailwind.css` for its build; this review did not establish an application request path to the affected JavaScript. The other findings trace to the ESLint tooling tree through `minimatch`. The relevant advisories are [deepmerge prototype poisoning](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) and [minimatch glob amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249).

npm's proposed forced fixes include downgrades of ESLint and shadcn to incompatible major versions; they were not applied. Recheck the advisories and compatible upstream releases before shipping. The lockfile has changed, but installed packages and Docker images are not updated until the next `npm ci` or image rebuild; validate the application against the resulting install before release.
