# Cognitive dashboard design

The **Cognition** tab appears in the conversation view of the DSH Web GUI.
The layout and information order draw on the *Practical Guide to Dashboard
Design* from Japan's Digital Agency. For usage and limitations, see
[Behavior and limitations](DETAIL.md).

## Purpose

When users open a session or reach a stopping point, they can see the overall
objective, the current task, and other unfinished work in one place. That
helps them decide whether to continue, change course, or pause. The dashboard
is read-only: it does not judge the work or block progress.

## Information order

| Order | Section | Purpose |
|---|---|---|
| 1 | Objective tree | Shows how components support objectives and which branch contains the current work. |
| 2 | Current task and other open work | Shows the tasks relevant to the next decision. If text is truncated, the tooltip provides the full text. |
| 3 | Open findings | Lists findings by priority and shows their kind, age, and staleness. |
| 4 | Recall block | Shows the text the model plugin supplies to the session, preserving indentation and line breaks. |

The tab label is the visible title. A visually hidden `h1` preserves the
heading for screen readers without repeating it on the page. The detail panel
sits beside the tree and wraps below it when space is limited. Bottom padding
keeps content clear of the floating composer.

## Reading the objective tree

- **Position.** The root is at the centre, with nodes arranged in concentric
  rings by depth. Solid lines represent `serves` and dashed lines represent
  `requires`. The current path is marked by fill, outlines, thicker edges, and
  a breadcrumb, so it does not rely on colour alone.
- **Node size (investment).** Size reflects the combined count of linked tasks,
  findings, and commits touching implementation paths for the node and its
  descendants, relative to the largest branch. Documentation links appear in
  the details but do not contribute to the commit count.
- **Ring (acceptance).** The ring shows the share of recorded milestones that
  are complete. If no milestones are recorded, there is no ring. Neither node
  size nor the ring represents a score or a pass/fail threshold.
- **Navigation.** Users can search, zoom, pan, and collapse branches. The tree
  exposes `tree` and `treeitem` roles to assistive technology. Arrow keys move
  between nodes, Enter or Space opens node details, and Escape closes them.

## Data sources and missing information

The host reads the tree and recall block from `@kioju/dsh-cognitive-model` through
its `cognitiveGraph` service and reads the workspace findings ledger directly.
The web client renders the host's `dashboard` projection. The model plugin
owns event-log projection and recall assembly.

The view distinguishes unrecorded data, unreadable data, and an unavailable
model plugin. An unrecorded task list does not imply that no work remains.
If some Git history cannot be read, the dashboard reports the available count
as a lower bound and identifies the affected implementation paths.

The recall block wraps long lines without changing the text. It does not
include the bird's-eye check (`BIRDSEYE`) that can be added to a session's prompt
once per error. Viewing the block does not mark that check as seen.

## Colour and accessibility

The dashboard uses the host's light and dark themes. Symbols and text convey
status alongside colour. Tooltips and screen-reader text explain confidence
labels. There is no overall verdict or colour-coded score.

## Design history

The objective tree moved from a list to a radial layout so users could see the
hierarchy, current path, investment, and acceptance together. For recall, the
design favours showing the text supplied to the session rather than drawing a
separate view of the underlying data.
