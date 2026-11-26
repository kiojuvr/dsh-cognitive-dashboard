# dsh-cognitive-dashboard

A user-facing **cognitive memory** view for the cognitive layer: the objective tree, the current task and other open work, findings, and the recall block a session starts from, shown in the DSH Web GUI.

The Web client adds a read-only **Cognition** tab next to Chat and Trajectory. The dashboard draws the objective tree from the `cognitiveGraph` service provided by `dsh-cognitive-model`. If the model plugin is not installed in the profile, the dashboard says so and does not draw a tree. It reads findings directly from the workspace ledger (`.dsh/cognitive-findings/findings.json`).

The last card shows the **recall block** verbatim, preserving its indentation and line breaks. It uses the text provided by `dsh-cognitive-model` and does not include the per-session bird's-eye check (`BIRDSEYE`).

## Design

The view follows the Digital Agency dashboard design guide: the objective tree is the whole picture and comes first, then the current task and the other open work as context, then the open findings, then the recall block as the material behind them. There is no page verdict, no score and no threshold. Absence is shown as `not recorded` or `could not read`, never as success. Status is carried by a glyph and a word as well as a color.

The objective tree places the root at the centre and arranges the other nodes in rings by depth. Node size shows **investment** relative to the largest branch: linked tasks and findings, plus commits touching the node's paths. If Git cannot read the history for a path, the dashboard marks the commit count as a lower bound and identifies the affected path. A ring around each node shows **acceptance**: the share of recorded milestones that are met.

The current path is highlighted in the tree and repeated as a breadcrumb. Select a node to see its tasks, open findings, implementation paths, docs, investment breakdown, milestones and last activity. The tree supports keyboard navigation, search, zoom, pan and collapse.

See [`docs/DESIGN.md`](docs/DESIGN.md) for layout and accessibility choices and design history.

## Install

Every cognitive plugin installs with the same four steps.

1. Put the shared library in a sibling checkout named `dsh-cognitive-core`. It
   ships its built `lib/`, so it needs no build step of its own, and it is never
   added to DSH directly.
2. In this plugin's directory, run `npm install`, then `npm run build` when the
   package declares a build script. `npm install` links `dsh-cognitive-core` into
   the checkout, because a linked checkout keeps its own `node_modules`.
3. Add this directory to DSH: **Plugins > Add plugin**, or
   `dsh plugin --profile <profile> add <absolute path>` from a shell. The
   installer writes the `link:` dependency and the bundle entry into the
   profile's `package.json`; do not edit it by hand.
4. The plugin is enabled when it is added. If it is not, enable it in
   **Plugins**.

The plugin is its own bundle (`dsh.bundle.patch`), so the profile needs no other
entry. A browser half, when the package declares one (`dsh.client`), is served
from the checkout; reload the page after changing it.

## Test

`npm install` also installs the test dependencies (react, react-dom, jsdom). `npm test` runs two files: `test/host.test.mjs` drives the Host projection against a graph snapshot, the recall block it carries, and the absent/missing/error states, and `test/render.test.mjs` loads `client.js` the way the DSH client loader does, renders it with jsdom, and checks the radial tree, the node panel, the keyboard behaviour, search/zoom/collapse, a deeper tree, the empty-workspace state, the recall block shown verbatim with its four absences kept apart, the graph-sourced description, the missing-model state, the absence of the composer dock card, and the `認知` tab title.

## Related

- `dsh-cognitive-model` — the graph the tree is drawn from and the recall block the last card shows: objectives, components, tasks, the epistemic record and the world model, projected from an event log. The dashboard reads its `cognitiveGraph` service.
- `dsh-cognitive-findings` — writes the findings ledger.

The full behavior and limitations are in [`docs/DETAIL.md`](docs/DETAIL.md).
