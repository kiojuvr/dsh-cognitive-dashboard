# Cognitive dashboard: behavior and limitations

The read-only **Cognition** tab appears next to Chat and Trajectory in the DSH Web GUI. See the [installation instructions](../README.md#install) to add it to a profile and the [design notes](DESIGN.md) for the layout and accessibility rationale.

## What it shows

- **Objective tree.** The root is at the centre, with objectives and components arranged in rings by depth. Node size shows investment (linked tasks and findings, plus commits touching implementation paths) relative to the largest branch. The acceptance ring shows the share of recorded milestones that are complete. Neither is a score. The current path is highlighted and shown as a breadcrumb. Select a node to see its tasks, open findings, links, relationships, investment breakdown, milestones and last activity. Search, zoom, pan and collapse are available in the tree.
- **Current task and other open work.** The view shows the current task, how recently it was updated, and the other recorded tasks below it. The full text is available in a tooltip when the description is truncated. `Not recorded` does not mean that nothing remains.
- **Open findings.** The view shows the open count and lists findings by priority, with their kind, age, status and staleness. It distinguishes a missing or unreadable ledger from a readable ledger with no open findings.
- **Recall block.** The view displays the text supplied by the model, preserving line breaks and indentation. It does not include or mark as seen the bird's-eye check (`BIRDSEYE`) that can be added to a session's prompt once per error. The view distinguishes a missing block, an unreadable block and an unavailable model service.

## Data sources

The Host publishes one session projection (`dashboard`), which the Web client reads with `useProjection`. The Host calls `snapshot(root)` and `recall(root)` on the model plugin's `cognitiveGraph` service rather than reading or re-projecting its event log. The two reads share the model's cache. A profile without the model plugin shows no objective tree or recall block; findings remain available independently.

The Host reads findings directly from `.dsh/cognitive-findings/findings.json` in the workspace. It resolves the workspace from the session header's working directory, using the nearest ancestor containing `.git` or the directory itself if no ancestor contains it. If the session's effective working directory changes, the dashboard can still show the workspace from the header.

The dashboard does not write to either store or add command rows to the conversation. It uses local Git history to count commits touching implementation paths.

## Limitations

- The projection refreshes after relevant session events (tool result, turn end, user message or command completion). An external edit does not appear until the next event; there is no manual refresh button.
- The model's `contextLimit` bounds the map in the recall block and `recallLimit` caps its constraints, risks, preferences and decisions per section. The graph snapshot behind the tree is bounded separately to 200 nodes, 400 edges and 20 inference rows.
- A commit touching paths linked to two components can count toward both. If Git cannot read a repository, the commit count is a lower bound, not an exact zero. The node details identify the affected implementation paths.
- The DSH ToDo panel can overlay the view while tasks are active. It is part of the host UI, not the dashboard.
