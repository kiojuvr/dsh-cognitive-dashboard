# dsh-cognitive-dashboard

A read-only **Cognition** tab for the DSH Web GUI: the objective, the current task, the other open work, the findings, and the recall block a session starts from — in one place, so you can decide whether to continue, change course, or stop.

## Why this exists

Long work outlives a session — often many of them. When you come back, the conversation is a wall of turns: the objective is near the top, the current task is at the bottom, and the work you deferred is nowhere. A new session starts without any of it.

This tab is the human half of `dsh-cognitive-*`; the agent's half is the recall block and the findings ledger. The cognitive layer keeps that material outside the conversation. The agent reads it as a **recall block** at the start of every session; you read the same three things — objective, current position, remaining — in the **Cognition** tab. Both readers get the same material for the same decision. The aim is not a larger memory; it is a next decision that still points at the objective.

## What you get

- Open one tab and see the objective, the current task, and the other open work.
- The objective tree shows how the work decomposes, where the current path runs, how much was invested, and how much is accepted.
- Open findings sit in the same view, in priority order.
- The recall block shows the exact text the model receives: the agent's memory is not a black box.
- Nothing is graded: no score, no threshold, no page verdict.

It pays off when the work spans sessions and someone — you or the agent — would otherwise reconstruct the objective. For a single short task, the graph is overhead; install it when the work is long enough that the next session would start from zero.

## What it is not

- **Not a gate.** It never blocks work or asks for approval.
- **Not a drift detector.** It does not judge whether the work has drifted.
- **Not a score.** Size and rings describe investment and acceptance, not quality.
- **Not a second history.** It shows the structure the agent recorded, not the conversation.

The effect on drift is not measured. What is verified is the mechanism: the record survives the session, reaches the prompt, and is visible here.

## What appears after install

- A **Cognition** tab (認知 in Japanese, 认知 in Chinese) next to Chat and Trajectory.
- Four sections, top to bottom: the objective tree, the current task and the other open work, open findings, the recall block.
- Read-only: it adds no command rows to the conversation and writes no ledger.
- The tree and the recall block come from `@kioju/dsh-cognitive-model`; findings come from the findings ledger, so they still show if the model is not installed.
- Reload the page after installing or updating: the browser half ships with the package.

## Install

In DSH, open **Plugins**, choose **Add plugin**, and enter `@kioju/dsh-cognitive-dashboard`. From a shell the same install is:

```
dsh plugin add @kioju/dsh-cognitive-dashboard
```

The plugin is enabled when it is added; switch it on in **Plugins** if it is not.

The tab draws its tree and recall block from the model plugin. Install that too, or the tab says the model is not in this profile and draws no tree:

```
dsh plugin add @kioju/dsh-cognitive-model
```

`@kioju/dsh-cognitive-findings` is optional; it adds the deferral queue whose open findings this tab lists. `@kioju/dsh-cognitive-core` arrives as an ordinary dependency — no checkout, no build step, nothing to place beside the package.

## First five minutes: "No objective is recorded yet"

A fresh workspace opens on **No objective is recorded yet** (Japanese: 目的がまだ記録されていません). This is the designed empty state, not a failure. The dashboard does not infer an objective from the conversation; it shows what the agent recorded in the graph. Until the first `graph_write`, there is nothing to draw.

Record the objective once, in a normal session. The objective is your intent, so state it yourself:

> The goal of this work is `<one sentence>`. Record it in the cognitive graph as `objective`, the current work as `task/current`, and the other open work as `task/<key>`. Use this message as the evidence for the objective, and read the repository only to fill in components and tasks. Tell me in one line what you wrote.

The cognitive layer does not create or modify `package.json`: the model stores the graph in `.dsh/cognitive-model/graph.json`, and this tab only reads it. The agent can read files to fill in the structure, but the objective comes from you.

The agent has the `graph_write` tool and a standing instruction for this. After it writes, the tab fills in — the projection refreshes on tool results, turn ends, user messages, and command completions; there is no refresh button.

If it stays empty:

1. Is the plugin enabled in **Plugins**, and is the tab there after a page reload?
2. Is the session's workspace the repository you meant? The graph is per project root — the nearest ancestor with `.git`.
3. Did the agent actually write? Ask it to show the result of `graph_query`, or to repeat the write with the files it read.
4. Is `@kioju/dsh-cognitive-model` installed? Without it the tab says the model is not in this profile.

The first objective is the only manual bootstrap. After that, the recall block carries the objective into each new session, and the agent updates `task/current` as the work moves.

## Reading the screen

### Order

1. **Objective** — the root objective's sentence, its task and finding counts, its acceptance, and the tree.
2. **Current task** — the task the graph marks as current, the node it serves, and when it was updated; below it, **Other open work**.
3. **Open findings** — priority order, kind, age, status, staleness.
4. **Recall block** — the text the model received, verbatim.

### The objective tree

The root is the objective. Components sit in rings by depth; solid lines are `serves`, dashed lines are `requires`. The labels are node keys (`objective`, `search`, …), cut to fit; select a node to see its full name and description.

- **Size is investment, not importance.** It counts the tasks and findings linked to the node and its descendants, plus commits touching its implementation paths, relative to the largest branch. A finished branch keeps the size of what it took.
- **The ring is acceptance.** It is the share of recorded milestones that are done, summed over the branch. No milestones, no ring. Neither is a score.
- **The current path** — the chain from the objective to the current task — is highlighted and repeated as a breadcrumb.
- **Select a node** for its tasks, open findings, implementation paths, docs, investment breakdown, milestones, and last activity. Search, zoom, pan, and collapse are available; arrow keys move, Enter or Space opens, Escape closes.

Tasks are not drawn as tree nodes. They are counted in the size, listed under the current task and the other open work, and shown in the selected node's panel.

### Current task and the other open work

The current task is `task/current`; if none is marked, the newest task is shown. The line under it says which node it serves, or `unlinked`. **"not recorded" does not mean nothing remains** — it means nothing was recorded. The same holds for the other open work: the list shows the tasks that were written, not every task that exists.

### Open findings

This section reads the findings ledger directly. It shows the open count and the findings by priority, with kind, age, status, and a stale marker. A missing ledger, an unreadable ledger, and a readable ledger with no open findings are three different states, and the section says which one it is.

### Recall block

This is the exact text the model receives at the start of a turn, preserving line breaks and indentation. It is the same projection the tree draws, compressed: objective, path, now, remaining, map, constraints, decisions, linked facts, experience rules, and — when a recorded error asks for it — one non-binding whole-picture check. The check itself (`BIRDSEYE`) is not included, and viewing the block does not mark it as seen.

Read it to check what the agent was told, not to grade it.

### Labels

**reported** (申告), **observed** (観測), and **verified** (検証済み) say *how* an item was recorded: the human's words, a file or url that was read, or a command that was run. They are not a claim that the content was re-checked. A detail that matters should be re-checked.

### The three empty states

| What you see | What it means |
|---|---|
| `not recorded` / 未記録 | Nothing was written. Normal on a new workspace. |
| `could not read` / 読み取れません | A ledger exists but could not be parsed. The rest of the view still works. |
| `The model plugin is not in this profile` | The dashboard is installed without `@kioju/dsh-cognitive-model`. Findings still show. |

## Design stance

The layout follows the Digital Agency dashboard design guide: the objective tree is the whole picture and comes first, then the current task and the other open work as context, then the open findings, then the recall block as the material behind them. There is no page verdict, no score, and no threshold. Absence is shown as `not recorded` or `could not read`, never as success. Status is carried by a glyph and a word as well as a colour.

The layout and accessibility choices are in [docs/DESIGN.md](docs/DESIGN.md); behaviour and limitations in [docs/DETAIL.md](docs/DETAIL.md).

## The family

`dsh-cognitive-*` keeps the material for the next decision outside the conversation: the objective and how the work decomposes, what has been decided and constrained, what is still open, and what was noticed but deferred.

| Package | Role | If it is missing |
|---|---|---|
| `@kioju/dsh-cognitive-model` | The graph and the recall block | No tree and no recall block; findings still show |
| `@kioju/dsh-cognitive-dashboard` | This tab | The agent still records; you have no view |
| `@kioju/dsh-cognitive-findings` | The deferral queue | Out-of-scope discoveries have nowhere durable to go |
| `@kioju/dsh-cognitive-core` | Shared library | Installed automatically |

Each plugin is independent. Install model + dashboard for the full view; add findings for the deferral loop.

## Development

`npm install` also installs the test dependencies (react, react-dom, jsdom). `npm test` drives the host projection against a graph snapshot and renders the client in jsdom: the radial tree, the node panel, keyboard navigation, search/zoom/collapse, the empty states, the recall block, and the missing-model state.

## License

MIT.
