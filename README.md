# dsh-cognitive-dashboard

A user-facing **cognitive memory** view for the cognitive layer: the objective tree, the current task and other open work, findings, and the recall block a session starts from, shown in the DSH Web GUI.

The Host half publishes one session projection (`dashboard`). The objective tree is drawn from the model graph: the dashboard reads the graph service `dsh-cognitive-model` publishes (`cognitiveGraph`) instead of re-projecting the event log, so supersession and conflict detection keep one implementation. The graph is the only tree source (D98): a profile without the model plugin draws no tree and says so. The findings ledger (`.dsh/cognitive-findings/findings.json`) is read directly. The Web client adds a **Cognition** tab next to Chat and Trajectory. The view is read-only.

The checks card was removed in D94. It displayed a report written outside this repository (`docs/reports/checks.json`, produced by the cognitive-memory relay's check script), so the dashboard was self-diagnosis and a relay dependency on a tool outside this repository. The view now reads only the model's service and the findings ledger.

The last card is the **recall block** (D108): the text `dsh-cognitive-model` hands a session, shown verbatim. It replaced the recorded-structure card, which redrew the graph and could disagree with the input. The Host reads the block from the same service (`recall(root)`) in the same pass as the tree, and the client shows it as a wrapping `<pre>` so the indentation and line breaks survive. The per-session bird's-eye check (`BIRDSEYE`) is not in the text — the prompt spends it once per reader — and the card says so.

## Design

The view follows the Digital Agency dashboard design guide: the objective tree is the whole picture and comes first, then the current task and the other open work as context, then the open findings, then the recall block as the material behind them. There is no page verdict, no score and no threshold. Absence is shown as `not recorded` or `could not read`, never as success. Status is carried by a glyph and a word as well as a color.

The objective tree is a radial drawing: the root at the centre, each objective on a ring by depth, and the node radius set by **investment** (all tasks and findings ever linked, plus the commits touching the node's paths), relative to the largest branch (D89). A repository git cannot read makes its commit count a lower bound rather than a zero, and the detail says which link failed (D105). A ring around the node is **acceptance**: the share of the recorded milestones that are met. The current path is drawn (fill, outline, thicker edges) and repeated as a breadcrumb; selecting a node opens its tasks, open findings, implementation paths, docs, investment breakdown, acceptance items and last activity. Nodes are keyboard-reachable and announced as a tree; the view also offers search, zoom/pan and collapse. Size and ring are readings, not scores: no threshold and no verdict word (D85 / D89).

The 5W1H, the information inventory, the layout and graph choices, the color/accessibility decisions, and the checklist are in [`docs/DESIGN.md`](docs/DESIGN.md). Screenshots of the light and dark themes are in `docs/assets/`; the 2026-11-17 screenshots predate D94 and may show the removed checks card. The tree drawn from the model graph is `docs/assets/tree-from-graph-2026-11-22.png`. The recall block card is described in [`docs/DESIGN.md`](docs/DESIGN.md).

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
