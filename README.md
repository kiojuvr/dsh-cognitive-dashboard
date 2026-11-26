# dsh-cognitive-dashboard

A user-facing **cognitive memory** view for the cognitive layer: the objective tree, the current task and other open work, findings, and the recall block a session starts from, shown in the DSH Web GUI.

The Web client adds a read-only **Cognition** tab next to Chat and Trajectory. The dashboard draws the objective tree from the `cognitiveGraph` service provided by `@kioju/dsh-cognitive-model`. If the model plugin is not installed in the profile, the dashboard says so and does not draw a tree. It reads findings directly from the workspace ledger (`.dsh/cognitive-findings/findings.json`).

The last card shows the **recall block** verbatim, preserving its indentation and line breaks. It uses the text provided by `@kioju/dsh-cognitive-model` and does not include the per-session bird's-eye check (`BIRDSEYE`).

## Design

The view follows the Digital Agency dashboard design guide: the objective tree is the whole picture and comes first, then the current task and the other open work as context, then the open findings, then the recall block as the material behind them. There is no page verdict, no score and no threshold. Absence is shown as `not recorded` or `could not read`, never as success. Status is carried by a glyph and a word as well as a color.

The objective tree places the root at the centre and arranges the other nodes in rings by depth. Node size shows **investment** relative to the largest branch: linked tasks and findings, plus commits touching the node's paths. If Git cannot read the history for a path, the dashboard marks the commit count as a lower bound and identifies the affected path. A ring around each node shows **acceptance**: the share of recorded milestones that are met.

The current path is highlighted in the tree and repeated as a breadcrumb. Select a node to see its tasks, open findings, implementation paths, docs, investment breakdown, milestones and last activity. The tree supports keyboard navigation, search, zoom, pan and collapse.

See [`docs/DESIGN.md`](docs/DESIGN.md) for layout and accessibility choices and design history.

## Install

In DSH, open **Plugins**, choose **Add plugin**, and enter
`@kioju/dsh-cognitive-dashboard`. From a shell the same install is
`dsh plugin add @kioju/dsh-cognitive-dashboard`. The plugin is enabled when it is added;
switch it on in **Plugins** if it is not.

The package is its own bundle (`dsh.bundle.patch`), and the shared library
`@kioju/dsh-cognitive-core` arrives as an ordinary dependency — no checkout, no build
step, nothing to place beside it. The browser half (`dsh.client`) ships with the
package; reload the page after an update.

The other two plugins install the same way: `@kioju/dsh-cognitive-model` (the graph and
the recall block the last card shows) and `@kioju/dsh-cognitive-findings` (the findings
ledger). The dashboard draws its tree from the model, so install that too.

## Test

`npm install` also installs the test dependencies (react, react-dom, jsdom). `npm test` runs two files: `test/host.test.mjs` drives the Host projection against a graph snapshot, the recall block it carries, and the absent/missing/error states, and `test/render.test.mjs` loads `client.js` the way the DSH client loader does, renders it with jsdom, and checks the radial tree, the node panel, the keyboard behaviour, search/zoom/collapse, a deeper tree, the empty-workspace state, the recall block shown verbatim with its four absences kept apart, the graph-sourced description, the missing-model state, the absence of the composer dock card, and the `認知` tab title.

## Related

- `@kioju/dsh-cognitive-model` — the graph the tree is drawn from and the recall block the last card shows: objectives, components, tasks, the epistemic record and the world model, projected from an event log. The dashboard reads its `cognitiveGraph` service.
- `@kioju/dsh-cognitive-findings` — writes the findings ledger.

The full behavior and limitations are in [`docs/DETAIL.md`](docs/DETAIL.md).
