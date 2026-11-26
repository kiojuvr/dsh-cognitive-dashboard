/**
 * Host projection test (D97 / D98).
 *
 * The view's tree is drawn from the model graph only: the memory ledger is no
 * longer a second source (D98). This test drives the Host half the way the
 * projection registry does: register the definition with a fake registry, then
 * read `wire.view`.
 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { apply } from '../index.js'

function workspace() {
  const dir = mkdtempSync(path.join(tmpdir(), 'cd-host-'))
  mkdirSync(path.join(dir, '.git'))
  return dir
}

function fakeHost(service) {
  const host = { definition: null }
  host.ctx = {
    sessionProjections: {
      register(definition) {
        host.definition = definition
        return Promise.resolve({ dispose: async () => {} })
      },
    },
    get(name) {
      return name === 'cognitiveGraph' ? service : undefined
    },
  }
  return host
}

const AT = '2026-01-01T00:00:00.000Z'

function graphNode(id, type, label, extra = {}) {
  return {
    id,
    type,
    label,
    paths: [],
    docs: [],
    acceptance: { done: 0, total: 0 },
    milestones: [],
    confidence: 'observed',
    updatedAt: AT,
    ...extra,
  }
}

function graphSnapshot(cwd, nodes, edges) {
  return {
    state: 'ready',
    generatedAt: AT,
    workspace: cwd,
    events: nodes.length + edges.length,
    counts: {
      nodes: nodes.length,
      edges: edges.length,
      byType: nodes.reduce((counts, node) => {
        counts[node.type] = (counts[node.type] ?? 0) + 1
        return counts
      }, {}),
      byEdge: edges.reduce((counts, edge) => {
        counts[edge.type] = (counts[edge.type] ?? 0) + 1
        return counts
      }, {}),
    },
    nodes,
    edges,
    conflicts: [],
    inference: [],
    truncated: { nodes: false, edges: false, inference: false },
  }
}

function findingsFile(cwd, findings) {
  const dir = path.join(cwd, '.dsh', 'cognitive-findings')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'findings.json'), JSON.stringify({ findings, decisions: [] }))
}

function memoryFile(cwd, facts) {
  const dir = path.join(cwd, '.dsh', 'cognitive-memory')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'memory.json'), JSON.stringify({ facts, stats: {} }))
}

async function viewOf(service, cwd) {
  const host = fakeHost(service)
  await apply(host.ctx)
  assert.ok(host.definition, 'the dashboard projection is registered')
  return host.definition.wire.view({ root: cwd, version: 0 })
}

const GRAPH_NODES = [
  graphNode('objective', 'objective', 'Port', {
    value: 'the goal',
    acceptance: { done: 1, total: 2 },
    milestones: [{ text: 'graph', done: true }, { text: 'query', done: false }],
    confidence: 'verified',
  }),
  graphNode('objective/model', 'objective', 'Model', {
    acceptance: { done: 1, total: 1 },
    milestones: [{ text: 'graph', done: true }],
  }),
  graphNode('component/graph', 'component', 'Graph', {
    acceptance: { done: 0, total: 1 },
    milestones: [{ text: 'recall', done: false }],
  }),
  graphNode('task/current', 'task', 'Build', {
    value: 'build the graph',
    confidence: 'verified',
  }),
  graphNode('task/other', 'task', 'Next', { value: 'draw the tree' }),
]

const GRAPH_EDGES = [
  { from: 'objective/model', type: 'serves', to: 'objective' },
  { from: 'component/graph', type: 'serves', to: 'objective/model' },
  { from: 'task/current', type: 'serves', to: 'component/graph' },
  { from: 'task/other', type: 'serves', to: 'objective/model' },
]

test('the tree is drawn from the graph when the model service is present', async () => {
  const cwd = workspace()
  findingsFile(cwd, [
    {
      id: 'f1',
      title: 'a bug',
      status: 'open',
      priority: 'P2',
      kind: 'bug',
      node: 'component/graph',
      createdAt: AT,
      updatedAt: AT,
    },
  ])
  const view = await viewOf({ snapshot: () => graphSnapshot(cwd, GRAPH_NODES, GRAPH_EDGES) }, cwd)

  assert.equal(view.readState.tree, 'graph')
  assert.equal(view.readState.graph, 'ready')
  assert.equal(view.objective.root.subject, 'objective')

  const bySubject = new Map(view.objective.nodes.map((node) => [node.subject, node]))
  assert.deepEqual([...bySubject.keys()].sort(), ['component/graph', 'objective', 'objective/model'])
  assert.equal(bySubject.get('objective/model').depth, 1)
  assert.equal(bySubject.get('component/graph').depth, 2)
  assert.equal(bySubject.get('component/graph').parent, 'objective/model')

  // Branch sums: the objective carries what its means carry (D89).
  assert.deepEqual(bySubject.get('objective').acceptance, { done: 2, total: 4 })
  assert.deepEqual(bySubject.get('objective/model').acceptance, { done: 1, total: 2 })
  assert.deepEqual(bySubject.get('component/graph').acceptance, { done: 0, total: 1 })
  assert.equal(bySubject.get('objective').tasks, 2)
  assert.equal(bySubject.get('component/graph').tasks, 1)
  assert.equal(bySubject.get('component/graph').findings, 1)
  assert.equal(bySubject.get('component/graph').milestones[0].text, 'recall')
  assert.equal(bySubject.get('objective').current, true)
  assert.equal(bySubject.get('component/graph').current, true)

  // The label names the node; the graph's sentence stays in the detail.
  assert.equal(bySubject.get('objective').value, 'Port')
  assert.equal(bySubject.get('objective').description, 'the goal')

  assert.equal(view.currentTask.id, 'task/current')
  assert.equal(view.currentTask.value, 'Build')
  assert.equal(view.currentTask.description, 'build the graph')
  assert.equal(view.currentTask.serves, 'component/graph')
  assert.deepEqual(view.remaining.map((task) => task.id), ['task/other'])
  assert.equal(view.unlinkedTasks, 0)
})

test('a memory ledger alone no longer draws a tree (D98)', async () => {
  const cwd = workspace()
  memoryFile(cwd, [
    {
      id: 'f1',
      kind: 'decision',
      subject: 'objective',
      value: 'port the graph',
      scope: 'repo',
      status: 'active',
      confidence: 'observed',
      source: 'tool_output',
      evidence: [{ kind: 'file', ref: 'x' }],
      createdAt: AT,
      updatedAt: AT,
    },
    {
      id: 'f2',
      kind: 'task_state',
      subject: 'current task',
      value: 'write the tree',
      scope: 'repo',
      status: 'active',
      confidence: 'verified',
      source: 'verified_command',
      serves: 'objective',
      evidence: [{ kind: 'command', ref: 'x' }],
      createdAt: AT,
      updatedAt: AT,
    },
  ])
  const view = await viewOf(undefined, cwd)

  // The ledger is written but ignored: the graph is the only tree source.
  assert.equal(view.readState.tree, 'none')
  assert.equal(view.readState.graph, 'unavailable')
  assert.equal(view.objective.root, null)
  assert.deepEqual(view.objective.nodes, [])
  assert.equal(view.currentTask, null)
  assert.deepEqual(view.remaining, [])
})

test('a missing graph draws no tree and says so', async () => {
  const cwd = workspace()
  memoryFile(cwd, [])
  const view = await viewOf({ snapshot: () => ({ state: 'missing', nodes: [], edges: [] }) }, cwd)

  assert.equal(view.readState.tree, 'none')
  assert.equal(view.readState.graph, 'missing')
  assert.equal(view.objective.root, null)
})

test('a graph that cannot be read is reported as an error, not an empty tree', async () => {
  const cwd = workspace()
  const view = await viewOf(
    {
      snapshot: () => {
        throw new Error('broken projection')
      },
    },
    cwd,
  )

  assert.equal(view.readState.tree, 'none')
  assert.equal(view.readState.graph, 'error')
  assert.equal(view.objective.root, null)
})

test('a repository git cannot read is a lower bound, not 0 commits (D105)', async () => {
  const cwd = workspace()
  // A `.git` git cannot use: the spawn fails, so the history is unreadable.
  mkdirSync(path.join(cwd, 'broken', '.git'), { recursive: true })
  const nodes = [
    graphNode('objective', 'objective', 'Goal'),
    graphNode('component/broken', 'component', 'Broken', { paths: ['broken'] }),
    graphNode('component/plain', 'component', 'Plain'),
  ]
  const edges = [
    { from: 'component/broken', type: 'serves', to: 'objective' },
    { from: 'component/plain', type: 'serves', to: 'objective' },
  ]
  const view = await viewOf({ snapshot: () => graphSnapshot(cwd, nodes, edges) }, cwd)
  const bySubject = new Map(view.objective.nodes.map((node) => [node.subject, node]))

  // The count stays 0 because nothing was read, but it is a lower bound and the
  // link that failed is named, so it cannot be mistaken for a real 0.
  assert.equal(bySubject.get('component/broken').investment.commits, 0)
  assert.equal(bySubject.get('component/broken').investment.commitState, 'unavailable')
  assert.deepEqual(bySubject.get('component/broken').commitErrors, ['broken'])

  // A node with no paths has an exact 0; the branch carries the lower bound.
  assert.equal(bySubject.get('component/plain').investment.commitState, 'ready')
  assert.deepEqual(bySubject.get('component/plain').commitErrors, [])
  assert.equal(bySubject.get('objective').investment.commitState, 'unavailable')
})

// The recall block is the card's content (D108): the Host carries the model's
// text through the projection, and the four absences stay apart.
const RECALL_TEXT =
  'Working memory for this workspace, projected from the event log — build on it instead of re-deriving it:\n' +
  'Objective: Port [tasks: 2]\n' +
  'Path: objective → component/graph\n' +
  'Now: Build the graph'

test('the recall block is carried from the model service', async () => {
  const cwd = workspace()
  const service = {
    snapshot: () => graphSnapshot(cwd, GRAPH_NODES, GRAPH_EDGES),
    recall: () => ({ state: 'ready', generatedAt: AT, workspace: cwd, events: 10, text: RECALL_TEXT }),
  }
  const view = await viewOf(service, cwd)

  assert.equal(view.recall.state, 'ready')
  assert.equal(view.recall.text, RECALL_TEXT)
  assert.equal(view.recall.workspace, cwd)
  // The tree is still drawn from the same service in the same pass.
  assert.equal(view.objective.root.subject, 'objective')
})

test('a missing block, a missing service and a failed read stay apart', async () => {
  const cwd = workspace()
  const snapshot = () => graphSnapshot(cwd, GRAPH_NODES, GRAPH_EDGES)

  const missing = await viewOf(
    { snapshot, recall: () => ({ state: 'missing', text: '' }) },
    cwd,
  )
  assert.equal(missing.recall.state, 'missing')

  // A model plugin too old to publish the block is not "nothing recorded".
  const unavailable = await viewOf({ snapshot }, cwd)
  assert.equal(unavailable.recall.state, 'unavailable')

  const broken = await viewOf(
    {
      snapshot,
      recall: () => {
        throw new Error('broken recall')
      },
    },
    cwd,
  )
  assert.equal(broken.recall.state, 'error')
})
