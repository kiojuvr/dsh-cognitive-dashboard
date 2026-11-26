/**
 * Render + interaction test for the conversation view (D85 Stage 2).
 *
 * The plugin has no build step: `client.js` is the artifact the DSH client
 * loader serves. This test loads that same file the way the loader does
 * (`window.__ModuleLoader__.load`), hands it React, registers the view through
 * a fake context, and renders it with jsdom. It covers the shape of the radial
 * tree, the node detail panel, and the keyboard and pointer behaviour the
 * acceptance names.
 *
 * Run: npm test (needs react, react-dom and jsdom as devDependencies).
 */
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const require = createRequire(import.meta.url)
const React = require('react')
const { createRoot } = require('react-dom/client')
const { act, Simulate } = require('react-dom/test-utils')

const CLIENT_FILE = fileURLToPath(new URL('../client.js', import.meta.url))

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
})
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.SVGElement = dom.window.SVGElement
globalThis.MouseEvent = dom.window.MouseEvent
globalThis.KeyboardEvent = dom.window.KeyboardEvent
globalThis.Event = dom.window.Event
globalThis.IS_REACT_ACT_ENVIRONMENT = true
// jsdom does not implement scrolling. Count the calls: the view must reset only
// its own scrollTop, never scroll an ancestor — that pushed the host's tab bar
// out of the window on 2026-11-20.
let scrollIntoViewCalls = 0
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {
  scrollIntoViewCalls += 1
}

const captured = { id: null, factory: null, slots: {}, slotMeta: null, dictionaries: null }
dom.window.__ModuleLoader__ = {
  load(definition) {
    captured.id = definition.id
    captured.factory = definition.factory
  },
}
require(CLIENT_FILE)
if (captured.factory === null) throw new Error('client.js did not register a module')
// The client module graph keys each row by the package name; a stale id leaves
// the row without a factory and the view never appears.
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
if (captured.id !== pkg.name) throw new Error(`client.js registers ${String(captured.id)}, not the package name ${pkg.name}`)

const plugin = captured.factory((name) => {
  if (name === 'react') return React
  throw new Error(`unexpected require: ${name}`)
})

const ctx = {
  effect(fn) {
    fn()
  },
  locale: {
    register(_namespace, dictionaries) {
      captured.dictionaries = dictionaries
    },
    bind() {
      return (key) => captured.dictionaries.ja[key] ?? key
    },
  },
  uiConversation: { views: { register() {} } },
  slots: {
    inject(_name, fn) {
      fn()
    },
    register(meta, component) {
      captured.slotMeta = meta
      captured.slots[meta.id] = component
    },
  },
}
plugin.apply(ctx)

const t = (key) => captured.dictionaries.ja[key] ?? key
const View = captured.slots.dashboard
if (typeof View !== 'function') throw new Error('conversation.view "dashboard" was not registered')

function node(id, subject, value, depth, tasks, findings, extra = {}) {
  const milestones = extra.milestones ?? []
  const paths = extra.paths ?? []
  const docs = extra.docs ?? []
  const acceptance = extra.acceptance ?? {
    done: milestones.filter((milestone) => milestone.done === true).length,
    total: milestones.length,
  }
  return {
    id,
    subject,
    value,
    depth,
    confidence: 'observed',
    kind: extra.kind ?? 'objective',
    parent: extra.parent ?? null,
    paths,
    docs,
    serves: extra.serves ?? null,
    requires: extra.requires ?? [],
    verifies: extra.verifies ?? [],
    tasks,
    findings,
    // D89: size is investment (all work ever linked, plus commits and docs),
    // the ring is the recorded acceptance; both are branch sums.
    investment: extra.investment ?? {
      tasks,
      findings,
      commits: extra.commits ?? 0,
      docs: docs.length,
      total: tasks + findings + (extra.commits ?? 0),
      commitState: extra.commitState ?? 'ready',
    },
    acceptance,
    milestones,
    stale: extra.stale ?? [],
    commitErrors: extra.commitErrors ?? [],
    lastActivity: extra.lastActivity ?? null,
    current: extra.current ?? false,
  }
}

const now = new Date().toISOString()
const nodes = [
  node('n0', 'objective', '長期の作業で目的が局所へ転じる drift を防ぐ。余計な作りこみをせず本来のゴールに届くことが成功のしるしで、取り組みが偏ったままゴールに届かないことが失敗の兆候。', 0, 5, 3, {
    current: true,
    commits: 120,
    acceptance: { done: 15, total: 17 },
    lastActivity: now,
  }),
  node('n1', 'objective/awareness', '逸脱の兆候に気づき、視野を局所から全体へ戻せる。', 1, 3, 1, {
    current: true,
    parent: 'objective',
    commits: 80,
    acceptance: { done: 7, total: 9 },
    lastActivity: now,
  }),
  node('n2', 'component/dashboard', 'dashboard: 人間が数秒で次の一手を判断できる材料を表示する。', 2, 3, 1, {
    current: true,
    kind: 'component',
    parent: 'objective/awareness',
    serves: 'objective/awareness',
    requires: ['component/memory', 'component/findings', 'component/verification'],
    paths: ['dsh-cognitive-dashboard/**'],
    docs: ['dsh-cognitive-dashboard/docs/DESIGN.md'],
    commits: 60,
    milestones: [
      { text: '目的・現在地・未達を同じ画面に置く', done: true, at: '2026-11-19' },
      { text: '円形ツリーで位置と形を読める', done: true, at: '2026-11-20' },
      { text: '投資と受入を比べられる', done: false },
    ],
    stale: ['dsh-cognitive-dashboard/docs/DESIGN.md'],
    lastActivity: now,
  }),
  node('n3', 'component/memory', '記憶層: 6種の Fact を .dsh に保存し、想起ブロックで渡す。', 2, 0, 0, {
    kind: 'component',
    parent: 'objective/awareness',
    serves: 'objective/awareness',
    paths: ['example-workspace/src/**'],
    commits: 40,
    // D105: git could not read this repository, so 40 is a lower bound.
    commitState: 'unavailable',
    commitErrors: ['example-workspace/src/**'],
    milestones: [
      { text: '6種の Fact を保存する', done: true },
      { text: '想起ブロックで渡す', done: true },
    ],
  }),
  node('n4', 'component/verification', 'verification: 検査とレビューで届いているかを確かめる。', 2, 0, 0, {
    kind: 'component',
    parent: 'objective/awareness',
    serves: 'objective/awareness',
    verifies: ['component/dashboard'],
    commits: 0,
    // D105: a lower bound of zero is "could not read", not "0 commits".
    commitState: 'unavailable',
    milestones: [
      { text: 'レビューで受入を確かめる', done: true },
      { text: '実画面の受入を記録する', done: true },
    ],
  }),
]

/**
 * The model graph, as `dsh-cognitive-model` publishes it under its own
 * projection key. The dashboard reads it by key and never imports the package,
 * so the fixture is exactly the wire shape.
 */
/**
 * The block a session starts from, as the model hands it over (D108). The
 * fixture keeps the indentation and the line breaks the card has to preserve:
 * the card shows the text verbatim, not a redrawing of it.
 */
const RECALL_TEXT = [
  'Working memory for this workspace, projected from the event log — build on it instead of re-deriving it:',
  'Objective: objective — 長期の作業で目的が局所へ転じる drift を防ぐ。 [tasks: 5] (reported)',
  'Path: objective → objective/awareness → component/dashboard',
  'Now: 円形ビューを実装する。',
  'Remaining: none recorded — this does not mean nothing else remains.',
  'Map:',
  '  - objective/awareness — 逸脱の兆候に気づく。 [tasks: 3] (drift-injection · prediction-errors)',
  '    - component/dashboard — 円形ビューを実装する。 [tasks: 1]',
  'Experience (rules distilled from earlier prediction errors; conditional and revisable, not a rule for this case):',
  '- [worse] verify the live screen, not just the render tests (repo; when claiming that a UI change works): check the live GUI — 2 observation(s), observed [for component/verification]',
].join('\n')

/**
 * The view reads one projection now (D108): the recall block arrives inside the
 * dashboard projection, so there is no second key to answer.
 */
const projectOf = (key, dashboard) => dashboard
const data = {
  generatedAt: now,
  workspace: 'C:/workspace',
  readState: { findings: 'ready', graph: 'ready', tree: 'graph' },
  objective: {
    root: nodes[0],
    nodes,
    currentPath: ['objective', 'objective/awareness', 'component/dashboard'],
  },
  currentTask: {
    id: 't1',
    value: 'D85 Stage 2 の円形ビューを実装する。',
    confidence: 'observed',
    serves: 'component/dashboard',
    createdAt: now,
    updatedAt: now,
  },
  remaining: [],
  unlinkedTasks: 0,
  findings: {
    total: 1,
    byStatus: { open: 1 },
    byPriority: { P2: 1 },
    open: [
      {
        id: 'f1',
        title: '空状態が緑の ✓ になる',
        status: 'open',
        priority: 'P2',
        kind: 'design-question',
        node: 'component/dashboard',
        ageDays: 0,
      },
    ],
    stale: 0,
    decisions: 0,
  },
  // D108: the recall block arrives inside the dashboard projection; the card
  // shows this text verbatim, so the fixture is the wire shape.
  recall: {
    state: 'ready',
    generatedAt: now,
    workspace: 'C:/workspace',
    events: 12,
    text: RECALL_TEXT,
  },
}

const container = document.getElementById('root')
const root = createRoot(container)
const checks = []

function check(name, ok) {
  checks.push([name, ok === true])
}

function treeitems() {
  return [...container.querySelectorAll('[role="treeitem"]')]
}

function text() {
  return container.textContent
}

function byLabel(prefix) {
  return treeitems().find((element) => (element.getAttribute('aria-label') ?? '').startsWith(prefix))
}

async function fire(element, event) {
  await act(async () => {
    element.dispatchEvent(event)
  })
}

await act(async () => {
  root.render(React.createElement(View, { useProjection: (key) => projectOf(key, data), t }))
})

const tab = captured.slotMeta
check('the tab is titled 認知', tab !== undefined && tab.label() === '認知')
check('the composer dock card is not registered', captured.slots['dashboard-card'] === undefined)
const enKeys = Object.keys(captured.dictionaries.en).sort()
check(
  'locale dictionaries have the same keys',
  ['zh', 'ja'].every((lang) => {
    const keys = Object.keys(captured.dictionaries[lang]).sort()
    return keys.length === enKeys.length && keys.every((key, index) => key === enKeys[index])
  }),
)
check('mount does not scroll an ancestor', scrollIntoViewCalls === 0)
check('tree has role="tree"', container.querySelector('[role="tree"]') !== null)
check('one treeitem per node', treeitems().length === nodes.length)
check('labels are short keys', ['dashboard', 'memory', 'verification'].every((key) => text().includes(key)))
check('node counts are visible', text().includes('3·1'))
check('size caption is visible', text().includes('大きさ = 投資'))
check(
  'acceptance ring is drawn for a node with recorded acceptance',
  byLabel('dashboard').querySelectorAll('circle[stroke-dasharray]').length >= 1,
)
check(
  'size follows investment, not open work',
  Number(byLabel('memory').querySelector('circle').getAttribute('r')) >
    Number(byLabel('verification').querySelector('circle').getAttribute('r')),
)
check(
  'aria-label carries the acceptance count',
  (byLabel('dashboard').getAttribute('aria-label') ?? '').includes('受入 2/3'),
)
check(
  'aria-label carries the commit lower bound',
  (byLabel('memory').getAttribute('aria-label') ?? '').includes('(一部の履歴を読み取れません)'),
)
check('current path is drawn as text', text().includes('component › dashboard'))
check(
  'current nodes are marked for assistive tech',
  treeitems().filter((element) => (element.getAttribute('aria-label') ?? '').includes('現在のパス')).length === 3,
)
check(
  'aria-level follows depth',
  byLabel('dashboard').getAttribute('aria-level') === '3' &&
    byLabel('objective').getAttribute('aria-level') === '1',
)

const dashboardNode = byLabel('dashboard')
await fire(dashboardNode, new dom.window.MouseEvent('click', { bubbles: true }))
check('click opens the node detail', text().includes('人間が数秒で次の一手を判断できる材料を表示する。'))
check('detail lists tasks', text().includes('D85 Stage 2 の円形ビューを実装する。'))
check('detail lists open findings', text().includes('空状態が緑の ✓ になる'))
check('detail lists paths', text().includes('dsh-cognitive-dashboard/**'))
check('detail lists docs', text().includes('dsh-cognitive-dashboard/docs/DESIGN.md'))
check('detail shows the acceptance share', text().includes('受入 2/3'))
check('detail lists the acceptance items', text().includes('目的・現在地・未達を同じ画面に置く'))
check('detail shows the investment', text().includes('投資') && text().includes('60 commits'))
check('detail marks a stale link', text().includes('見つかりません'))
check('detail shows the last activity', text().includes('最終活動'))
check('requires edge is drawn', container.innerHTML.includes('stroke-dasharray'))
check('detail can be closed', container.querySelector('[aria-label="閉じる"]') !== null)

await fire(container.querySelector('[aria-label="閉じる"]'), new dom.window.MouseEvent('click', { bubbles: true }))
check('close hides the detail', !text().includes('dsh-cognitive-dashboard/**'))

// The reverse edge is the question a reader asks: what breaks if this goes?
const memoryNode = byLabel('memory')
await fire(memoryNode, new dom.window.MouseEvent('click', { bubbles: true }))
check(
  'reverse requires names the dependants',
  text().includes('これを消すと壊れる') && text().includes('component/dashboard'),
)
check(
  'detail shows the commit lower bound',
  text().includes('40+ commits (一部の履歴を読み取れません)'),
)
check(
  'detail marks the link git could not read',
  text().includes('example-workspace/src/**') && text().includes('commits を読み取れません'),
)
await fire(container.querySelector('[aria-label="閉じる"]'), new dom.window.MouseEvent('click', { bubbles: true }))

const verificationNode = byLabel('verification')
await fire(verificationNode, new dom.window.MouseEvent('click', { bubbles: true }))
check(
  'a lower bound of zero is not shown as 0 commits',
  text().includes('commits を読み取れません') && !text().includes('0 commits'),
)
await fire(container.querySelector('[aria-label="閉じる"]'), new dom.window.MouseEvent('click', { bubbles: true }))

const rootNode = byLabel('objective')
await act(async () => {
  rootNode.focus()
})
await fire(rootNode, new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
check(
  'ArrowDown moves focus to a child',
  document.activeElement !== rootNode && document.activeElement.getAttribute('role') === 'treeitem',
)
await fire(document.activeElement, new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
check('Enter opens the focused node', container.querySelector('[aria-label="閉じる"]') !== null)
await fire(document.activeElement, new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
check('Escape closes the detail', container.querySelector('[aria-label="閉じる"]') === null)

const search = container.querySelector('input[type="search"]')
await act(async () => {
  // A plain DOM `input` event does not reach React's controlled-input tracker
  // under jsdom; Simulate goes through the same event system the browser uses.
  Simulate.change(search, { target: { value: 'memory' } })
})
check(
  'search dims the nodes that do not match',
  treeitems().filter((element) => element.style.opacity === '0.3').length === nodes.length - 1,
)

const zoomIn = [...container.querySelectorAll('button')].find(
  (button) => button.getAttribute('aria-label') === '拡大',
)
await fire(zoomIn, new dom.window.MouseEvent('click', { bubbles: true }))
check('zoom scales the canvas', container.innerHTML.includes('scale(1.25)'))

const rootNodeAgain = byLabel('objective')
await fire(rootNodeAgain, new dom.window.MouseEvent('dblclick', { bubbles: true }))
check('double click collapses the children', treeitems().length === 1)

// A deeper tree must render: the layout is not hard-wired to one ring.
const deep = [
  node('d0', 'objective', 'root', 0, 1, 0, { current: true }),
  node('d1', 'objective/a', 'a', 1, 1, 0),
  node('d2', 'objective/a/b', 'b', 2, 1, 0),
  node('d3', 'objective/a/b/c', 'c', 3, 0, 1),
]
const deepContainer = document.createElement('div')
document.body.append(deepContainer)
const deepRoot = createRoot(deepContainer)
let deepOk = true
try {
  await act(async () => {
    deepRoot.render(
      React.createElement(View, {
        useProjection: (key) =>
          projectOf(key, {
            ...data,
            objective: { root: deep[0], nodes: deep, currentPath: ['objective', 'objective/a'] },
            currentTask: { ...data.currentTask, serves: 'objective/a' },
          }),
        t,
      }),
    )
  })
  deepOk = deepContainer.querySelectorAll('[role="treeitem"]').length === deep.length
} catch {
  deepOk = false
}
check('a deeper tree renders', deepOk)
check(
  'a node without acceptance has no ring',
  deepContainer.querySelectorAll('circle[stroke-dasharray]').length === 0,
)

// A workspace with no ledgers must say "not recorded", not "normal" (F4).
const emptyContainer = document.createElement('div')
document.body.append(emptyContainer)
const emptyRoot = createRoot(emptyContainer)
await act(async () => {
  emptyRoot.render(
    React.createElement(View, {
      useProjection: () => ({
        ...data,
        workspace: 'C:/empty',
        readState: { findings: 'missing', graph: 'missing', tree: 'none' },
        objective: { root: null, nodes: [], currentPath: [] },
        currentTask: null,
        remaining: [],
        findings: { total: 0, byStatus: {}, byPriority: {}, open: [], stale: 0, decisions: 0 },
        recall: { state: 'missing', text: '' },
      }),
      t,
    }),
  )
})
check(
  'an empty workspace is not shown as normal',
  emptyContainer.textContent.includes('未記録') && !emptyContainer.textContent.includes('✓'),
)

// The recall block card (D108): the text a session starts from, verbatim.
check('the recall block card is drawn', text().includes('想起ブロック'))
check(
  'the definition says the per-session check is not included',
  text().includes('BIRDSEYE') && text().includes('含まない'),
)
const recallPre = container.querySelector('pre')
check(
  'the block is shown verbatim, indentation and line breaks included',
  recallPre !== null && recallPre.textContent === RECALL_TEXT,
)
check(
  'the old recorded-structure card is gone',
  !text().includes('記録された構造') && !text().includes('未解決の競合'),
)

// The absences stay apart: no block, an unreadable block, no model plugin, and
// an empty block are four different facts (F4).
async function recallView(recall) {
  const element = document.createElement('div')
  document.body.append(element)
  const elementRoot = createRoot(element)
  await act(async () => {
    elementRoot.render(
      React.createElement(View, { useProjection: () => ({ ...data, recall }), t }),
    )
  })
  return element
}

const missingRecall = await recallView({ state: 'missing', text: '' })
check(
  'a workspace with no block says it is not recorded',
  missingRecall.textContent.includes('想起ブロックはまだ記録されていない'),
)

const emptyRecall = await recallView({
  state: 'ready',
  generatedAt: now,
  workspace: 'C:/workspace',
  events: 0,
  text: '',
})
check(
  'a ready but empty block is not drawn as a block',
  emptyRecall.textContent.includes('想起ブロックはまだ記録されていない') &&
    emptyRecall.querySelector('pre') === null,
)

const errorRecall = await recallView({
  state: 'error',
  message:
    'the graph is schema 1, not schema 2; it must be migrated before this version can read it',
  text: '',
})
check(
  'a read error shows the model reason',
  errorRecall.textContent.includes('schema 1, not schema 2'),
)
check(
  'a read error does not show a command',
  !errorRecall.textContent.includes('migrate-peg'),
)

const errorNoMessage = await recallView({ state: 'error', text: '' })
check(
  'a read error without a reason keeps the generic text',
  errorNoMessage.textContent.includes(t('dash.readError')),
)

const unavailableRecall = await recallView({ state: 'unavailable' })
check(
  'a profile without the model plugin says so',
  unavailableRecall.textContent.includes('model プラグインがこのプロファイルに無い'),
)
// A tree drawn from the graph carries the node's label as its value and the
// graph sentence as a description; the panel must show both (D97).
const graphTree = nodes.map((entry) =>
  entry.subject === 'component/dashboard'
    ? { ...entry, description: 'グラフから描いた説明文' }
    : entry,
)
const graphTreeContainer = document.createElement('div')
document.body.append(graphTreeContainer)
const graphTreeRoot = createRoot(graphTreeContainer)
await act(async () => {
  graphTreeRoot.render(
    React.createElement(View, {
      useProjection: (key) =>
        projectOf(key, {
          ...data,
          readState: { findings: 'ready', graph: 'ready', tree: 'graph' },
          objective: { root: graphTree[0], nodes: graphTree, currentPath: data.objective.currentPath },
        }),
      t,
    }),
  )
})
const graphTreeNode = [...graphTreeContainer.querySelectorAll('[role="treeitem"]')].find((element) =>
  (element.getAttribute('aria-label') ?? '').startsWith('dashboard'),
)
if (graphTreeNode !== undefined) {
  await fire(graphTreeNode, new dom.window.MouseEvent('click', { bubbles: true }))
}
check(
  'the graph description is shown in the node panel',
  graphTreeContainer.textContent.includes('グラフから描いた説明文'),
)

// With no tree source at all, the section names the missing plugin rather than
// pretending the workspace is empty (F4).
const noTreeContainer = document.createElement('div')
document.body.append(noTreeContainer)
const noTreeRoot = createRoot(noTreeContainer)
await act(async () => {
  noTreeRoot.render(
    React.createElement(View, {
      useProjection: (key) =>
        projectOf(key, {
          ...data,
          readState: { findings: 'missing', graph: 'unavailable', tree: 'none' },
          objective: { root: null, nodes: [], currentPath: [] },
          currentTask: null,
          remaining: [],
        }),
      t,
    }),
  )
})
check(
  'the objective section names a missing model plugin',
  noTreeContainer.textContent.includes('model プラグインがこのプロファイルに無い'),
)

let failed = 0
for (const [name, ok] of checks) {
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
}
console.log(`\n${checks.length - failed}/${checks.length} passed`)
if (failed > 0) process.exitCode = 1
