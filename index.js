/**
 * Host half of dsh-cognitive-dashboard.
 *
 * The dashboard's data is workspace-level. The objective tree is drawn from the
 * model graph, read through the `cognitiveGraph` service that
 * `dsh-cognitive-model` publishes — the same projection the browser reads, so
 * supersession and conflict detection have one implementation. The findings
 * ledger is read directly; there is no second tree source (D98). The recall
 * block — the text a session starts from — is read through the same service
 * (D108): the card shows the block the input received, not a second drawing of
 * the material behind it.
 *
 * It is served to the browser through one session projection (`dashboard`)
 * instead of a command, so opening the dashboard does not add command rows to
 * the conversation log.
 *
 * Read-only. The projection never writes a ledger; it reads what the other
 * plugins maintain.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { findProjectRoot } from 'dsh-cognitive-core'

export const name = 'cognitive-dashboard'
export const inject = ['sessionProjections']

const FINDINGS_FILE = '.dsh/cognitive-findings/findings.json'
const STALE_DAYS = 14
const DAY_MS = 86_400_000
const ACTIVE_STATUSES = new Set(['open', 'triaged', 'in_progress'])
const RELEVANT_EVENTS = new Set(['tool/result', 'turn/end', 'user/message', 'command/done'])
const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 }

/**
 * The projection registry validates the state and the wire view through
 * `schema.parse`. Both are produced by this module, so the schema is a
 * pass-through rather than a second source of truth.
 */
const passthrough = { parse: (value) => value }

/**
 * Read a JSON document and report whether it was missing, readable, or
 * unreadable. A missing ledger and a corrupt one must not collapse into the
 * same empty value: the dashboard shows "not recorded" for one and "could not
 * read" for the other, and neither is a success (D79 / F4).
 */
function readJson(file, fallback, isValid) {
  if (!existsSync(file)) return { state: 'missing', value: fallback }
  try {
    const value = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof isValid === 'function' && !isValid(value)) {
      return { state: 'error', value: fallback }
    }
    return { state: 'ready', value }
  } catch {
    return { state: 'error', value: fallback }
  }
}

const isFindings = (value) =>
  value !== null &&
  typeof value === 'object' &&
  Array.isArray(value.findings) &&
  (value.decisions === undefined || Array.isArray(value.decisions))

function countBy(items, keyOf) {
  const counts = {}
  for (const item of items) {
    const key = keyOf(item)
    if (key === undefined || key === null || key === '') continue
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function ageDays(createdAt) {
  const at = Date.parse(createdAt)
  return Number.isFinite(at) ? Math.max(0, Math.floor((Date.now() - at) / DAY_MS)) : 0
}

/**
 * Commit counts per node (D89).
 *
 * A node's `paths` point at files or directories inside one of the repositories
 * beside the workspace, so one `git log` per repository is enough. The result is
 * cached by HEAD: a projection runs on every tool result, and re-running git each
 * time would make the dashboard the most expensive part of the session (D87).
 * If git cannot be run, the count is simply absent; it is never guessed.
 */
const repoCache = new Map()

function readGitHead(repo) {
  try {
    const head = readFileSync(path.join(repo, '.git', 'HEAD'), 'utf8').trim()
    if (!head.startsWith('ref: ')) return head
    try {
      return readFileSync(path.join(repo, '.git', head.slice(5)), 'utf8').trim()
    } catch {
      return head
    }
  } catch {
    return ''
  }
}

function gitCommits(repo) {
  const result = spawnSync(
    'git',
    ['-C', repo, 'log', '--format=%H %ct', '--name-only', '--no-renames'],
    { encoding: 'utf8', timeout: 5000, windowsHide: true },
  )
  if (result.error !== undefined || result.status !== 0 || typeof result.stdout !== 'string') {
    return null
  }
  const commits = []
  let current = null
  for (const line of result.stdout.split('\n')) {
    if (line === '') continue
    const head = /^([0-9a-f]{7,40}) (\d+)$/.exec(line)
    if (head !== null) {
      current = { hash: head[1], at: Number(head[2]), files: [] }
      commits.push(current)
    } else if (current !== null) {
      current.files.push(line)
    }
  }
  return commits
}

function commitsForRepo(repo) {
  const head = readGitHead(repo)
  const cached = repoCache.get(repo)
  if (cached !== undefined && head !== '' && cached.head === head) return cached.commits
  const commits = gitCommits(repo)
  if (head !== '') repoCache.set(repo, { head, commits })
  return commits
}

/**
 * The repository and repo-relative file a node link names, or undefined when
 * the path does not exist. Links are resolved against the workspace first and
 * its parent second: sibling repositories are named by their directory
 * (`dsh-cognitive-model/src/graph/**`), the workspace's own files relative to
 * it (`index.js`). A glob is reduced to its prefix directory.
 */
function repoFileOf(root, link) {
  const cleaned = link.replace(/\/\*\*$/, '').replace(/\/\*$/, '').replace(/\/$/, '')
  if (cleaned === '') return undefined
  for (const base of [root, path.dirname(root)]) {
    const absolute = path.join(base, cleaned)
    if (!existsSync(absolute)) continue
    let dir = absolute
    let repo
    for (let depth = 0; depth < 8; depth += 1) {
      if (existsSync(path.join(dir, '.git'))) {
        repo = dir
        break
      }
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
    if (repo === undefined) return undefined
    return { repo, file: path.relative(repo, absolute).replaceAll('\\', '/') }
  }
  return undefined
}

/** Commits whose changed files fall under one resolved link, or undefined. */
function commitsMatching(target) {
  const commits = commitsForRepo(target.repo)
  if (commits === null) return undefined
  return commits.filter(
    (commit) =>
      target.file === '' ||
      commit.files.some((file) => file === target.file || file.startsWith(`${target.file}/`)),
  )
}

/**
 * The model graph, read through the service the model plugin publishes.
 *
 * The dashboard does not import the model package and does not project the
 * event log itself: supersession, invalidation and conflict detection have one
 * implementation, and this view reads its result. `unavailable` is a distinct
 * state from `missing` — a profile without the model plugin and a workspace
 * with no graph are different facts (F4).
 */
function graphOf(modelOf, root) {
  if (typeof modelOf !== 'function') return { state: 'unavailable' }
  let service
  try {
    service = modelOf()
  } catch {
    return { state: 'unavailable' }
  }
  if (service === null || service === undefined || typeof service.snapshot !== 'function') {
    return { state: 'unavailable' }
  }
  try {
    const snapshot = service.snapshot(root)
    if (snapshot !== null && typeof snapshot === 'object' && typeof snapshot.state === 'string') {
      return snapshot
    }
    return { state: 'error' }
  } catch {
    return { state: 'error' }
  }
}

function pushTo(map, key, value) {
  const bucket = map.get(key)
  if (bucket === undefined) map.set(key, [value])
  else bucket.push(value)
}

/**
 * The recall block, read through the same service.
 *
 * The card shows the block a session starts from rather than a second drawing
 * of the graph (D108). The model owns the budget, the ordering and the
 * per-session check, so this reads its result instead of assembling one: a
 * second assembly could disagree with the text the input actually got.
 *
 * `unavailable` is the profile without the model plugin (or a model too old to
 * publish the block); `missing` and `error` come from the model, which keeps
 * "nothing recorded" and "could not read" apart (F4).
 */
function recallOf(modelOf, root) {
  if (typeof modelOf !== 'function') return { state: 'unavailable' }
  let service
  try {
    service = modelOf()
  } catch {
    return { state: 'unavailable' }
  }
  if (service === null || service === undefined || typeof service.recall !== 'function') {
    return { state: 'unavailable' }
  }
  try {
    const recall = service.recall(root)
    if (recall !== null && typeof recall === 'object' && typeof recall.state === 'string') {
      return recall
    }
    return { state: 'error' }
  } catch {
    return { state: 'error' }
  }
}

function newestNodeFirst(a, b) {
  const aAt = typeof a.updatedAt === 'string' ? a.updatedAt : ''
  const bAt = typeof b.updatedAt === 'string' ? b.updatedAt : ''
  if (aAt !== bAt) return aAt < bAt ? 1 : -1
  return a.id.localeCompare(b.id)
}

/**
 * The tree drawn from the graph (D97).
 *
 * One drawing with one vocabulary of observations: the structure and the
 * acceptance come from the graph's `serves` chain and milestones, while
 * investment counts what the workspace can see — tasks and findings linked to a
 * node, commits touching its paths, and its docs.
 *
 * A task node is one work item: rewriting `task/current` supersedes the node, it
 * does not add one.
 */
function graphTreeView(graph, findings, root) {
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : []
  const edges = Array.isArray(graph.edges) ? graph.edges : []
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const serves = new Map()
  const requires = new Map()
  const verifies = new Map()
  for (const edge of edges) {
    if (typeof edge.from !== 'string' || typeof edge.to !== 'string') continue
    if (edge.type === 'serves') serves.set(edge.from, edge.to)
    else if (edge.type === 'requires') pushTo(requires, edge.from, edge.to)
    else if (edge.type === 'verifies') pushTo(verifies, edge.from, edge.to)
  }

  const pathOf = (id) => {
    const path = []
    const seen = new Set()
    let current = id
    while (typeof current === 'string' && !seen.has(current)) {
      seen.add(current)
      path.push(current)
      current = serves.get(current)
    }
    return path.reverse()
  }

  const treeNodes = nodes
    .filter((node) => node.type === 'objective' || node.type === 'component')
    .sort((left, right) => left.id.localeCompare(right.id))
  const treeIds = new Set(treeNodes.map((node) => node.id))
  const tasks = nodes.filter((node) => node.type === 'task').sort(newestNodeFirst)

  // Active tasks that serve a node, directly or through a means node: a task
  // counts for its own node and for every objective above it (D88).
  const taskCounts = new Map()
  for (const task of tasks) {
    for (const step of pathOf(task.id)) {
      taskCounts.set(step, (taskCounts.get(step) ?? 0) + 1)
    }
  }

  const currentTaskNode = byId.get('task/current') ?? tasks[0]
  const currentPath =
    currentTaskNode === undefined
      ? byId.has('objective')
        ? ['objective']
        : []
      : pathOf(currentTaskNode.id)
  const currentSet = new Set(currentPath)
  const keyOf = (value) => String(value ?? '').trim().toLowerCase()

  const blank = () => ({
    taskOpen: 0,
    taskAll: 0,
    findingOpen: 0,
    findingAll: 0,
    docs: 0,
    commits: 0,
    // Repositories git could not answer for. The count above is then a lower
    // bound, not a zero (F1 / D105).
    commitFailures: 0,
    milestoneDone: 0,
    milestoneTotal: 0,
    lastActivity: null,
  })
  const direct = new Map()
  const slot = (id) => {
    let entry = direct.get(id)
    if (entry === undefined) {
      entry = blank()
      direct.set(id, entry)
    }
    return entry
  }
  const bumpActivity = (entry, at) => {
    if (typeof at === 'string' && at !== '' && (entry.lastActivity === null || at > entry.lastActivity)) {
      entry.lastActivity = at
    }
  }

  for (const task of tasks) {
    const parent = serves.get(task.id)
    if (parent === undefined || !treeIds.has(parent)) continue
    const entry = slot(parent)
    entry.taskOpen += 1
    entry.taskAll += 1
    bumpActivity(entry, task.updatedAt)
  }
  for (const finding of findings) {
    if (typeof finding.node !== 'string') continue
    const id = keyOf(finding.node)
    if (!treeIds.has(id)) continue
    const entry = slot(id)
    entry.findingAll += 1
    if (ACTIVE_STATUSES.has(finding.status)) entry.findingOpen += 1
    bumpActivity(entry, finding.updatedAt ?? finding.createdAt)
  }

  // Own acceptance, docs and commits per node; a missing link is an observation
  // too. Commits are counted from `paths`, not `docs` (D89). A repository git
  // cannot read is not a zero: the count is a lower bound, `commitState` says so
  // and `commitErrors` names the links, so "could not read" and "no commits"
  // stay apart (F1 / D105).
  const stale = new Map()
  const commitErrors = new Map()
  for (const node of treeNodes) {
    const entry = slot(node.id)
    const milestones = Array.isArray(node.milestones) ? node.milestones : []
    entry.milestoneDone += milestones.filter((milestone) => milestone.done === true).length
    entry.milestoneTotal += milestones.length
    const docs = Array.isArray(node.docs) ? node.docs : []
    const paths = Array.isArray(node.paths) ? node.paths : []
    entry.docs += docs.length
    bumpActivity(entry, node.updatedAt)
    const missing = []
    const unreadable = []
    const seenCommits = new Set()
    let lastCommit = null
    for (const link of paths) {
      const target = repoFileOf(root, link)
      if (target === undefined) {
        missing.push(link)
        continue
      }
      const hits = commitsMatching(target)
      if (hits === undefined) {
        unreadable.push(link)
        continue
      }
      for (const commit of hits) {
        if (seenCommits.has(commit.hash)) continue
        seenCommits.add(commit.hash)
        if (lastCommit === null || commit.at > lastCommit) lastCommit = commit.at
      }
    }
    entry.commits += seenCommits.size
    entry.commitFailures += unreadable.length
    if (unreadable.length > 0) commitErrors.set(node.id, unreadable)
    if (lastCommit !== null) bumpActivity(entry, new Date(lastCommit * 1000).toISOString())
    for (const link of docs) {
      if (repoFileOf(root, link) === undefined) missing.push(link)
    }
    if (missing.length > 0) stale.set(node.id, missing)
  }

  // Sum each node's own numbers over its branch, so an objective shows what its
  // means carry (D89).
  const total = new Map()
  for (const [id, entry] of direct) {
    for (const step of pathOf(id)) {
      if (!treeIds.has(step)) continue
      let sum = total.get(step)
      if (sum === undefined) {
        sum = blank()
        total.set(step, sum)
      }
      sum.taskOpen += entry.taskOpen
      sum.taskAll += entry.taskAll
      sum.findingOpen += entry.findingOpen
      sum.findingAll += entry.findingAll
      sum.docs += entry.docs
      sum.commits += entry.commits
      sum.commitFailures += entry.commitFailures
      sum.milestoneDone += entry.milestoneDone
      sum.milestoneTotal += entry.milestoneTotal
      if (entry.lastActivity !== null && (sum.lastActivity === null || entry.lastActivity > sum.lastActivity)) {
        sum.lastActivity = entry.lastActivity
      }
    }
  }

  const rows = treeNodes.map((node) => {
    const sum = total.get(node.id) ?? blank()
    const parent = serves.get(node.id)
    const milestones = Array.isArray(node.milestones) ? node.milestones : []
    return {
      id: node.id,
      subject: node.id,
      kind: node.type,
      // The label names the node; the value says what it is. The drawing uses
      // the key, so the value stays in the panel and the accessible name.
      value: node.label,
      ...(typeof node.value === 'string' && node.value !== '' ? { description: node.value } : {}),
      depth: pathOf(node.id).length - 1,
      parent: parent !== undefined && treeIds.has(parent) ? parent : null,
      confidence: node.confidence,
      paths: Array.isArray(node.paths) ? node.paths : [],
      docs: Array.isArray(node.docs) ? node.docs : [],
      serves: parent ?? null,
      requires: requires.get(node.id) ?? [],
      verifies: verifies.get(node.id) ?? [],
      tasks: sum.taskOpen,
      findings: sum.findingOpen,
      investment: {
        tasks: sum.taskAll,
        findings: sum.findingAll,
        commits: sum.commits,
        docs: sum.docs,
        // Exact only when every repository in the branch answered; otherwise
        // `commits` is a lower bound and the view says so (D105).
        commitState: sum.commitFailures > 0 ? 'unavailable' : 'ready',
        total: sum.taskAll + sum.findingAll + sum.commits,
      },
      acceptance: { done: sum.milestoneDone, total: sum.milestoneTotal },
      milestones: milestones.map((milestone) => ({
        text: milestone.text,
        done: milestone.done === true,
        ...(milestone.at === undefined ? {} : { at: milestone.at }),
      })),
      stale: stale.get(node.id) ?? [],
      // This node's own links whose history could not be read; the branch-wide
      // lower bound is `investment.commitState`.
      commitErrors: commitErrors.get(node.id) ?? [],
      lastActivity: sum.lastActivity,
      current: currentSet.has(node.id),
    }
  })

  const currentTask = currentTaskNode === undefined ? null : graphTaskView(currentTaskNode, serves)
  const remaining = tasks
    .filter((task) => task !== currentTaskNode)
    .map((task) => graphTaskView(task, serves))
  const unlinked = tasks.filter((task) => serves.get(task.id) === undefined).length
  return { nodes: rows, currentTask, remaining, unlinkedTasks: unlinked }
}

function graphTaskView(node, serves) {
  return {
    id: node.id,
    value: node.label,
    ...(typeof node.value === 'string' && node.value !== '' ? { description: node.value } : {}),
    confidence: node.confidence,
    serves: serves.get(node.id) ?? null,
    createdAt: node.updatedAt,
    updatedAt: node.updatedAt,
  }
}

function snapshot(root, modelOf) {
  const generatedAt = new Date().toISOString()
  if (root === undefined) {
    return {
      generatedAt,
      workspace: null,
      readState: { findings: 'missing', graph: 'unavailable', tree: 'none' },
      objective: { root: null, nodes: [], currentPath: [] },
      currentTask: null,
      remaining: [],
      unlinkedTasks: 0,
      findings: { total: 0, byStatus: {}, byPriority: {}, open: [], stale: 0, decisions: 0 },
      recall: { state: 'missing' },
    }
  }

  const findingsRead = readJson(
    path.join(root, FINDINGS_FILE),
    { findings: [], decisions: [] },
    isFindings,
  )
  const findingsDoc =
    findingsRead.state === 'ready' ? findingsRead.value : { findings: [], decisions: [] }
  const findingList = Array.isArray(findingsDoc.findings) ? findingsDoc.findings : []
  const activeFindings = findingList.filter((finding) => ACTIVE_STATUSES.has(finding.status))

  // The tree has one source (D98): the graph the model plugin publishes. A
  // profile without the model plugin draws no tree and says so; it does not
  // read a second ledger.
  const graph = graphOf(modelOf, root)
  const fromGraph = graph.state === 'ready'
  const tree = fromGraph
    ? graphTreeView(graph, findingList, root)
    : { nodes: [], currentTask: null, remaining: [], unlinkedTasks: 0 }
  const nodes = tree.nodes
  // The block a session starts from, read in the same pass as the tree (D108).
  // The model's read is cached, so this costs no second read of the log.
  const recall = recallOf(modelOf, root)
  const currentPath = nodes.filter((node) => node.current).map((node) => node.subject)
  const rootNode = nodes.find((node) => node.kind === 'objective' && node.depth === 0) ?? null

  const open = activeFindings
    .map((finding) => ({
      id: finding.id,
      title: finding.title,
      status: finding.status,
      priority: finding.priority,
      kind: finding.kind,
      node: finding.node ?? null,
      ageDays: ageDays(finding.updatedAt ?? finding.createdAt),
    }))
    .sort((left, right) => {
      const byPriority = (PRIORITY_ORDER[left.priority] ?? 9) - (PRIORITY_ORDER[right.priority] ?? 9)
      return byPriority !== 0 ? byPriority : right.ageDays - left.ageDays
    })

  return {
    generatedAt,
    workspace: root,
    readState: {
      findings: findingsRead.state,
      graph: graph.state,
      tree: fromGraph ? 'graph' : 'none',
    },
    objective: { root: rootNode, nodes, currentPath },
    currentTask: tree.currentTask,
    remaining: tree.remaining,
    unlinkedTasks: tree.unlinkedTasks,
    findings: {
      total: findingList.length,
      byStatus: countBy(findingList, (finding) => finding.status),
      byPriority: countBy(activeFindings, (finding) => finding.priority),
      open,
      stale: activeFindings.filter(
        (finding) => ageDays(finding.updatedAt ?? finding.createdAt) > STALE_DAYS,
      ).length,
      decisions: Array.isArray(findingsDoc.decisions) ? findingsDoc.decisions.length : 0,
    },
    recall,
  }
}

export async function apply(ctx) {
  // The model plugin may be composed after this one (or not at all), so the
  // service is looked up per read, not captured at apply time.
  const modelOf = () => (typeof ctx.get === 'function' ? ctx.get('cognitiveGraph') : undefined)
  const definition = {
    key: 'dashboard',
    stateVersion: 4,
    stateSchema: passthrough,
    init: (header) => ({
      root:
        typeof header?.cwd === 'string' && header.cwd !== ''
          ? findProjectRoot(header.cwd)
          : undefined,
      version: 0,
    }),
    // The ledgers change on tool results and turn boundaries. Re-read the files
    // on the next relevant event instead of polling.
    apply: (state, event) =>
      RELEVANT_EVENTS.has(event?.type) ? { ...state, version: state.version + 1 } : state,
    wire: {
      viewSchema: passthrough,
      view: (state) => snapshot(state.root, modelOf),
    },
  }
  await ctx.sessionProjections.register(definition)
}
