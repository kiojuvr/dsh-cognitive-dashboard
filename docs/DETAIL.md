# cognitive dashboard

The cognitive dashboard view, shown in the conversation view ring.

## What it shows

- **Objective tree** — a radial drawing of objectives (`objective/...`) and means (`component/...`).
  The tree is drawn from the **model graph**: the Host reads the `cognitiveGraph` service that
  `dsh-cognitive-model` publishes, so the structure and the acceptance are the graph's projection
  and the drawing does not re-implement supersession or conflict detection (D97). The root sits at
  the centre, objectives on the next ring, and each means node under the objective it serves; the
  node radius is **investment** (all tasks and findings ever linked, plus the commits touching its
  paths), relative to the largest branch, and a ring shows **acceptance** (the share of recorded
  milestones that are met). A repository git cannot read makes its commit count a lower bound
  rather than a zero: the detail says `N+ commits (一部の履歴を読み取れません)`, or
  `commits を読み取れません` when the lower bound is zero, and marks the link that failed (D105).
  The current path is drawn (fill, outline, thicker edges) with a breadcrumb beside it. `requires`
  edges are dashed arcs. Selecting a node opens its tasks, open findings, implementation paths and
  docs, its investment breakdown, acceptance items, last activity and stale links, plus its edges:
  what it serves, what it needs, what breaks if it is removed, and who verifies it. Search, zoom/pan
  and collapse (double click) are on the same card. A profile without the model plugin draws no tree
  and says so (D98).
- **Current task and other open work** — the current task (three-line clamp; the full value is
  in the tooltip) with how long ago it was updated, and the other unfinished parts
  (`remaining`, three-line clamp, full value in the tooltip) under it. When nothing is
  recorded, the line says `not recorded` rather than disappearing: absence is not
  evidence that nothing else remains (D66 / D79).
- **Open findings** — the open count, and the list ordered by priority with kind, age, status,
  and a stale marker.
- **Recall block** — the text a session starts from, shown verbatim. The Host reads it from the
  `cognitiveGraph` service (`recall(root)`) and carries it in the `dashboard` projection, so the card
  shows the block the prompt received instead of drawing a second approximation of the graph
  (D108). The text keeps its indentation and line breaks (a wrapping `<pre>`): the tree depth and the
  sections are part of what a reader checks. A short definition line says that the per-session
  bird's-eye check (`BIRDSEYE`) is not part of this text — the prompt spends it once per reader, and
  a read-only card must not spend it. No block, an unreadable block, and a profile without the model
  plugin stay apart: the card says which one it is instead of showing an empty block (F4).

The order is the whole picture first (the objective tree), then the current task and the
other open work, then the open findings, then the recall block. There is no page header:
the tab name is the visible title and a visually hidden `h1` keeps the document outline. The
page leaves room for the floating composer at the bottom, so nothing is permanently hidden
under it. See `docs/DESIGN.md` for the 5W1H, the information inventory, and the
layout/color/graph decisions.

The checks card was removed in D94: it showed a report produced outside this repository,
which made the view self-diagnosis and a relay dependency. The view reads only the
workspace ledgers.

The objective tree moved from the memory ledger to the model graph in D97. The Host reads the
graph service the model plugin publishes instead of re-projecting the event log, so supersession,
invalidation and conflict detection keep one implementation. The memory ledger is no longer a
tree source (D98): the graph is the only one, so a profile without the model plugin draws nothing.
The recorded-structure card was replaced by the recall block in D108: the block is the input's
own text, so the card and the prompt cannot disagree.

## Where it appears

- A **Cognition** tab next to Chat and Trajectory in the conversation view
  ring.

## Install

Run `npm install` in the plugin directory first: the Host imports the sibling
`dsh-cognitive-core`, and the local link resolves it from this checkout. Then add
the directory in **Plugins > Add plugin**, or run `plugin_manager`
`install_bundle` with the absolute path.

## Data and safety

- Read-only. It never writes the ledgers.
- The Host publishes one session projection (`dashboard`). The tree is built from the graph the
  model plugin publishes (`cognitiveGraph` service), the recall block is read from the same service
  (`recall(root)`), and `.dsh/cognitive-findings/findings.json` is read directly. There is no
  memory-ledger fallback (D98). The browser reads the projection with the standard `useProjection`
  hook and no longer reads a second projection. No command is executed, so the view adds no command
  rows to the conversation.
- The recall block is the model's own text, read through its service. The client imports nothing
  from that package, and the Host reads its service rather than its files, so the two plugins stay
  independent: absent, the card and the tree report that the model plugin is not in the profile.
  The model's read is cached, so carrying both the tree and the block costs one read of the log.
- There is no check report and no check script in this view. The checks card and
  its dependency were removed in D94.
- The workspace root is the session header's cwd (nearest `.git`). A session
  whose effective cwd differs can show another workspace's ledgers.

## Limitations (v0.8)

- The projection re-reads on relevant session events (tool result,
  turn end, user message, command done). A ledger edited outside a turn does not
  refresh the view until the next event; there is no refresh button.
- The tree and the recall block come from the **same** model read, so they agree by construction.
  Without the model plugin both report the plugin as absent and draw nothing.
- The recall block is the passive block: the bird's-eye check (`BIRDSEYE`) is added by the prompt
  once per reader and is not in this text. A reader comparing the card with a prompt that fired the
  check will see that one section missing; the definition line says so.
- The recall block is bounded by the model's `contextLimit` (tree rows) and `recallLimit` (facts),
  and it says `(+N more not shown; graph_query)` when it cuts something. The graph snapshot behind
  the tree is bounded separately to 200 nodes / 400 edges / 20 inference rows (D104).
- Node size is investment (tasks + findings + commits, relative) and the ring is acceptance
  (milestones done / total); neither is a score (D89). A commit that touches a path shared by two
  means counts for both.
- When git cannot read a repository, the commit count is a lower bound (`commitState: unavailable`).
  The tree size uses that lower bound, and the detail, the implementation link and the accessible
  name say so; the count is never shown as an exact 0. `commitErrors` names the links that failed
  (D105).
- The host ToDo panel can overlay the middle of the view while tasks are active.
  It is a host surface, not part of this view.
