/**
 * Browser half of dsh-cognitive-dashboard.
 *
 * Registers one Conversation view tab (Cognition) in the view ring. It reads the
 * Host's `dashboard` session projection through the standard `useProjection` prop;
 * it calls no command, so opening the view adds no command rows to the log.
 *
 * The layout follows the dashboard design guide: the objective tree comes first
 * as the whole picture, then the current task and the other open work as
 * context, with the findings beside them, and the recall block last. There is no
 * score or verdict: the view reports what the ledgers record, and absence is
 * shown as "not recorded", never as success. Status is carried by a glyph and a
 * word as well as color.
 *
 * The checks card was removed in D94: it was self-diagnosis fed by a report
 * produced outside this repository, so it made the view a relay dependency.
 * The objective tree, the current task, the other open work, and the findings
 * are read from the workspace ledgers only. The last card shows the recall block
 * the model hands a session, verbatim (D108).
 *
 * This file is the built client artifact the `dsh.client` scan serves; it is
 * plain JS on purpose and needs no bundler. React comes from the browser module
 * table. All copy goes through the Client locale service.
 */
window.__ModuleLoader__.load({
  id: '@kioju/dsh-cognitive-dashboard',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'cognitive-dashboard'

    const en = {
      'view.dashboard': 'Cognition',
      'dash.title': 'Cognition',
      'dash.objective': 'Objective',
      'dash.currentTask': 'Current task',
      'dash.findings': 'Open findings',
      'dash.stale': 'stale',
      'dash.noOpen': 'No open findings',
      'dash.noObjective': 'No objective is recorded yet',
      'dash.noCurrentTask': 'No current task is recorded yet',
      'dash.remaining': 'Other open work',
      'dash.noRemaining': 'not recorded',
      'dash.noRemaining.hint': 'not recorded — this does not mean nothing else remains',
      'dash.noOtherTasks': 'No other task is recorded',
      'dash.tasks': 'tasks',
      'dash.nodeFindings': 'findings',
      'dash.currentPath': 'current path',
      'dash.unlinked': 'unlinked',
      'dash.notRecorded': 'not recorded',
      'dash.readError': 'could not read',
      'dash.noFindingsRecorded': 'No findings recorded',
      'dash.noWorkspace': 'No workspace is bound to this session.',
      'dash.loading': 'Loading the cognition snapshot…',
      'dash.days': 'd',
      'dash.confidence.reported': 'reported',
      'dash.confidence.verified': 'verified',
      'dash.confidence.observed': 'observed',
      'dash.confidence.reported.hint': 'reported by the user, not yet verified',
      'dash.confidence.verified.hint': 'confirmed by a command or file',
      'dash.confidence.observed.hint': 'seen as a tool or command result',
      'dash.updated': 'updated',
      'dash.ago.justNow': 'just now',
      'dash.ago.minutes': '{n} min ago',
      'dash.ago.hours': '{n} h ago',
      'dash.ago.days': '{n} d ago',
      'kind.bug': 'bug',
      'kind.risk': 'risk',
      'kind.tech-debt': 'tech debt',
      'kind.design-question': 'design question',
      'kind.doc-gap': 'doc gap',
      'kind.dependency': 'dependency',
      'kind.security': 'security',
      'kind.other': 'other',
      'kind.constraint': 'constraint',
      'kind.decision': 'decision',
      'kind.task_state': 'task state',
      'kind.repo_fact': 'repo fact',
      'kind.user_preference': 'preference',
      'find.status.open': 'open',
      'find.status.triaged': 'triaged',
      'find.status.in_progress': 'in progress',
      'find.status.resolved': 'resolved',
      'find.status.wontfix': 'wontfix',
      'find.status.duplicate': 'duplicate',
      'dash.tree.size': 'size = investment (tasks + findings + commits) · ring = acceptance (n/m)',
      'dash.tree.search': 'Search nodes',
      'dash.tree.searchCount': '{n} of {total}',
      'dash.tree.zoomIn': 'Zoom in',
      'dash.tree.zoomOut': 'Zoom out',
      'dash.tree.zoomReset': 'Reset view',
      'dash.tree.noMatch': 'no node matches',
      'dash.tree.collapsed': '{n} hidden',
      'dash.nodes': 'nodes',
      'dash.kind.objective': 'objective',
      'dash.kind.component': 'means',
      'dash.edge.serves': 'Serves',
      'dash.edge.requires': 'Needs',
      'dash.edge.breaks': 'Breaks if removed',
      'dash.edge.verifies': 'Verified by',
      'dash.edge.targets': 'Checks',
      'dash.node.current': 'current',
      'dash.node.tasks': 'Tasks',
      'dash.node.findings': 'Open findings',
      'dash.node.paths': 'Implementation',
      'dash.node.docs': 'Docs',
      'dash.node.close': 'Close',
      'dash.node.empty': 'Nothing is recorded under this node',
      'dash.node.acceptance': 'Acceptance',
      'dash.node.investment': 'Investment',
      'dash.node.commits': 'commits',
      'dash.node.commitsUnreadable': 'commits could not be read',
      'dash.node.commitsLowerBound': 'some histories could not be read',
      'dash.node.lastActivity': 'Last activity',
      'dash.node.noAcceptance': 'No acceptance is recorded',
      'dash.node.branchAcceptance': 'Branch acceptance',
      'dash.node.stale': 'missing',
      'dash.model.unavailable': 'The model plugin is not in this profile',
      'dash.recall': 'Recall block',
      'dash.recall.definition':
        'The block the model hands a session, verbatim. The once-per-session bird’s-eye prompt (BIRDSEYE) is not included.',
      'dash.recall.empty': 'No recall block is recorded yet',
    }

    const zh = {
      'view.dashboard': '认知',
      'dash.title': '认知',
      'dash.objective': '目标',
      'dash.currentTask': '当前任务',
      'dash.findings': '未处理发现',
      'dash.stale': '滞留',
      'dash.noOpen': '没有未处理的发现',
      'dash.noObjective': '尚未记录目标',
      'dash.noCurrentTask': '尚未记录当前任务',
      'dash.remaining': '其他未完成工作',
      'dash.noRemaining': '未记录',
      'dash.noRemaining.hint': '未记录——并不表示没有其他剩余工作',
      'dash.noOtherTasks': '没有记录其他任务',
      'dash.tasks': '任务',
      'dash.nodeFindings': '发现',
      'dash.currentPath': '当前路径',
      'dash.unlinked': '未链接',
      'dash.notRecorded': '未记录',
      'dash.readError': '无法读取',
      'dash.noFindingsRecorded': '没有记录发现',
      'dash.noWorkspace': '此会话没有绑定工作区。',
      'dash.loading': '正在加载认知快照…',
      'dash.days': '天',
      'dash.confidence.reported': '申报',
      'dash.confidence.verified': '已验证',
      'dash.confidence.observed': '已观测',
      'dash.confidence.reported.hint': '用户申报，尚未验证',
      'dash.confidence.verified.hint': '已由命令或文件确认',
      'dash.confidence.observed.hint': '作为工具或命令结果观测',
      'dash.updated': '更新',
      'dash.ago.justNow': '刚刚',
      'dash.ago.minutes': '{n} 分钟前',
      'dash.ago.hours': '{n} 小时前',
      'dash.ago.days': '{n} 天前',
      'kind.bug': '缺陷',
      'kind.risk': '风险',
      'kind.tech-debt': '技术债',
      'kind.design-question': '设计问题',
      'kind.doc-gap': '文档缺失',
      'kind.dependency': '依赖',
      'kind.security': '安全',
      'kind.other': '其他',
      'kind.constraint': '约束',
      'kind.decision': '决定',
      'kind.task_state': '任务状态',
      'kind.repo_fact': '仓库事实',
      'kind.user_preference': '用户偏好',
      'find.status.open': '未处理',
      'find.status.triaged': '已分诊',
      'find.status.in_progress': '进行中',
      'find.status.resolved': '已解决',
      'find.status.wontfix': '不修复',
      'find.status.duplicate': '重复',
      'dash.tree.size': '大小 = 投入（任务 + findings + 提交）· 环 = 验收（n/m）',
      'dash.tree.search': '搜索节点',
      'dash.tree.searchCount': '{total} 中的 {n}',
      'dash.tree.zoomIn': '放大',
      'dash.tree.zoomOut': '缩小',
      'dash.tree.zoomReset': '恢复视图',
      'dash.tree.noMatch': '没有匹配的节点',
      'dash.tree.collapsed': '隐藏 {n} 个',
      'dash.nodes': '节点',
      'dash.kind.objective': '目标',
      'dash.kind.component': '手段',
      'dash.edge.serves': '服务目标',
      'dash.edge.requires': '依赖',
      'dash.edge.breaks': '移除后受影响',
      'dash.edge.verifies': '由此验证',
      'dash.edge.targets': '验证对象',
      'dash.node.current': '当前',
      'dash.node.tasks': '任务',
      'dash.node.findings': '未解决 findings',
      'dash.node.paths': '实现',
      'dash.node.docs': '文档',
      'dash.node.close': '关闭',
      'dash.node.empty': '该节点下还没有记录',
      'dash.node.acceptance': '验收',
      'dash.node.investment': '投入',
      'dash.node.commits': '提交',
      'dash.node.commitsUnreadable': '无法读取提交',
      'dash.node.commitsLowerBound': '部分历史无法读取',
      'dash.node.lastActivity': '最近活动',
      'dash.node.noAcceptance': '尚未记录验收',
      'dash.node.branchAcceptance': '该分支验收',
      'dash.node.stale': '不存在',
      'dash.model.unavailable': '此配置未安装 model 插件',
      'dash.recall': '召回块',
      'dash.recall.definition': 'model 交给会话的召回块原文。不含每个会话只添加一次的俯瞰提示（BIRDSEYE）。',
      'dash.recall.empty': '尚未记录召回块',
    }

    const ja = {
      'view.dashboard': '認知',
      'dash.title': '認知',
      'dash.objective': '目的',
      'dash.currentTask': '現在のタスク',
      'dash.findings': '未対応 findings',
      'dash.stale': '滞留',
      'dash.noOpen': '未対応の finding はありません',
      'dash.noObjective': '目的がまだ記録されていません',
      'dash.noCurrentTask': '現在のタスクがまだ記録されていません',
      'dash.remaining': '他に残っていること',
      'dash.noRemaining': '未記録',
      'dash.noRemaining.hint': '未記録 — 他に残りが無いという意味ではありません',
      'dash.noOtherTasks': '他に記録されたタスクはありません',
      'dash.tasks': 'タスク',
      'dash.nodeFindings': 'findings',
      'dash.currentPath': '現在のパス',
      'dash.unlinked': '未リンク',
      'dash.notRecorded': '未記録',
      'dash.readError': '読み取れません',
      'dash.noFindingsRecorded': 'findings は記録されていません',
      'dash.noWorkspace': 'このセッションにはワークスペースがありません。',
      'dash.loading': '認知のスナップショットを読み込み中…',
      'dash.days': '日',
      'dash.confidence.reported': '申告',
      'dash.confidence.verified': '検証済み',
      'dash.confidence.observed': '観測',
      'dash.confidence.reported.hint': '本人の申告で、まだ検証されていない',
      'dash.confidence.verified.hint': 'コマンドやファイルで確認済み',
      'dash.confidence.observed.hint': 'ツールやコマンドの結果として観測',
      'dash.updated': '更新',
      'dash.ago.justNow': 'たった今',
      'dash.ago.minutes': '{n}分前',
      'dash.ago.hours': '{n}時間前',
      'dash.ago.days': '{n}日前',
      'kind.bug': '不具合',
      'kind.risk': 'リスク',
      'kind.tech-debt': '技術的負債',
      'kind.design-question': '設計課題',
      'kind.doc-gap': '文書の欠落',
      'kind.dependency': '依存',
      'kind.security': 'セキュリティ',
      'kind.other': 'その他',
      'kind.constraint': '制約',
      'kind.decision': '決定',
      'kind.task_state': 'タスク状態',
      'kind.repo_fact': 'リポジトリ事実',
      'kind.user_preference': 'ユーザー選好',
      'find.status.open': '未対応',
      'find.status.triaged': 'トリアージ済み',
      'find.status.in_progress': '進行中',
      'find.status.resolved': '解決',
      'find.status.wontfix': '対応しない',
      'find.status.duplicate': '重複',
      'dash.tree.size': '大きさ = 投資（タスク＋findings＋commits）· 輪 = 受入（n/m）',
      'dash.tree.search': 'ノードを検索',
      'dash.tree.searchCount': '{total} 中 {n}',
      'dash.tree.zoomIn': '拡大',
      'dash.tree.zoomOut': '縮小',
      'dash.tree.zoomReset': '表示を戻す',
      'dash.tree.noMatch': '一致するノードがない',
      'dash.tree.collapsed': '{n} 件を隠す',
      'dash.nodes': 'ノード',
      'dash.kind.objective': '目的',
      'dash.kind.component': '手段',
      'dash.edge.serves': '仕える目的',
      'dash.edge.requires': '必要とする',
      'dash.edge.breaks': 'これを消すと壊れる',
      'dash.edge.verifies': 'これを確かめる',
      'dash.edge.targets': '確かめる対象',
      'dash.node.current': '現在',
      'dash.node.tasks': 'タスク',
      'dash.node.findings': '未対応 findings',
      'dash.node.paths': '実装',
      'dash.node.docs': 'ドキュメント',
      'dash.node.close': '閉じる',
      'dash.node.empty': 'このノードにはまだ何も記録されていない',
      'dash.node.acceptance': '受入',
      'dash.node.investment': '投資',
      'dash.node.commits': 'commits',
      'dash.node.commitsUnreadable': 'commits を読み取れません',
      'dash.node.commitsLowerBound': '一部の履歴を読み取れません',
      'dash.node.lastActivity': '最終活動',
      'dash.node.noAcceptance': '受入は未記録',
      'dash.node.branchAcceptance': 'この枝の受入',
      'dash.node.stale': '見つかりません',
      'dash.model.unavailable': 'model プラグインがこのプロファイルに無い',
      'dash.recall': '想起ブロック',
      'dash.recall.definition':
        'model がセッションに渡す想起ブロックの原文。セッションごとに一度だけ添える俯瞰の促し（BIRDSEYE）は含まない。',
      'dash.recall.empty': '想起ブロックはまだ記録されていない',
    }

    const T = {
      text: 'var(--dsw-alias-label-primary)',
      text2: 'var(--dsw-alias-label-secondary)',
      text3: 'var(--dsw-alias-label-tertiary)',
      border: 'var(--dsw-alias-border-l2)',
      borderSoft: 'var(--dsw-alias-border-l1)',
      surface: 'color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent)',
      track: 'color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent)',
      success: 'var(--dsw-alias-state-success-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      warnText: 'var(--dsw-alias-state-warn-label)',
      error: 'var(--dsw-alias-state-error-primary)',
      business: 'var(--dsw-alias-state-business-primary)',
      radius: 'var(--dsw-radius-md)',
    }

    const TONE = {
      success: T.success,
      warn: T.warn,
      error: T.error,
      business: T.business,
      neutral: T.text3,
    }

    const TONE_BG = {
      success: 'color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent)',
      warn: 'color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent)',
      error: 'color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent)',
      business: 'color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)',
      neutral: 'color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent)',
    }

    const TONE_BORDER = {
      success: 'color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, transparent)',
      warn: 'color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent)',
      error: 'color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent)',
      business: 'color-mix(in srgb, var(--dsw-alias-state-business-primary) 40%, transparent)',
      neutral: T.border,
    }

    const PRIORITY_TONE = { P0: 'error', P1: 'warn', P2: 'neutral', P3: 'neutral' }
    const PRIORITY_COLOR = {
      P0: T.error,
      P1: T.warnText,
      P2: T.text2,
      P3: T.text2,
    }

    // The tree uses state colour only for the current path (D85): no semantic
    // colours, no size legend beyond the one caption line.
    const NODE_FILL = 'color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent)'
    const NODE_FILL_COMPONENT = 'color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent)'
    const NODE_FILL_CURRENT = 'color-mix(in srgb, var(--dsw-alias-state-business-primary) 22%, transparent)'
    const NODE_STROKE = T.border
    const NODE_STROKE_CURRENT = T.business

    const STALE_DAYS = 14

    const styles = {
      view: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        padding: '20px 24px',
        paddingBottom: 'calc(var(--dsh-composer-height, 152px) + 24px)',
        minHeight: '100%',
        boxSizing: 'border-box',
        overflow: 'auto',
        color: T.text,
        fontSize: '13px',
        lineHeight: 1.5,
        background: 'transparent',
      },
      card: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: 0,
        padding: '12px 14px',
        border: '0.5px solid ' + T.border,
        borderRadius: T.radius,
        background: T.surface,
      },
      sectionHead: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' },
      sectionTitle: {
        margin: 0,
        fontSize: '12px',
        lineHeight: '18px',
        fontWeight: 600,
        color: T.text,
      },
      sectionCount: { fontSize: '11px', lineHeight: '16px', color: T.text2 },
      statusGlyph: { flex: 'none', width: '12px', fontWeight: 700, textAlign: 'center' },
      definition: {
        marginTop: '1px',
        color: T.text2,
        fontSize: '11px',
        lineHeight: '16px',
      },
      findingsList: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
      findingRow: {
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
        padding: '8px 0',
        borderTop: '1px solid ' + T.borderSoft,
        minWidth: 0,
      },
      priority: {
        flex: 'none',
        width: '26px',
        marginTop: '1px',
        padding: '0 2px',
        borderRadius: '4px',
        fontSize: '10px',
        lineHeight: '16px',
        fontWeight: 700,
        textAlign: 'center',
      },
      findingBody: { minWidth: 0, flex: '1 1 auto' },
      findingTitle: { color: T.text, fontSize: '12px', lineHeight: '17px', overflowWrap: 'anywhere' },
      findingMeta: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        marginTop: '2px',
        color: T.text2,
        fontSize: '11px',
        lineHeight: '15px',
      },
      empty: { color: T.text2, fontSize: '12px', lineHeight: '18px' },
      treeRow: { display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' },
      treeColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: '1.6 1 500px',
        minWidth: 0,
      },
      nodeColumn: { flex: '1 1 260px', minWidth: 0 },
      objectiveRoot: {
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        paddingLeft: '10px',
        borderLeft: '2px solid ' + T.business,
      },
      objectiveValue: { color: T.text, fontSize: '13px', lineHeight: '20px', overflowWrap: 'anywhere' },
      // The radial tree (D85): the shape carries the plan — depth is the ring,
      // weightMin is the node radius, and the current path is drawn. No score,
      // no threshold, no verdict word (D86 keeps it that way).
      treeWrap: {
        position: 'relative',
        width: '100%',
        aspectRatio: '600 / 520',
        maxHeight: '520px',
        overflow: 'hidden',
        touchAction: 'none',
        cursor: 'grab',
        border: '0.5px solid ' + T.borderSoft,
        borderRadius: T.radius,
      },
      treeCanvas: { position: 'absolute', inset: 0, transformOrigin: 'center' },
      treeSvg: { display: 'block', width: '100%', height: '100%' },
      treeEdge: { stroke: T.border, strokeWidth: 1 },
      treeEdgeCurrent: { stroke: T.business, strokeWidth: 2 },
      // `requires` is structure, not status: a neutral dashed arc (D88).
      treeEdgeRequires: {
        fill: 'none',
        stroke: T.text3,
        strokeWidth: 1,
        strokeDasharray: '4 3',
        opacity: 0.85,
      },
      treeLabel: { fill: T.text2, fontSize: '11px', pointerEvents: 'none' },
      treeLabelCurrent: { fill: T.text, fontWeight: 600 },
      treeCount: { fill: T.text3, fontSize: '9px', pointerEvents: 'none' },
      treeToolbar: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' },
      treeSearch: {
        flex: '1 1 120px',
        minWidth: 0,
        padding: '3px 7px',
        border: '0.5px solid ' + T.border,
        borderRadius: '4px',
        background: 'transparent',
        color: T.text,
        fontSize: '11px',
        lineHeight: '16px',
        fontFamily: 'inherit',
      },
      treeButton: {
        flex: 'none',
        padding: '2px 7px',
        border: '0.5px solid ' + T.border,
        borderRadius: '4px',
        background: 'transparent',
        color: T.text2,
        fontSize: '11px',
        lineHeight: '16px',
        cursor: 'pointer',
        fontFamily: 'inherit',
      },
      treeHint: { color: T.text3, fontSize: '10px', lineHeight: '15px' },
      nodePanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid ' + T.borderSoft,
      },
      nodePanelHead: { display: 'flex', gap: '6px', alignItems: 'baseline', flexWrap: 'wrap' },
      nodeKey: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '11px',
        lineHeight: '15px',
        color: T.text3,
        overflowWrap: 'anywhere',
      },
      nodeValue: { color: T.text, fontSize: '12px', lineHeight: '18px', overflowWrap: 'anywhere' },
      nodeEdgeLine: {
        color: T.text2,
        fontSize: '11px',
        lineHeight: '16px',
        overflowWrap: 'anywhere',
      },
      nodeSection: { display: 'flex', flexDirection: 'column', gap: '3px' },
      nodeSectionTitle: { color: T.text2, fontSize: '10px', lineHeight: '14px', fontWeight: 600 },
      nodeList: { display: 'flex', flexDirection: 'column', gap: '3px', margin: 0, padding: 0, listStyle: 'none' },
      nodeItem: {
        display: 'flex',
        gap: '6px',
        alignItems: 'baseline',
        fontSize: '11px',
        lineHeight: '16px',
        color: T.text2,
        overflowWrap: 'anywhere',
      },
      nodeCode: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '10px',
        lineHeight: '15px',
        color: T.text2,
        overflowWrap: 'anywhere',
      },
      taskValue: {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        color: T.text,
        fontSize: '12px',
        lineHeight: '18px',
        overflowWrap: 'anywhere',
      },
      // The other open work is a second line of the same "where the work stands"
      // card: the current task alone cannot show whether it is the whole
      // objective or one part of it (D79).
      remainingLabel: {
        paddingTop: '6px',
        borderTop: '0.5px solid ' + T.borderSoft,
        color: T.text2,
        fontSize: '11px',
        lineHeight: '15px',
      },
      remainingList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        margin: 0,
        padding: 0,
        listStyle: 'none',
      },
      remainingItem: { display: 'flex', gap: '6px', alignItems: 'baseline' },
      remainingServes: { flex: 'none', color: T.text3, fontSize: '10px' },
      taskServes: { color: T.text3, fontSize: '11px', lineHeight: '15px', overflowWrap: 'anywhere' },
      unlinkedNote: { color: T.warnText, fontSize: '11px', lineHeight: '15px' },
      confidence: {
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 5px',
        border: '0.5px solid ' + T.border,
        borderRadius: '4px',
        color: T.text2,
        fontSize: '10px',
        lineHeight: '14px',
        whiteSpace: 'nowrap',
      },
      emptyState: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '40px 24px',
        alignItems: 'center',
        textAlign: 'center',
        color: T.text2,
      },
      emptyTitle: { color: T.text, fontSize: '14px', lineHeight: '20px', fontWeight: 600 },
      // The recall block (D108). It is shown verbatim: the indentation and the
      // line breaks carry the structure (tree depth, sections), so it is a
      // wrapping `pre`, not a list. No height cap — a cap would hide the
      // material the reader opened the tab for; the view itself scrolls.
      recallText: {
        margin: 0,
        padding: '8px 10px',
        border: '0.5px solid ' + T.borderSoft,
        borderRadius: '4px',
        background: 'color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent)',
        color: T.text,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '11px',
        lineHeight: '18px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
      },
    }

    const visuallyHidden = {
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: 0,
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap',
      border: 0,
    }
    function translate(props) {
      return typeof props.t === 'function' ? props.t : (key) => key
    }

    function phrase(t, key, replacements) {
      let value = t(key)
      if (typeof value !== 'string') return key
      for (const [name, replacement] of Object.entries(replacements)) {
        value = value.replaceAll(`{${name}}`, String(replacement))
      }
      return value
    }

    function labelOr(t, key, fallback) {
      const value = t(key)
      return typeof value === 'string' && value !== key ? value : fallback
    }

    function formatAgo(value, t) {
      if (typeof value !== 'string') return ''
      const at = Date.parse(value)
      if (!Number.isFinite(at)) return ''
      const minutes = Math.floor(Math.max(0, Date.now() - at) / 60_000)
      if (minutes < 1) return t('dash.ago.justNow')
      if (minutes < 60) return phrase(t, 'dash.ago.minutes', { n: minutes })
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return phrase(t, 'dash.ago.hours', { n: hours })
      return phrase(t, 'dash.ago.days', { n: Math.floor(hours / 24) })
    }

    /**
     * The commit count as a reader should see it (F1 / D105).
     *
     * `commitState: 'unavailable'` means at least one repository in the branch
     * could not be read, so the number is a lower bound. A lower bound of zero
     * is not "0 commits": it says the count could not be read, because "could
     * not read" and "none" are different facts (D79 / F4).
     */
    function commitText(investment, t) {
      const commits = typeof investment?.commits === 'number' ? investment.commits : 0
      if (investment?.commitState !== 'unavailable') return `${commits} ${t('dash.node.commits')}`
      if (commits === 0) return t('dash.node.commitsUnreadable')
      return `${commits}+ ${t('dash.node.commits')} (${t('dash.node.commitsLowerBound')})`
    }

    function kindLabel(kind, t) {
      return labelOr(t, `kind.${kind}`, kind ?? '—')
    }

    function findStatusLabel(status, t) {
      return labelOr(t, `find.status.${status}`, status ?? '—')
    }

    function confidenceLabel(confidence, t) {
      if (typeof confidence !== 'string' || confidence === '') return null
      return {
        label: labelOr(t, `dash.confidence.${confidence}`, confidence),
        hint: labelOr(t, `dash.confidence.${confidence}.hint`, ''),
      }
    }

    function StatusGlyph({ tone, glyph, size }) {
      return h(
        'span',
        {
          style: {
            ...styles.statusGlyph,
            color: TONE[tone] ?? TONE.neutral,
            fontSize: size === 'large' ? '13px' : '11px',
          },
          'aria-hidden': 'true',
        },
        glyph,
      )
    }

    function Confidence({ value, t }) {
      const info = confidenceLabel(value, t)
      if (info === null) return null
      return h(
        'span',
        { style: styles.confidence, title: info.hint === '' ? info.label : info.hint },
        info.label,
        info.hint === '' ? null : h('span', { style: visuallyHidden }, ` (${info.hint})`),
      )
    }

    function FindingsSection({ findings, readState, t }) {
      const state = readState?.findings ?? 'missing'
      const open = Array.isArray(findings?.open) ? findings.open : []
      const total = typeof findings?.total === 'number' ? findings.total : 0
      const stale = typeof findings?.stale === 'number' ? findings.stale : 0
      const count = state === 'ready' ? String(open.length) : '—'
      const emptyRow = (text) => h('div', { style: styles.empty }, text)
      let body
      if (state === 'error') {
        body = emptyRow(t('dash.readError'))
      } else if (state === 'missing') {
        body = emptyRow(t('dash.notRecorded'))
      } else if (open.length === 0 && total === 0) {
        body = emptyRow(t('dash.noFindingsRecorded'))
      } else if (open.length === 0) {
        body = h(
          'div',
          { style: styles.empty },
          h(StatusGlyph, { tone: 'success', glyph: '✓' }),
          ' ',
          t('dash.noOpen'),
        )
      } else {
        body = h(
          'ul',
          { style: styles.findingsList },
          open.map((finding) =>
            h(
              'li',
              { key: finding.id, style: styles.findingRow },
              h(
                'span',
                {
                  style: {
                    ...styles.priority,
                    color: PRIORITY_COLOR[finding.priority] ?? T.text2,
                    background: TONE_BG[PRIORITY_TONE[finding.priority] ?? 'neutral'],
                    border: `0.5px solid ${TONE_BORDER[PRIORITY_TONE[finding.priority] ?? 'neutral']}`,
                  },
                },
                finding.priority ?? '—',
              ),
              h(
                'div',
                { style: styles.findingBody },
                h('div', { style: styles.findingTitle }, finding.title ?? finding.id),
                h(
                  'div',
                  { style: styles.findingMeta },
                  h('span', null, kindLabel(finding.kind, t)),
                  h('span', null, '·'),
                  h('span', null, `${finding.ageDays ?? 0}${t('dash.days')}`),
                  finding.status === undefined || finding.status === 'open'
                    ? null
                    : h('span', null, `· ${findStatusLabel(finding.status, t)}`),
                  (finding.ageDays ?? 0) > STALE_DAYS
                    ? h('span', { style: { color: T.warnText } }, `· ${t('dash.stale')}`)
                    : null,
                ),
              ),
            ),
          ),
        )
      }
      return h(
        'section',
        { style: styles.card, 'aria-label': t('dash.findings') },
        h(
          'div',
          { style: styles.sectionHead },
          h('h2', { style: styles.sectionTitle }, t('dash.findings')),
          h('span', { style: styles.sectionCount }, count),
          state === 'ready' && stale > 0
            ? h(
                'span',
                { style: { ...styles.sectionCount, color: T.warnText, marginLeft: 'auto' } },
                `${t('dash.stale')} ${stale}`,
              )
            : null,
        ),
        body,
      )
    }

    // ---- Radial objective tree (D85 Stage 2) ------------------------------
    //
    // The root sits at the centre; each objective is placed on a ring by depth
    // and sized by `weightMin` (active tasks + open findings). The current path
    // is drawn, so the position is read from the shape instead of a label. A
    // click opens the node's work: its tasks, its open findings, the
    // implementation paths and the docs. Nothing here is a verdict: no score,
    // no threshold, no "this branch is wrong" (D85 / D86).

    /**
     * The recall block: the text a session starts from (D108).
     *
     * It is read from the model plugin's service, not assembled here: the block
     * is what the input actually received, so the card and the prompt cannot
     * disagree about the budget, the ordering or the wording. That is also why
     * the text is shown verbatim instead of being redrawn as chips or a tree —
     * a reader who checks this card is checking the injection itself.
     *
     * The per-session bird's-eye check is not part of this text: the prompt
     * spends it once per reader, and a read-only card must not spend it. The
     * definition line says so, because an absent section would otherwise read
     * as an absent check.
     *
     * "not installed", "nothing recorded" and "could not read" stay apart (F4):
     * the card names which one it is instead of showing an empty block.
     */
    function RecallSection({ recall, t }) {
      const state = recall?.state ?? 'unavailable'
      const text = typeof recall?.text === 'string' ? recall.text : ''
      const emptyRow = (message) => h('div', { style: styles.empty }, message)

      let body
      if (state === 'unavailable') {
        body = emptyRow(t('dash.model.unavailable'))
      } else if (state === 'error') {
        body = emptyRow(
          typeof recall?.message === 'string' && recall.message !== ''
            ? recall.message
            : t('dash.readError'),
        )
      } else if (state !== 'ready' || text === '') {
        body = emptyRow(t('dash.recall.empty'))
      } else {
        body = h('pre', { style: styles.recallText }, text)
      }

      return h(
        'section',
        { style: styles.card, 'aria-label': t('dash.recall') },
        h(
          'div',
          { style: styles.sectionHead },
          h('h2', { style: styles.sectionTitle }, t('dash.recall')),
        ),
        state === 'ready' && text !== ''
          ? h('div', { style: styles.definition }, t('dash.recall.definition'))
          : null,
        body,
      )
    }

    const TREE = { w: 600, h: 520, cx: 300, cy: 260, ring: 110, step: 80 }
    const TREE_ZOOM = { min: 0.6, max: 2.5 }

    function treeKey(subject) {
      return String(subject ?? '').toLowerCase()
    }

    function treeParentKey(subject) {
      const parts = String(subject ?? '').split('/')
      if (parts.length <= 1) return null
      parts.pop()
      return parts.join('/')
    }

    function treeShortKey(subject) {
      if (treeKey(subject) === 'objective') return 'objective'
      const parts = String(subject ?? '').split('/')
      return parts[parts.length - 1]
    }

    // The label is a key, not the objective sentence: the ring is read by shape,
    // and the full value is in the panel and the accessible name. Long keys are
    // cut so they stay inside the drawing (D85).
    function treeLabelText(subject, depth) {
      const key = treeShortKey(subject)
      // The outer ring has less horizontal room, so means nodes cut sooner.
      const max = (depth ?? 0) >= 2 ? 12 : 16
      return key.length > max ? `${key.slice(0, max - 1)}…` : key
    }

    // Size is investment, not open work: a finished branch keeps the size of what
    // it took, and a big branch is not called drift (D89). The scale is relative
    // and square-rooted, so the largest branch fills the drawing, a branch with
    // no recorded work stays small, and the middle keeps its differences.
    function treeWeight(node) {
      return node?.investment?.total ?? 0
    }

    function treeRadius(node, ceiling) {
      const weight = Math.max(0, treeWeight(node))
      const top = Math.max(1, ceiling)
      return Math.min(22, Math.max(7, 7 + 15 * Math.sqrt(weight / top)))
    }

    function polar(radius, angle) {
      return { x: TREE.cx + radius * Math.cos(angle), y: TREE.cy + radius * Math.sin(angle) }
    }

    function buildRadialTree(nodes, collapsed) {
      const byKey = new Map()
      for (const node of nodes) byKey.set(treeKey(node.subject), node)
      const children = new Map()
      let root = null
      for (const node of nodes) {
        const key = treeKey(node.subject)
        // The projection carries the parent in the drawn tree (D88): objectives
        // by subject path, means nodes by the objective they serve.
        const parent =
          typeof node.parent === 'string' && node.parent !== '' ? node.parent : treeParentKey(key)
        if (parent !== null && parent !== undefined && byKey.has(parent)) {
          if (!children.has(parent)) children.set(parent, [])
          children.get(parent).push(node)
        } else if ((node.depth ?? 0) === 0) {
          root = node
        }
      }
      const placed = []
      if (root === null) return { placed, byKey, children, root }
      const openChildren = (node) =>
        collapsed.has(treeKey(node.subject)) ? [] : children.get(treeKey(node.subject)) ?? []
      const leafCount = (node) => {
        const kids = openChildren(node)
        if (kids.length === 0) return 1
        return kids.reduce((sum, kid) => sum + leafCount(kid), 0)
      }
      const place = (node, depth, start, end) => {
        const angle = (start + end) / 2
        const radius = depth === 0 ? 0 : TREE.ring + (depth - 1) * TREE.step
        placed.push({ node, depth, angle, radius })
        const kids = openChildren(node)
        if (kids.length === 0) return
        const total = kids.reduce((sum, kid) => sum + leafCount(kid), 0)
        let from = start
        for (const kid of kids) {
          const span = ((end - start) * leafCount(kid)) / total
          place(kid, depth + 1, from, from + span)
          from += span
        }
      }
      place(root, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2)
      return { placed, byKey, children, root }
    }

    function NodeDetail({ node, nodes, tasks, findings, t, onClose }) {
      const paths = Array.isArray(node.paths) ? node.paths : []
      const docs = Array.isArray(node.docs) ? node.docs : []
      const milestones = Array.isArray(node.milestones) ? node.milestones : []
      const acceptance = node.acceptance ?? { done: 0, total: 0 }
      const investment = node.investment ?? { tasks: 0, findings: 0, commits: 0, docs: 0, total: 0 }
      const stale = new Set(Array.isArray(node.stale) ? node.stale : [])
      const commitErrors = new Set(Array.isArray(node.commitErrors) ? node.commitErrors : [])
      const lastActivity = typeof node.lastActivity === 'string' ? node.lastActivity : null
      const key = treeKey(node.subject)
      const requires = Array.isArray(node.requires) ? node.requires : []
      const verifies = Array.isArray(node.verifies) ? node.verifies : []
      const serves = typeof node.serves === 'string' && node.serves !== '' ? node.serves : null
      // The reverse edges are the question a reader actually asks: if I remove
      // this, what stops working? (D88)
      const requiredBy = nodes
        .filter((candidate) =>
          (Array.isArray(candidate.requires) ? candidate.requires : []).some(
            (ref) => treeKey(ref) === key,
          ),
        )
        .map((candidate) => treeKey(candidate.subject))
      const verifiedBy = nodes
        .filter((candidate) =>
          (Array.isArray(candidate.verifies) ? candidate.verifies : []).some(
            (ref) => treeKey(ref) === key,
          ),
        )
        .map((candidate) => treeKey(candidate.subject))
      const edgeLine = (label, values) =>
        values.length === 0
          ? null
          : h('div', { style: styles.nodeEdgeLine }, `${label}: ${values.join(', ')}`)
      const hasAny =
        tasks.length > 0 ||
        findings.length > 0 ||
        paths.length > 0 ||
        docs.length > 0 ||
        milestones.length > 0 ||
        acceptance.total > 0 ||
        serves !== null ||
        requires.length > 0 ||
        verifies.length > 0 ||
        requiredBy.length > 0 ||
        verifiedBy.length > 0
      const list = (title, items) =>
        h(
          'div',
          { style: styles.nodeSection },
          h('div', { style: styles.nodeSectionTitle }, title),
          h('ul', { style: styles.nodeList }, items),
        )
      return h(
        'div',
        { style: styles.nodePanel, 'aria-label': node.subject },
        h(
          'div',
          { style: styles.nodePanelHead },
          h('span', { style: styles.nodeKey }, node.subject),
          h(Confidence, { value: node.confidence, t }),
          h(
            'button',
            {
              type: 'button',
              onClick: onClose,
              title: t('dash.node.close'),
              'aria-label': t('dash.node.close'),
              style: { ...styles.treeButton, marginLeft: 'auto' },
            },
            '×',
          ),
        ),
        h('div', { style: styles.nodeValue }, node.value),
        typeof node.description === 'string' && node.description !== ''
          ? h('div', { style: styles.findingMeta }, node.description)
          : null,
        edgeLine(t('dash.edge.serves'), serves === null ? [] : [serves]),
        edgeLine(t('dash.edge.breaks'), requiredBy),
        edgeLine(t('dash.edge.requires'), requires),
        edgeLine(t('dash.edge.verifies'), verifiedBy),
        edgeLine(t('dash.edge.targets'), verifies),
        // Investment and acceptance are two observations, never one score
        // (D89): what was poured in, and how much of the recorded acceptance is
        // met. The reader compares them.
        h(
          'div',
          { style: styles.nodeEdgeLine },
          `${t('dash.node.investment')}: ${investment.tasks} ${t('dash.tasks')} · ` +
            `${investment.findings} ${t('dash.nodeFindings')} · ` +
            `${commitText(investment, t)} · ${investment.docs} ${t('dash.node.docs')}`,
        ),
        lastActivity === null
          ? null
          : h(
              'div',
              { style: styles.nodeEdgeLine },
              `${t('dash.node.lastActivity')}: ${formatAgo(lastActivity, t)}`,
            ),
        h(
          'div',
          { style: styles.nodeSection },
          h(
            'div',
            { style: styles.nodeSectionTitle },
            `${t('dash.node.acceptance')} ${acceptance.done}/${acceptance.total}`,
          ),
          milestones.length > 0
            ? h(
                'ul',
                { style: styles.nodeList },
                milestones.map((milestone, index) =>
                  h(
                    'li',
                    { key: `milestone-${index}`, style: styles.nodeItem },
                    h(
                      'span',
                      {
                        style: {
                          flex: 'none',
                          color: milestone.done ? T.text2 : T.text3,
                        },
                      },
                      milestone.done ? '●' : '○',
                    ),
                    h('span', null, milestone.text),
                    milestone.at === undefined
                      ? null
                      : h('span', { style: styles.findingMeta }, milestone.at),
                  ),
                ),
              )
            : h(
                'div',
                { style: styles.empty },
                acceptance.total > 0
                  ? `${t('dash.node.branchAcceptance')}: ${acceptance.done}/${acceptance.total}`
                  : t('dash.node.noAcceptance'),
              ),
        ),
        tasks.length > 0
          ? list(
              t('dash.node.tasks'),
              tasks.map((task) =>
                h(
                  'li',
                  { key: task.id, style: styles.nodeItem },
                  h(
                    'span',
                    { style: { flex: 'none', color: task.current ? T.business : T.text3 } },
                    task.current ? '●' : '○',
                  ),
                  h('span', null, task.value),
                ),
              ),
            )
          : null,
        findings.length > 0
          ? list(
              t('dash.node.findings'),
              findings.map((finding) =>
                h(
                  'li',
                  { key: finding.id, style: styles.nodeItem },
                  h(
                    'span',
                    {
                      style: {
                        ...styles.priority,
                        color: PRIORITY_COLOR[finding.priority] ?? T.text2,
                        background: TONE_BG[PRIORITY_TONE[finding.priority] ?? 'neutral'],
                      },
                    },
                    finding.priority,
                  ),
                  h('span', null, finding.title),
                ),
              ),
            )
          : null,
        paths.length > 0
          ? list(
              t('dash.node.paths'),
              paths.map((path) =>
                h(
                  'li',
                  { key: path, style: styles.nodeItem },
                  h('code', { style: styles.nodeCode }, path),
                  stale.has(path)
                    ? h('span', { style: styles.findingMeta }, ` · ${t('dash.node.stale')}`)
                    : null,
                  commitErrors.has(path)
                    ? h(
                        'span',
                        { style: styles.findingMeta },
                        ` · ${t('dash.node.commitsUnreadable')}`,
                      )
                    : null,
                ),
              ),
            )
          : null,
        docs.length > 0
          ? list(
              t('dash.node.docs'),
              docs.map((path) =>
                h(
                  'li',
                  { key: path, style: styles.nodeItem },
                  h('code', { style: styles.nodeCode }, path),
                  stale.has(path)
                    ? h('span', { style: styles.findingMeta }, ` · ${t('dash.node.stale')}`)
                    : null,
                ),
              ),
            )
          : null,
        hasAny ? null : h('div', { style: styles.empty }, t('dash.node.empty')),
      )
    }

    function ObjectiveTree({ objective, currentTask, remaining, findings, t }) {
      const nodes = Array.isArray(objective?.nodes) ? objective.nodes : []
      const [selected, setSelected] = React.useState(null)
      const [focused, setFocused] = React.useState(null)
      const [collapsed, setCollapsed] = React.useState(() => new Set())
      const [query, setQuery] = React.useState('')
      const [zoom, setZoom] = React.useState(1)
      const [pan, setPan] = React.useState({ x: 0, y: 0 })
      const dragRef = React.useRef(null)
      const nodeRefs = React.useRef(new Map())

      const tree = buildRadialTree(nodes, collapsed)
      const currentKey = treeKey(currentTask?.serves)
      const needle = query.trim().toLowerCase()
      const matchKeys = new Set(
        needle === ''
          ? []
          : tree.placed
              .filter(({ node }) =>
                `${node.subject} ${node.value ?? ''}`.toLowerCase().includes(needle),
              )
              .map(({ node }) => treeKey(node.subject)),
      )
      const selectedNode =
        selected === null
          ? null
          : tree.placed.find(({ node }) => treeKey(node.subject) === selected)?.node ?? null
      const openFindings = Array.isArray(findings?.open) ? findings.open : []
      const otherTasks = Array.isArray(remaining) ? remaining : []

      const tasksOf = (subject) => {
        const key = treeKey(subject)
        const list = []
        if (
          currentTask !== null &&
          currentTask !== undefined &&
          treeKey(currentTask.serves) === key
        ) {
          list.push({ id: currentTask.id, value: currentTask.value, current: true })
        }
        for (const task of otherTasks) {
          if (treeKey(task.serves) === key) {
            list.push({ id: task.id, value: task.value, current: false })
          }
        }
        return list
      }
      const findingsOf = (subject) => {
        const key = treeKey(subject)
        return openFindings.filter((finding) => treeKey(finding.node) === key)
      }

      const parentOf = (key) => {
        const node = tree.byKey.get(key)
        if (node !== undefined && typeof node.parent === 'string' && node.parent !== '') {
          return node.parent
        }
        return treeParentKey(key)
      }

      const visibleChildren = (key) =>
        tree.placed
          .filter((item) => treeParentKey(treeKey(item.node.subject)) === key)
          .map((item) => treeKey(item.node.subject))

      const focusNode = (key) => {
        const element = nodeRefs.current.get(key)
        if (element !== undefined && element !== null && typeof element.focus === 'function') {
          element.focus()
        }
      }

      const moveFocus = (event, key) => {
        const parent = parentOf(key)
        let next = null
        if (event.key === 'ArrowUp') {
          next = parent
        } else if (event.key === 'ArrowDown') {
          next = visibleChildren(key)[0] ?? null
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          const siblings = parent === null ? [key] : visibleChildren(parent)
          const index = siblings.indexOf(key)
          next =
            event.key === 'ArrowRight'
              ? siblings[index + 1] ?? null
              : index > 0
                ? siblings[index - 1]
                : null
        }
        if (next !== null && next !== undefined && next !== key) {
          event.preventDefault()
          focusNode(next)
        }
      }

      const toggleCollapsed = (key) => {
        setCollapsed((current) => {
          const next = new Set(current)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return next
        })
      }

      const zoomBy = (factor) =>
        setZoom((value) => {
          const next = Math.round(value * factor * 100) / 100
          return Math.min(TREE_ZOOM.max, Math.max(TREE_ZOOM.min, next))
        })

      const onPointerDown = (event) => {
        if (typeof event.button === 'number' && event.button !== 0) return
        // A drag that starts on a node would capture the pointer and retarget
        // the click to the canvas, so the node's click would never fire. Pan
        // only from the background.
        const target = event.target
        if (
          target !== null &&
          typeof target.closest === 'function' &&
          target.closest('[role="treeitem"]') !== null
        ) {
          return
        }
        dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
        if (typeof event.currentTarget.setPointerCapture === 'function') {
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            // A synthetic event has no pointer to capture; the drag still works
            // while the pointer stays over the tree.
          }
        }
      }
      const onPointerMove = (event) => {
        const drag = dragRef.current
        if (drag === null) return
        setPan({
          x: drag.panX + (event.clientX - drag.x),
          y: drag.panY + (event.clientY - drag.y),
        })
      }
      const onPointerUp = () => {
        dragRef.current = null
      }

      const edges = []
      const marks = []
      const maxWeight = tree.placed.reduce((max, item) => Math.max(max, treeWeight(item.node)), 0)
      for (const item of tree.placed) {
        const key = treeKey(item.node.subject)
        const point = polar(item.radius, item.angle)
        const parent = parentOf(key)
        if (parent !== null) {
          const parentItem = tree.placed.find(
            (candidate) => treeKey(candidate.node.subject) === parent,
          )
          if (parentItem !== undefined) {
            const from = polar(parentItem.radius, parentItem.angle)
            const onPath = item.node.current === true && parentItem.node.current === true
            edges.push(
              h('line', {
                key: `edge-${key}`,
                x1: from.x,
                y1: from.y,
                x2: point.x,
                y2: point.y,
                style: onPath ? styles.treeEdgeCurrent : styles.treeEdge,
              }),
            )
          }
        }
        const radius = treeRadius(item.node, maxWeight)
        const acceptance = item.node.acceptance ?? { done: 0, total: 0 }
        const investment = item.node.investment ?? { total: 0 }
        const circumference = 2 * Math.PI * (radius + 3)
        const cos = Math.cos(item.angle)
        const sin = Math.sin(item.angle)
        const labelRadius = item.radius + radius + 10
        const labelX = item.radius === 0 ? TREE.cx : TREE.cx + labelRadius * cos
        const labelY = item.radius === 0 ? TREE.cy + radius + 16 : TREE.cy + labelRadius * sin + 4
        const anchor = item.radius === 0 ? 'middle' : cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle'
        const onPath = item.node.current === true
        const isCurrent = currentKey !== '' && key === currentKey
        const isSelected = selected === key
        const isMatch = matchKeys.has(key)
        const dim = needle !== '' && !isMatch
        const childCount = (tree.children.get(key) ?? []).length
        const label = treeShortKey(item.node.subject)
        const labelText = treeLabelText(item.node.subject, item.depth)
        marks.push(
          h(
            'g',
            {
              key,
              ref: (element) => {
                if (element === null || element === undefined) nodeRefs.current.delete(key)
                else nodeRefs.current.set(key, element)
              },
              role: 'treeitem',
              tabIndex: 0,
              'aria-level': item.depth + 1,
              'aria-selected': isSelected,
              'aria-expanded': childCount > 0 ? !collapsed.has(key) : undefined,
              'aria-label': `${label} (${item.node.kind === 'component' ? t('dash.kind.component') : t('dash.kind.objective')}): ${item.node.value ?? ''} — ${item.node.tasks ?? 0} ${t('dash.tasks')}, ${item.node.findings ?? 0} ${t('dash.nodeFindings')} · ${t('dash.node.investment')} ${investment.total}${investment.commitState === 'unavailable' ? ` (${t('dash.node.commitsLowerBound')})` : ''} · ${t('dash.node.acceptance')} ${acceptance.done}/${acceptance.total}${onPath ? ` · ${t('dash.currentPath')}` : ''}`,
              style: { cursor: 'pointer', opacity: dim ? 0.3 : 1 },
              onClick: () => setSelected(key),
              onDoubleClick: () => {
                if (childCount > 0) toggleCollapsed(key)
              },
              onFocus: () => setFocused(key),
              onBlur: () => setFocused((value) => (value === key ? null : value)),
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelected(key)
                } else if (event.key === 'Escape') {
                  setSelected(null)
                } else {
                  moveFocus(event, key)
                }
              },
            },
            h('circle', { cx: point.x, cy: point.y, r: Math.max(radius + 6, 12), fill: 'transparent' }),
            focused === key
              ? h('circle', {
                  cx: point.x,
                  cy: point.y,
                  r: radius + 6,
                  fill: 'none',
                  stroke: T.business,
                  strokeWidth: 1,
                  strokeDasharray: '3 2',
                })
              : null,
            h('circle', {
              cx: point.x,
              cy: point.y,
              r: radius,
              fill: onPath
                ? NODE_FILL_CURRENT
                : item.node.kind === 'component'
                  ? NODE_FILL_COMPONENT
                  : NODE_FILL,
              stroke: isSelected || isMatch ? T.business : onPath ? NODE_STROKE_CURRENT : NODE_STROKE,
              strokeWidth: isSelected ? 2 : onPath ? 1.5 : 1,
            }),
            // Acceptance ring (D89): the share of the branch's recorded
            // acceptance items that are met. It is a record, not a status: the
            // colour is the neutral label colour, never a verdict colour.
            acceptance.total > 0
              ? h('circle', {
                  key: 'acceptance-track',
                  cx: point.x,
                  cy: point.y,
                  r: radius + 3,
                  fill: 'none',
                  stroke: T.track,
                  strokeWidth: 2,
                })
              : null,
            acceptance.total > 0
              ? h('circle', {
                  key: 'acceptance-done',
                  cx: point.x,
                  cy: point.y,
                  r: radius + 3,
                  fill: 'none',
                  stroke: T.text2,
                  strokeWidth: 2,
                  strokeDasharray: `${(acceptance.done / acceptance.total) * circumference} ${circumference}`,
                  transform: `rotate(-90 ${point.x} ${point.y})`,
                })
              : null,
            isCurrent
              ? h('circle', {
                  cx: point.x,
                  cy: point.y,
                  r: radius + 4,
                  fill: 'none',
                  stroke: T.business,
                  strokeWidth: 1,
                })
              : null,
            h(
              'text',
              {
                x: labelX,
                y: labelY,
                textAnchor: anchor,
                style: onPath ? { ...styles.treeLabel, ...styles.treeLabelCurrent } : styles.treeLabel,
              },
              labelText,
            ),
            treeWeight(item.node) > 0
              ? h(
                  'text',
                  { x: labelX, y: labelY + 11, textAnchor: anchor, style: styles.treeCount },
                  `${item.node.tasks ?? 0}·${item.node.findings ?? 0}`,
                )
              : null,
            collapsed.has(key) && childCount > 0
              ? h(
                  'text',
                  { x: labelX, y: labelY - 10, textAnchor: anchor, style: styles.treeCount },
                  phrase(t, 'dash.tree.collapsed', { n: childCount }),
                )
              : null,
          ),
        )
      }

      // `requires` edges (D88): dashed arcs between means nodes, drawn under
      // the hierarchy edges. They carry the "what breaks if this is removed"
      // structure that a tree cannot show.
      for (const item of tree.placed) {
        const key = treeKey(item.node.subject)
        const requires = Array.isArray(item.node.requires) ? item.node.requires : []
        for (const target of requires) {
          const targetItem = tree.placed.find(
            (candidate) => treeKey(candidate.node.subject) === treeKey(target),
          )
          if (targetItem === undefined) continue
          const from = polar(item.radius, item.angle)
          const to = polar(targetItem.radius, targetItem.angle)
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2
          const bendX = TREE.cx + (midX - TREE.cx) * 0.55
          const bendY = TREE.cy + (midY - TREE.cy) * 0.55
          edges.push(
            h('path', {
              key: `requires-${key}-${treeKey(target)}`,
              d: `M${from.x},${from.y} Q${bendX},${bendY} ${to.x},${to.y}`,
              style: styles.treeEdgeRequires,
            }),
          )
        }
      }

      const currentPathText =
        currentKey === '' ? t('dash.noCurrentTask') : currentKey.split('/').join(' › ')
      const rootWeight = tree.root?.tasks ?? 0
      const rootFindings = tree.root?.findings ?? 0
      const rootAcceptance = tree.root?.acceptance ?? { done: 0, total: 0 }

      return h(
        'div',
        { style: styles.treeRow },
        h(
          'div',
          { style: styles.treeColumn },
          h(
            'div',
            { style: styles.treeToolbar },
          h('input', {
            type: 'search',
            value: query,
            placeholder: t('dash.tree.search'),
            'aria-label': t('dash.tree.search'),
            onChange: (event) => setQuery(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter' && matchKeys.size > 0) {
                setSelected(matchKeys.values().next().value)
              }
            },
            style: styles.treeSearch,
          }),
          needle === ''
            ? null
            : h(
                'span',
                { style: styles.treeHint },
                matchKeys.size === 0
                  ? t('dash.tree.noMatch')
                  : phrase(t, 'dash.tree.searchCount', {
                      n: matchKeys.size,
                      total: tree.placed.length,
                    }),
              ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => zoomBy(1.25),
              title: t('dash.tree.zoomIn'),
              'aria-label': t('dash.tree.zoomIn'),
              style: styles.treeButton,
            },
            '＋',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => zoomBy(0.8),
              title: t('dash.tree.zoomOut'),
              'aria-label': t('dash.tree.zoomOut'),
              style: styles.treeButton,
            },
            '−',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              },
              title: t('dash.tree.zoomReset'),
              'aria-label': t('dash.tree.zoomReset'),
              style: styles.treeButton,
            },
            '⟲',
          ),
        ),
        h(
          'div',
          {
            style: styles.treeWrap,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
          },
          h(
            'div',
            {
              style: {
                ...styles.treeCanvas,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              },
            },
            h(
              'svg',
              {
                viewBox: `0 0 ${TREE.w} ${TREE.h}`,
                style: styles.treeSvg,
                role: 'tree',
                'aria-label': t('dash.objective'),
              },
              edges,
              marks,
            ),
          ),
        ),
          h('div', { style: styles.treeHint }, t('dash.tree.size')),
        ),
        h(
          'div',
          { style: styles.nodeColumn },
          selectedNode === null
            ? h(
                'div',
                { style: styles.nodePanel },
                h('div', { style: styles.nodeSectionTitle }, t('dash.currentPath')),
                // The breadcrumb is the same position the ring shows; it is the
                // text form for a reader who does not read the shape first (D85).
                h('div', { style: styles.nodeValue }, currentPathText),
                h(
                  'div',
                  { style: styles.findingMeta },
                  `${tree.placed.length} ${t('dash.nodes')} · ${rootWeight} ${t('dash.tasks')} · ${rootFindings} ${t('dash.nodeFindings')} · ` +
                    `${t('dash.node.acceptance')} ${rootAcceptance.done}/${rootAcceptance.total}`,
                ),
              )
            : h(NodeDetail, {
                node: selectedNode,
                nodes: tree.placed.map((item) => item.node),
                tasks: tasksOf(selectedNode.subject),
                findings: findingsOf(selectedNode.subject),
                t,
                onClose: () => setSelected(null),
              }),
        ),
      )
    }

    // The objective is the whole picture, so it gets the full width and its own
    // row: the tree on the left, the selected node's work on the right (D85).
    // The current task stays its own card below, because it is the one line the
    // reader needs even when no node is selected.
    function ObjectiveSection({ objective, currentTask, remaining, findings, readState, t }) {
      const root = objective?.root ?? null
      // The tree is drawn from the graph only (D97 / D98): the empty state
      // follows the graph's state, not a second ledger.
      const treeState =
        readState?.tree === 'graph' ? 'ready' : readState?.graph === 'error' ? 'error' : 'missing'
      const emptyText = (readyText) =>
        treeState === 'error'
          ? t('dash.readError')
          : treeState === 'missing'
            ? readState?.graph === 'unavailable'
              ? t('dash.model.unavailable')
              : t('dash.notRecorded')
            : t(readyText)
      return h(
        'section',
        { style: styles.card, 'aria-label': t('dash.objective') },
        h(
          'div',
          { style: styles.sectionHead },
          h('h2', { style: styles.sectionTitle }, t('dash.objective')),
          root === null ? null : h(Confidence, { value: root.confidence, t }),
        ),
        root === null
          ? h('div', { style: styles.empty }, emptyText('dash.noObjective'))
          : h(
              React.Fragment,
              null,
              h(
                'div',
                { style: styles.objectiveRoot },
                h('div', { style: styles.objectiveValue }, root.value),
                typeof root.description === 'string' && root.description !== ''
                  ? h('div', { style: styles.findingMeta }, root.description)
                  : null,
                // The root's own weight: how many active tasks and open
                // findings the whole objective carries (D84).
                h(
                  'div',
                  { style: styles.findingMeta },
                  `${root.tasks ?? 0} ${t('dash.tasks')} · ${root.findings ?? 0} ${t('dash.nodeFindings')} · ` +
                    `${t('dash.node.acceptance')} ${root.acceptance?.done ?? 0}/${root.acceptance?.total ?? 0}`,
                ),
              ),
              h(ObjectiveTree, { objective, currentTask, remaining, findings, t }),
            ),
      )
    }

    function CurrentTaskSection({ currentTask, remaining, unlinkedTasks, readState, t }) {
      const treeState =
        readState?.tree === 'graph' ? 'ready' : readState?.graph === 'error' ? 'error' : 'missing'
      const hasTask = currentTask !== null && currentTask !== undefined
      const tasks = Array.isArray(remaining) ? remaining : []
      const unlinked = typeof unlinkedTasks === 'number' ? unlinkedTasks : 0
      const emptyText = (readyText) =>
        treeState === 'error'
          ? t('dash.readError')
          : treeState === 'missing'
            ? readState?.graph === 'unavailable'
              ? t('dash.model.unavailable')
              : t('dash.notRecorded')
            : t(readyText)
      return h(
        'section',
        { style: styles.card, 'aria-label': t('dash.currentTask') },
        h(
          'div',
          { style: styles.sectionHead },
          h('h2', { style: styles.sectionTitle }, t('dash.currentTask')),
          hasTask ? h(Confidence, { value: currentTask.confidence, t }) : null,
        ),
        hasTask
          ? h(
              React.Fragment,
              null,
              h('div', { style: styles.taskValue, title: currentTask.value }, currentTask.value),
              typeof currentTask.description === 'string' && currentTask.description !== ''
                ? h('div', { style: styles.findingMeta }, currentTask.description)
                : null,
              // The explicit link replaces the reader's memory of why this
              // task is being done (D84).
              h(
                'div',
                {
                  style:
                    currentTask.serves === null || currentTask.serves === undefined
                      ? styles.unlinkedNote
                      : styles.taskServes,
                },
                currentTask.serves === null || currentTask.serves === undefined
                  ? t('dash.unlinked')
                  : `→ ${currentTask.serves}`,
              ),
              h(
                'div',
                { style: { ...styles.findingMeta, marginTop: '4px' } },
                typeof (currentTask.updatedAt ?? currentTask.createdAt) === 'string'
                  ? h(
                      'span',
                      null,
                      `${t('dash.updated')} ${formatAgo(currentTask.updatedAt ?? currentTask.createdAt, t)}`,
                    )
                  : null,
              ),
            )
          : h('div', { style: styles.empty }, emptyText('dash.noCurrentTask')),
        // The other open work is a set of tasks (D84). Absence is still not
        // evidence of completeness: an empty list says what is recorded, not
        // that nothing remains (D66 / D79).
        h(
          React.Fragment,
          null,
          h('div', { style: styles.remainingLabel }, t('dash.remaining')),
          tasks.length > 0
            ? h(
                'ul',
                { style: styles.remainingList },
                tasks.map((task) =>
                  h(
                    'li',
                    { key: task.id, style: styles.remainingItem },
                    h(
                      'span',
                      { style: task.serves == null ? styles.unlinkedNote : styles.remainingServes },
                      task.serves == null ? t('dash.unlinked') : task.serves,
                    ),
                    h('span', { style: styles.taskValue, title: task.value }, task.value),
                  ),
                ),
              )
            : h(
                'div',
                {
                  style: styles.empty,
                  title: treeState === 'ready' ? t('dash.noRemaining.hint') : undefined,
                },
                emptyText('dash.noOtherTasks'),
              ),
          unlinked > 0
            ? h('div', { style: styles.unlinkedNote }, `${t('dash.unlinked')} ${unlinked}`)
            : null,
        ),
      )
    }

    function DashboardView(props) {
      const t = translate(props)
      const data = props.useProjection('dashboard')
      const rootRef = React.useRef(null)
      React.useEffect(() => {
        // Start at the top of the dashboard. Only this element's own scroll is
        // reset: `scrollIntoView` also scrolled the ring that holds the view
        // tabs, which pushed the tab bar out of the window (2026-11-20).
        if (rootRef.current !== null) rootRef.current.scrollTop = 0
      }, [])
      if (data === undefined) {
        return h(
          'div',
          { ref: rootRef, style: styles.view },
          h(
            'div',
            { style: styles.emptyState },
            h('div', { style: styles.emptyTitle }, t('dash.title')),
            h('div', { style: styles.empty }, t('dash.loading')),
          ),
        )
      }
      if (data.workspace === null) {
        return h(
          'div',
          { ref: rootRef, style: styles.view },
          h(
            'div',
            { style: styles.emptyState },
            h('div', { style: styles.emptyTitle }, t('dash.title')),
            h('div', { style: styles.empty }, t('dash.noWorkspace')),
          ),
        )
      }

      const readState = data.readState
      const objective = data.objective
      const findings = data.findings
      const nodes = Array.isArray(objective?.nodes) ? objective.nodes : []
      const currentTask = data.currentTask
      const remaining = data.remaining
      const objectiveRoot = objective?.root

      return h(
        'div',
        { ref: rootRef, style: styles.view },
        h('h1', { style: visuallyHidden }, t('dash.title')),
        h(ObjectiveSection, {
          objective: { root: objectiveRoot, nodes },
          currentTask,
          remaining,
          readState,
          findings,
          t,
        }),
        h(CurrentTaskSection, {
          currentTask,
          remaining,
          unlinkedTasks: data.unlinkedTasks,
          readState,
          t,
        }),
        h(FindingsSection, { findings, readState, t }),
        h(RecallSection, { recall: data.recall, t }),
        h(
          'p',
          { style: visuallyHidden },
          `${t('dash.title')}: ${t('dash.objective')} ${nodes.length} ${t('dash.nodes')} · ${t('dash.findings')} ${findings?.open?.length ?? 0}`,
        ),
      )
    }

    class DashboardBuilder {
      constructor() {
        this.empty = {}
      }

      replace() {
        return this.empty
      }

      apply() {
        return this.empty
      }
    }

    return {
      inject: ['slots', 'locale', 'uiConversation'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register(NS, { zh, en, ja }),
          'cognitive-dashboard: dictionaries',
        )
        const t = ctx.locale.bind(NS)
        ctx.uiConversation.views.register({
          target: 'dashboard',
          create: () => new DashboardBuilder(),
        })
        ctx.slots.inject('conversation.view', () =>
          ctx.slots.register(
            {
              name: 'conversation.view',
              id: 'dashboard',
              order: 20,
              locale: NS,
              label: () => t('view.dashboard'),
            },
            DashboardView,
          ),
        )
      },
    }
  },
})
