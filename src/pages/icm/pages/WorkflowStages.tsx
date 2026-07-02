import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronDown, ClipboardList, Download, FilePlus2, FileText, Play, Search, Send, UploadCloud, X } from 'lucide-react'

import {
  agents,
  dataCollect,
  dispatch,
  evidences,
  findings,
  issues,
  plans,
  rectifications,
  reports,
  rules,
  tasks,
  toneByStatus,
  walkthrough,
  workpapers,
} from '../data'
import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Segmented, StepList, Tag, Toolbar, type Tone } from '../components/IcmPageKit'

type DataTab = 'demand' | 'quality' | 'rules'
type ReviewTab = 'rules' | 'walkthrough' | 'confirm'
type RectifyTab = 'plan' | 'proof' | 'report'
type ReportModal = 'materials' | 'templates' | null
type ReportFlow = 'editing' | 'drafted' | 'ledger' | 'reviewing' | 'approved' | 'archived'

function statusTone(status: string): Tone {
  return toneByStatus(status) as Tone
}

function SectionTitle({ children }: { children: string }) {
  return <div className="icm-subsection-head"><div className="icm-card-title">{children}</div></div>
}

function WorkflowLayout({ side, main }: { side: React.ReactNode; main: React.ReactNode }) {
  return (
    <div className="icm-workflow-layout">
      <div className="icm-workflow-side">{side}</div>
      <div className="icm-workflow-main">{main}</div>
    </div>
  )
}

const planPool = [
  {
    ...plans[0],
    source: '年度计划',
    status: '待分解',
    blocker: '待执行任务分解',
    next: '任务分解',
  },
  {
    id: 'PL-2026-014',
    name: '供应商关联交易风险专项检查',
    type: '风险触发',
    status: '待校审',
    unit: '华东装备制造有限公司',
    owner: '李娜',
    period: '2026-07-05 至 2026-08-05',
    basis: '风险预警事件、供应商管理细则、关联交易管理办法',
    objective: '核验供应商关联关系、异常交易和审批留痕是否完整。',
    riskTheme: '供应商关联风险',
    source: '风险预警',
    blocker: '待提交线上校审',
    next: '提交审批流',
    approvals: [
      { node: '风险预警触发', owner: '风险驾驶舱', status: '通过', date: '2026-07-01', opinion: '红色预警已触发专项检查建议。' },
      { node: '内控负责人校审', owner: '郑刚', status: '待处理', date: '-', opinion: '待确认检查范围与抽样口径。' },
      { node: '分管领导校审', owner: '赵总', status: '待处理', date: '-', opinion: '待线上校审通过后立项生效。' },
    ],
  },
  {
    id: 'PL-2026-021',
    name: '资金支付审批链抽查计划',
    type: '审计同步',
    status: '已派发',
    unit: '财务共享中心',
    owner: '王锐',
    period: '2026-06-18 至 2026-07-20',
    basis: '审计计划同步、资金支付制度第 8 条',
    objective: '复核大额支付审批链完整性和超比例付款情况。',
    riskTheme: '资金支付风险',
    source: '审计计划',
    blocker: '无阻塞',
    next: '查看执行',
    approvals: [
      { node: '审计计划同步', owner: '审计部', status: '通过', date: '2026-06-18', opinion: '已纳入年度审计协同计划。' },
      { node: '任务派发', owner: '检查组', status: '通过', date: '2026-06-20', opinion: '已派发至财务共享中心。' },
    ],
  },
  {
    id: 'PL-2026-032',
    name: '境外投资项目内控专项检查计划',
    type: '手工创建',
    status: '草稿',
    unit: '国际业务事业部',
    owner: '赵明',
    period: '2026-08-01 至 2026-09-15',
    basis: '15号文穿透监管要求、境外投资管理办法',
    objective: '验证境外投资项目数据回传、授权审批和风险预警专岗配置情况。',
    riskTheme: '境外投资监管',
    source: '手工创建',
    blocker: '计划范围待完善',
    next: '完善计划详情',
    approvals: [
      { node: '计划草拟', owner: '赵明', status: '进行中', date: '2026-07-01', opinion: '检查范围和系统清单待补充。' },
      { node: '内控负责人校审', owner: '郑刚', status: '未提交', date: '-', opinion: '完善后提交线上校审。' },
    ],
  },
]

const splitSteps = ['读取计划范围', '匹配检查规则', '生成任务包', '生成资料清单', '生成派发对象']

export function PlanDispatchStage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [selectedPlanId, setSelectedPlanId] = useState(planPool[0]?.id)
  const [importedPlans, setImportedPlans] = useState<typeof planPool>([])
  const [reviewedIds, setReviewedIds] = useState<string[]>([])
  const [submittedReviewIds, setSubmittedReviewIds] = useState<string[]>([])
  const [splitIds, setSplitIds] = useState<string[]>([])
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [dispatchedIds, setDispatchedIds] = useState<string[]>(['PL-2026-021'])
  const [taskBookIds, setTaskBookIds] = useState<string[]>([])
  const [splitting, setSplitting] = useState(false)
  const [splitIndex, setSplitIndex] = useState(-1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sourceFilter, setSourceFilter] = useState('全部来源')
  const [createOpen, setCreateOpen] = useState(false)

  /** 新建计划表单（按 SRS 模块一 1.1-1.4 设计字段） */
  const [createForm, setCreateForm] = useState({
    name: '',
    type: '专项抽查',
    unit: '',
    periodStart: '',
    periodEnd: '',
    basis: '',
    objective: '',
    riskTheme: '',
    owner: '',
    reviewer: '',
    checkDomain: '采购',
    needBoard: false,
    needParty: true,
    externalExpert: '',
  })

  const resetCreateForm = () => setCreateForm({
    name: '', type: '专项抽查', unit: '', periodStart: '', periodEnd: '',
    basis: '', objective: '', riskTheme: '', owner: '', reviewer: '', checkDomain: '采购',
    needBoard: false, needParty: true, externalExpert: '',
  })

  const handleCreateSave = () => {
    if (!createForm.name.trim() || !createForm.unit.trim()) return
    const now = new Date()
    const idSuffix = String(importedPlans.length + 1).padStart(3, '0')
    const id = `PL-${now.getFullYear()}-${idSuffix}`
    const period = createForm.periodStart && createForm.periodEnd
      ? `${createForm.periodStart} 至 ${createForm.periodEnd}`
      : '待确定'
    const approvals: typeof planPool[number]['approvals'] = []
    if (createForm.needParty) {
      approvals.push({ node: '党委前置研究校验', owner: '党委办公室', status: '待确认', date: '-', opinion: '新建计划后需完成前置审核。' })
    }
    if (createForm.needBoard) {
      approvals.push({ node: '董事会审批', owner: '董事会办公室', status: '待处理', date: '-', opinion: '穿透监管测试类计划需董事会审议。' })
    }
    approvals.push({ node: '内控负责人校审', owner: createForm.reviewer || '待分配', status: '待处理', date: '-', opinion: '需线上确认检查范围和依据。' })

    const newPlan = {
      id,
      name: createForm.name.trim(),
      type: createForm.type,
      status: '待校审',
      unit: createForm.unit.trim(),
      owner: createForm.owner.trim() || '当前用户',
      period,
      basis: createForm.basis.trim() || '待补充',
      objective: createForm.objective.trim() || '待填写',
      riskTheme: createForm.riskTheme.trim() || `${createForm.checkDomain}风险`,
      source: '手工创建',
      blocker: '待提交线上校审',
      next: '提交审批流',
      approvals,
    }
    setImportedPlans((items) => [newPlan, ...items])
    resetCreateForm()
    setCreateOpen(false)
  }

  const plansForView = [...importedPlans, ...planPool]
  const selected = plansForView.find((plan) => plan.id === selectedPlanId) ?? plansForView[0]

  const isReviewed = reviewedIds.includes(selected.id) || selected.status === '待分解' || selected.status === '已派发'
  const isSplit = splitIds.includes(selected.id) || selected.status === '已派发'
  const isAssigned = assignedIds.includes(selected.id)
  const isDispatched = dispatchedIds.includes(selected.id)
  const hasTaskBook = taskBookIds.includes(selected.id)
  const currentStatus = isDispatched ? '已派发' : isSplit ? '待派发' : isReviewed ? '待分解' : selected.status
  const isDraft = currentStatus === '草稿'
  const isReviewSubmitted = submittedReviewIds.includes(selected.id)
  const showReviewStatus = isReviewSubmitted && !isSplit && !isDispatched
  const showActionCard = !isDraft && !isDispatched

  const planDisplayStatus = (plan: (typeof planPool)[number]) => (
    dispatchedIds.includes(plan.id)
      ? '已派发'
      : splitIds.includes(plan.id)
        ? '待派发'
        : reviewedIds.includes(plan.id)
          ? '待分解'
          : plan.status
  )

  const filteredPlans = plansForView.filter((plan) => {
    const matchSource = sourceFilter === '全部来源' || plan.source === sourceFilter
    const keyword = searchKeyword.trim()
    const matchKeyword = !keyword || `${plan.id}${plan.name}${plan.unit}${plan.owner}${plan.source}`.includes(keyword)
    return matchSource && matchKeyword
  })

  const sortPlans = [...filteredPlans].sort((a, b) => {
    const statusOrder = ['待校审', '草稿', '待分解', '待派发', '已派发']
    const aIndex = statusOrder.indexOf(planDisplayStatus(a))
    const bIndex = statusOrder.indexOf(planDisplayStatus(b))
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
  })

  const submitReview = () => {
    setSubmittedReviewIds((ids) => Array.from(new Set([...ids, selected.id])))
    window.setTimeout(() => {
      setReviewedIds((ids) => Array.from(new Set([...ids, selected.id])))
    }, 900)
  }

  const splitTasks = () => {
    if (splitting) return
    setSplitting(true)
    setSplitIndex(0)
    splitSteps.forEach((_, index) => {
      window.setTimeout(() => setSplitIndex(index), 520 * (index + 1))
    })
    window.setTimeout(() => {
      setSplitting(false)
      setSplitIds((ids) => Array.from(new Set([...ids, selected.id])))
      setAssignedIds((ids) => ids.filter((id) => id !== selected.id))
    }, 520 * (splitSteps.length + 1))
  }

  const assignPeople = () => {
    setAssignedIds((ids) => Array.from(new Set([...ids, selected.id])))
  }

  const dispatchTasks = () => {
    setDispatchedIds((ids) => Array.from(new Set([...ids, selected.id])))
  }

  const generateTaskBook = () => {
    setTaskBookIds((ids) => Array.from(new Set([...ids, selected.id])))
  }

  const importPlanFile = (file?: File) => {
    if (!file) return
    const nextId = `PL-IMPORT-${String(importedPlans.length + 1).padStart(3, '0')}`
    const importedPlan = {
      id: nextId,
      name: file.name.replace(/\.[^.]+$/, '') || '导入计划',
      type: '文件导入',
      status: '待校审',
      unit: '自动识别单位',
      owner: '当前用户',
      period: '2026-07-01 至 2026-08-15',
      basis: `文件导入：${file.name}`,
      objective: '检查对象、检查范围、依据和资料需求待线上校审确认。',
      riskTheme: '导入计划识别',
      source: '文件导入',
      blocker: '待提交线上校审',
      next: '提交审批流',
      approvals: [
        { node: '文件解析', owner: '内控系统', status: '通过', date: '2026-07-01', opinion: `${file.name} 计划字段待确认。` },
        { node: '内控负责人校审', owner: '郑刚', status: '待处理', date: '-', opinion: '待确认计划字段。' },
      ],
    }
    setImportedPlans((items) => [importedPlan, ...items])
    setSelectedPlanId(nextId)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const exportPlanList = () => {
    const rows = filteredPlans.map((plan) => [
      plan.id,
      plan.name,
      plan.type,
      plan.unit,
      plan.owner,
      plan.period,
      plan.source,
      planDisplayStatus(plan),
    ])
    const csv = ['计划编号,计划名称,检查类型,受检单位,负责人,计划周期,来源,状态']
      .concat(rows.map((row) => row.map((cell) => `"${cell}"`).join(',')))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '内控检查计划列表.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const navigateToDetail = (planId: string) => {
    setSelectedPlanId(planId)
    setViewMode('detail')
  }

  const backToList = () => {
    setViewMode('list')
  }

  /* ======== 列表视图 ======== */
  if (viewMode === 'list') {
    return (
      <PageFrame
        title="计划与派发"
        subtitle="计划列表展示不同来源与状态；点击计划进入详情，执行校审、任务分解与派单。"
        actions={
          <>
            <input
              ref={fileInputRef}
              style={{ display: 'none' }}
              type="file"
              accept=".doc,.docx,.xls,.xlsx,.pdf"
              onChange={(event) => importPlanFile(event.target.files?.[0])}
            />
            <Button type="info-soft" icon={<UploadCloud size={15} />} onClick={() => fileInputRef.current?.click()}>导入</Button>
            <Button type="info-soft" icon={<Download size={15} />} onClick={exportPlanList}>导出</Button>
            <Button type="primary" icon={<FilePlus2 size={15} />} onClick={() => { resetCreateForm(); setCreateOpen(true) }}>新建计划</Button>
          </>
        }
      >
        <Toolbar>
          <Search size={16} color="#607089" />
          <input className="icm-input" placeholder="搜索计划编号、名称、单位、负责人" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} />
          <select className="icm-select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option>全部来源</option>
            <option>年度计划</option>
            <option>风险预警</option>
            <option>审计计划</option>
            <option>文件导入</option>
          </select>
          <Tag tone="blue">共 {filteredPlans.length} 条</Tag>
        </Toolbar>

        <Card title="计划列表" note="点击任意行进入计划详情与派发操作">
          <DataTable
            columns={['计划编号', '计划名称', '检查类型', '受检单位', '负责人', '计划周期', '来源', '状态', '操作']}
            rows={sortPlans.map((plan) => {
              const displayStatus = planDisplayStatus(plan)
              return [
                plan.id,
                plan.name,
                plan.type,
                plan.unit,
                plan.owner,
                plan.period,
                plan.source,
                <span className={`icm-plan-status icm-plan-status-${statusTone(displayStatus)}`}><i />{displayStatus}</span>,
                <div className="icm-row-actions">
                  <button type="button" onClick={() => navigateToDetail(plan.id)}>查看详情</button>
                </div>,
              ]
            })}
          />
        </Card>
      </PageFrame>
    )
  }

  /* ======== 详情视图 ======== */
  return (
    <PageFrame
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={backToList}>返回列表</Button>
          <span>计划详情</span>
        </span>
      }
      subtitle={`${selected.id} · ${selected.source}`}
      actions={
        <>
          <span className={`icm-plan-status icm-plan-status-${statusTone(currentStatus)}`} style={{ marginRight: 8 }}><i />{currentStatus}</span>
          <Button type="primary" icon={<FilePlus2 size={15} />}>新建计划</Button>
        </>
      }
    >
      <Card
        title="计划详情"
        note={`${selected.id} · ${selected.source}`}
      >
        <div className="icm-grid cols-2">
          <DetailLine label="计划名称" value={selected.name} />
          <DetailLine label="检查类型" value={selected.type} />
          <DetailLine label="受检单位" value={selected.unit} />
          <DetailLine label="计划周期" value={selected.period} />
          <DetailLine label="风险主题" value={selected.riskTheme} />
          <DetailLine label="计划来源" value={selected.source} />
          <DetailLine label="当前状态" value={<Tag tone={statusTone(currentStatus)}>{currentStatus}</Tag>} />
          <DetailLine label="阻塞点" value={selected.blocker} />
          <DetailLine label="下一步" value={isDispatched ? '进入检查执行' : isSplit ? '任务派单 / 生成检查任务书' : isReviewed ? '任务分解' : selected.next} />
          <DetailLine label="检查目标" value={selected.objective} />
          <DetailLine label="资料需求" value={isSplit ? '5 类，已纳入分解结果' : '5 类，待分解生成'} />
        </div>
      </Card>

      {showActionCard ? (
        <Card
          title={showReviewStatus ? '校审状态' : isReviewed ? '任务分解' : '线上校审'}
          action={
            isReviewed ? (
              <Button type="primary" icon={<Send size={15} />} loading={splitting} onClick={splitTasks}>
                {isSplit ? '重新分解' : '任务分解'}
              </Button>
            ) : isReviewSubmitted ? (
              <Tag tone="blue">校审中</Tag>
            ) : (
              <Button type="primary" icon={<Send size={15} />} onClick={submitReview}>提交审批流</Button>
            )
          }
        >
        {showReviewStatus ? (
          <>
            <DataTable
              columns={['准备项', '状态', '说明']}
              rows={[
                ['计划详情', <Tag tone="green">已填写</Tag>, '检查对象 / 范围 / 依据 / 目标'],
                ['校审状态', <Tag tone={isReviewed ? 'green' : 'amber'}>{isReviewed ? '全部通过' : '校审中'}</Tag>, isReviewed ? '已立项' : '线上审批中'],
                ['资料清单', <Tag tone="amber">待分解</Tag>, '待任务分解'],
              ]}
            />
          </>
        ) : splitting ? (
          <StepList steps={splitSteps.map((step, index) => ({
            title: `${step}${index === splitIndex ? ' · 处理中' : index < splitIndex ? ' · 完成' : ''}`,
            text: index === splitIndex ? '处理中' : index < splitIndex ? '已完成' : '等待处理',
          }))} />
        ) : isSplit ? (
          <>
            <div className="icm-grid cols-2">
              <DetailLine label="检查任务" value="1 项" />
              <DetailLine label="资料采集任务" value="1 项" />
              <DetailLine label="穿行测试任务" value="1 项" />
              <DetailLine label="取证任务" value="1 项" />
              <DetailLine label="计划状态" value={<Tag tone={isDispatched ? 'green' : 'amber'}>{isDispatched ? '已派发' : '待派发'}</Tag>} />
              <DetailLine label="检查任务书" value={<Tag tone={hasTaskBook ? 'green' : 'gray'}>{hasTaskBook ? '已入库' : '待生成'}</Tag>} />
            </div>
            {!isAssigned ? (
              <>
                <SectionTitle>分解结果</SectionTitle>
                <DataTable
                  columns={['任务编号', '任务类型', '任务名称', '负责人', '状态', '输出']}
                  rows={tasks.map((task) => [
                    task.id,
                    task.type,
                    task.name,
                    task.owner,
                    <Tag tone={statusTone(task.status)}>{task.status}</Tag>,
                    task.outputs.join(' / '),
                  ])}
                />
                <div className="icm-actions" style={{ marginTop: 12 }}>
                  <div className="icm-toolbar-spacer" />
                  <Button type="primary" onClick={assignPeople}>人员分配</Button>
                </div>
              </>
            ) : (
              <>
                <SectionTitle>人员分配方案</SectionTitle>
                <DataTable
                  columns={['角色', '人员', '匹配依据', '工作负荷', '回避校验']}
                  rows={[
                    ['检查组长', '张衡', '采购与合同专项经验 6 次', '62%', <Tag tone="green">通过</Tag>],
                    ['合同核验', '李娜', '合同字段比对与取证', '70%', <Tag tone="green">通过</Tag>],
                    ['资金取数', '王锐', '资金流水和审批链核验', '78%', <Tag tone="green">通过</Tag>],
                    ['外部专家', '赵明', '招采合规专家库推荐', '42%', <Tag tone="green">已签保密</Tag>],
                  ]}
                />
                <div className="icm-actions" style={{ marginTop: 12 }}>
                  <Button type="success-soft" onClick={generateTaskBook}>生成检查任务书</Button>
                  <div className="icm-toolbar-spacer" />
                  <Button type="primary" onClick={dispatchTasks}>任务派单</Button>
                </div>
              </>
            )}
          </>
        ) : null}
        </Card>
      ) : null}

      {/* 新建计划弹窗 */}
      {createOpen ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal" style={{ maxWidth: 680 }}>
            <div className="icm-modal-head">
              <div>
                <div className="icm-modal-title">新建检查计划</div>
                <div className="icm-modal-sub">依据国资厅监督〔2026〕15号文及101号、29号、2号、46号文要求</div>
              </div>
              <button className="icm-modal-close" type="button" onClick={() => setCreateOpen(false)} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div style={{ overflow: 'auto', padding: 18 }}>
              {/* ---- 基本信息 ---- */}
              <div className="icm-subsection-head" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                <div className="icm-card-title">基本信息</div>
              </div>
              <div className="icm-grid cols-2">
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  计划名称 <span style={{ color: '#b91c1c' }}>*</span>
                  <input className="icm-input" style={{ width: '100%' }} value={createForm.name} onChange={(event) => setCreateForm((form) => ({ ...form, name: event.target.value }))} placeholder="例：2026年度采购围标风险专项检查计划" />
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  检查类型 <span style={{ color: '#b91c1c' }}>*</span>
                  <select className="icm-select" style={{ width: '100%' }} value={createForm.type} onChange={(event) => setCreateForm((form) => ({ ...form, type: event.target.value }))}>
                    <option>专项抽查</option>
                    <option>年度检查</option>
                    <option>临时检查</option>
                    <option>穿透监管测试</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  被检查单位 <span style={{ color: '#b91c1c' }}>*</span>
                  <input className="icm-input" style={{ width: '100%' }} value={createForm.unit} onChange={(event) => setCreateForm((form) => ({ ...form, unit: event.target.value }))} placeholder="例：华北装备制造集团西北分公司" />
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  检查领域 <span style={{ color: '#b91c1c' }}>*</span>
                  <select className="icm-select" style={{ width: '100%' }} value={createForm.checkDomain} onChange={(event) => setCreateForm((form) => ({ ...form, checkDomain: event.target.value }))}>
                    {['采购','合同','资金','投资','产权','财务','薪酬','金融','境外','工程项目','研发'].map((domain) => <option key={domain}>{domain}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>开始日期
                  <input className="icm-input" style={{ width: '100%' }} type="date" value={createForm.periodStart} onChange={(event) => setCreateForm((form) => ({ ...form, periodStart: event.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>结束日期
                  <input className="icm-input" style={{ width: '100%' }} type="date" value={createForm.periodEnd} onChange={(event) => setCreateForm((form) => ({ ...form, periodEnd: event.target.value }))} />
                </label>
              </div>

              {/* ---- 依据与目标 ---- */}
              <div className="icm-subsection-head">
                <div className="icm-card-title">检查依据与目标</div>
              </div>
              <div className="icm-grid cols-2">
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  政策依据
                  <textarea className="icm-input" style={{ width: '100%', height: 72, resize: 'vertical', padding: '8px 10px' }} value={createForm.basis} onChange={(event) => setCreateForm((form) => ({ ...form, basis: event.target.value }))} placeholder="例：国资厅监督〔2026〕15号文、集团采购管理办法第18条、招投标合规指引第12条" />
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  检查目标
                  <textarea className="icm-input" style={{ width: '100%', height: 72, resize: 'vertical', padding: '8px 10px' }} value={createForm.objective} onChange={(event) => setCreateForm((form) => ({ ...form, objective: event.target.value }))} placeholder="例：核验采购围标风险识别、取证、整改和报告闭环的有效性" />
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  风险主题
                  <input className="icm-input" style={{ width: '100%' }} value={createForm.riskTheme} onChange={(event) => setCreateForm((form) => ({ ...form, riskTheme: event.target.value }))} placeholder="例：采购围标风险、拆分合同规避招标" />
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  外部专家（选填）
                  <input className="icm-input" style={{ width: '100%' }} value={createForm.externalExpert} onChange={(event) => setCreateForm((form) => ({ ...form, externalExpert: event.target.value }))} placeholder="例：招采合规专家 赵明" />
                </label>
              </div>

              {/* ---- 审批与合规 ---- */}
              <div className="icm-subsection-head">
                <div className="icm-card-title">审批与合规校验（15号文要求）</div>
              </div>
              <div className="icm-grid cols-2">
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  检查组长/负责人
                  <input className="icm-input" style={{ width: '100%' }} value={createForm.owner} onChange={(event) => setCreateForm((form) => ({ ...form, owner: event.target.value }))} placeholder="例：张衡" />
                </label>
                <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                  复核/审批人
                  <input className="icm-input" style={{ width: '100%' }} value={createForm.reviewer} onChange={(event) => setCreateForm((form) => ({ ...form, reviewer: event.target.value }))} placeholder="例：郑刚" />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 13, paddingTop: 4 }}>
                  <input type="checkbox" checked={createForm.needParty} onChange={(event) => setCreateForm((form) => ({ ...form, needParty: event.target.checked }))} />
                  党委（党组）前置研究校验（101号文/15号文要求）
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 13, paddingTop: 4 }}>
                  <input type="checkbox" checked={createForm.needBoard} onChange={(event) => setCreateForm((form) => ({ ...form, needBoard: event.target.checked }))} />
                  董事会审议审批节点（15号文穿透监管测试类计划要求）
                </label>
              </div>

              {/* ---- 提示 ---- */}
              <div className="icm-empty-inline" style={{ marginTop: 14, textAlign: 'left', color: '#5d6d84' }}>
                提交后计划状态为<strong>"待校审"</strong>，需经内控负责人→分管领导→主要领导三级审批后立项生效。穿透监管测试类计划须经董事会审议。检查人员连续3年不得检查同一单位同一领域（回避规则T1）。
              </div>
            </div>
            <div className="icm-modal-foot">
              <span>{createForm.name.trim() && createForm.unit.trim() ? '必填项已满足，可提交' : '请填写计划名称和被检查单位'}</span>
              <div className="icm-actions">
                <Button type="default-soft" onClick={() => setCreateOpen(false)}>取消</Button>
                <Button type="primary" disabled={!createForm.name.trim() || !createForm.unit.trim()} onClick={handleCreateSave}>确定创建</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  )
}

export function DataRulesStage() {
  const [selectedPackage, setSelectedPackage] = useState(dataCollect.resultPackages[0]?.id)
  const [tab, setTab] = useState<DataTab>('demand')
  const selected = dataCollect.resultPackages.find((item) => item.id === selectedPackage) ?? dataCollect.resultPackages[0]
  const mappings = [
    ['vendorName', 'supplier_name', '供应商名称'],
    ['contractAmount', 'contract_amount', '合同金额'],
    ['signDate', 'sign_date', '签署日期'],
    ['approvalNode', 'approval_node', '审批节点'],
  ]

  return (
    <PageFrame
      title="数据与规则"
      subtitle="左侧选择数据包，右侧确认需求、质量、字段映射和启用规则。"
      actions={<Button type="primary" icon={<CheckCircle2 size={15} />}>完成数据准备</Button>}
    >
      <WorkflowLayout
        side={
          <>
            <div className="icm-grid cols-2">
              <Kpi value="4" label="数据需求" note="本次检查" tone="blue" />
              <Kpi value="4" label="启用规则" note="围标规则包" tone="green" />
            </div>
            <Card title="数据包">
              <div className="icm-list">
                {dataCollect.resultPackages.map((pack) => (
                  <button
                    className={`icm-list-row ${pack.id === selected.id ? 'active' : ''}`}
                    key={pack.id}
                    onClick={() => setSelectedPackage(pack.id)}
                    type="button"
                  >
                    <div>
                      <div className="icm-list-title">{pack.name}</div>
                      <div className="icm-list-meta">{pack.id}<br />{pack.includes.join(' / ')}</div>
                    </div>
                    <Tag tone={statusTone(pack.status)}>{pack.status}</Tag>
                  </button>
                ))}
              </div>
            </Card>
            <Card title="最低质量项" note="先暴露阻塞点">
              <DetailLine label="附件完整性" value="82 / 待处理" />
              <DetailLine label="处理建议" value="补齐 2 份评分表扫描附件" />
            </Card>
          </>
        }
        main={
          <Card
            title="数据包详情"
            note={selected.id}
            action={
              <Segmented
                value={tab}
                onChange={setTab}
                options={[
                  { label: '数据需求', value: 'demand' },
                  { label: '质量校验', value: 'quality' },
                  { label: '规则准备', value: 'rules' },
                ]}
              />
            }
          >
            {tab === 'demand' ? (
              <DataTable
                columns={['需求项', '责任方', '采集方式', '状态', '期限']}
                rows={dataCollect.demands.map((item) => [item.name, item.owner, item.method, <Tag tone={statusTone(item.status)}>{item.status}</Tag>, item.due])}
              />
            ) : null}
            {tab === 'quality' ? (
              <>
                <DataTable
                  columns={['校验规则', '目标字段', '结果', '分数', '处理建议']}
                  rows={dataCollect.quality.map((item) => [item.rule, item.target, <Tag tone={statusTone(item.result)}>{item.result}</Tag>, `${item.score}`, item.fixHint])}
                />
                <SectionTitle>字段映射样例</SectionTitle>
                <DataTable columns={['源字段', '标准字段', '业务含义']} rows={mappings} />
              </>
            ) : null}
            {tab === 'rules' ? (
              <DataTable columns={['规则编号', '规则名称', '判定条件', '依据', '输出']} rows={rules.map((rule) => [rule.id, rule.name, rule.condition, rule.source, rule.output])} />
            ) : null}
          </Card>
        }
      />
    </PageFrame>
  )
}

export function SmartReviewStage() {
  const [selectedFindingId, setSelectedFindingId] = useState(findings[0]?.id)
  const [tab, setTab] = useState<ReviewTab>('rules')
  const selected = findings.find((finding) => finding.id === selectedFindingId) ?? findings[0]
  const linkedEvidence = evidences.filter((item) => selected.linkedEvidence.includes(item.id))

  return (
    <PageFrame
      title="智能审查"
      subtitle="左侧是审查任务和线索，右侧处理命中依据、穿行验证和人工复核。"
      actions={<Button type="primary" icon={<Play size={15} />}>运行审查任务</Button>}
    >
      <WorkflowLayout
        side={
          <>
            <Card title="审查任务" note="一期保留一个专项任务">
              <DetailLine label="任务" value="采购围标风险审查" />
              <DetailLine label="状态" value={<Tag tone="amber">人工复核中</Tag>} />
              <DetailLine label="命中线索" value={`${findings.length} 条`} />
            </Card>
            <Card title="疑似线索">
              <div className="icm-list">
                {findings.map((finding) => (
                  <button
                    className={`icm-list-row ${finding.id === selected.id ? 'active' : ''}`}
                    key={finding.id}
                    onClick={() => setSelectedFindingId(finding.id)}
                    type="button"
                  >
                    <div>
                      <div className="icm-list-title">{finding.title}</div>
                      <div className="icm-list-meta">{finding.id} · {finding.sample}</div>
                    </div>
                    <Tag tone={statusTone(finding.level)}>{finding.confidence}%</Tag>
                  </button>
                ))}
              </div>
            </Card>
            <Card title="执行单元" note="不再铺开复杂智能体面板">
              <DataTable columns={['单元', '状态']} rows={agents.map((agent) => [agent.domain, <Tag tone={statusTone(agent.status)}>{agent.status}</Tag>])} />
            </Card>
          </>
        }
        main={
          <Card
            title="线索详情"
            note={selected.id}
            action={
              <Segmented
                value={tab}
                onChange={setTab}
                options={[
                  { label: '规则命中', value: 'rules' },
                  { label: '穿行验证', value: 'walkthrough' },
                  { label: '人工复核', value: 'confirm' },
                ]}
              />
            }
          >
            {tab === 'rules' ? (
              <div className="icm-grid cols-2">
                <DetailLine label="疑似问题" value={selected.title} />
                <DetailLine label="风险等级" value={<Tag tone={statusTone(selected.level)}>{selected.level}</Tag>} />
                <DetailLine label="置信度" value={`${selected.confidence}%`} />
                <DetailLine label="命中规则" value={selected.ruleId} />
                <DetailLine label="命中样本" value={selected.sample} />
                <DetailLine label="当前状态" value={<Tag tone={statusTone(selected.status)}>{selected.status}</Tag>} />
              </div>
            ) : null}
            {tab === 'walkthrough' ? (
              <DataTable
                columns={['流程节点', '控制点', '测试结果', '证据', '生成对象']}
                rows={walkthrough.map((node) => [node.node, node.control, <Tag tone={statusTone(node.result)}>{node.result}</Tag>, node.evidence, node.generated.join(' / ') || '-'])}
              />
            ) : null}
            {tab === 'confirm' ? (
              <>
                <DetailLine label="复核人" value={selected.reviewer} />
                <DetailLine label="审查单元" value={selected.agent} />
                <SectionTitle>证据支撑</SectionTitle>
                <DataTable
                  columns={['证据编号', '证据名称', '类型', '状态']}
                  rows={linkedEvidence.map((item) => [item.id, item.title, item.type, <Tag tone={statusTone(item.status)}>{item.status}</Tag>])}
                />
                <div className="icm-actions" style={{ marginTop: 12 }}>
                  <Button type="success-soft">确认并转底稿</Button>
                  <Button type="warn-soft">退回补证</Button>
                </div>
              </>
            ) : null}
          </Card>
        }
      />
    </PageFrame>
  )
}

export function WorkpaperIssueStage() {
  const [selectedWorkpaperId, setSelectedWorkpaperId] = useState(workpapers[0]?.id)
  const [showEvidenceSheet, setShowEvidenceSheet] = useState(false)
  const selectedPaper = workpapers.find((item) => item.id === selectedWorkpaperId) ?? workpapers[0]
  const linkedEvidence = evidences.filter((item) => selectedPaper.evidenceIds.includes(item.id))
  const selectedFinding = findings.find((item) => item.linkedEvidence.some((id) => selectedPaper.evidenceIds.includes(id))) ?? findings[0]
  const selectedIssue = issues.find((issue) => issue.workpaperId === selectedPaper.id)
  const relatedRectification = rectifications.find((item) => item.id === selectedIssue?.rectificationId)
  const evidenceRequestNo = `EVS-${selectedPaper.id.replace('WP-', '2026-')}`
  const canGenerateIssue = selectedPaper.result === '阳性' && selectedPaper.status === '审定通过'
  const evidenceComplete = linkedEvidence.length > 0 && linkedEvidence.every((item) => item.status === '已归档')
  const sourceLabel = selectedFinding ? `智能审查结果 ${selectedFinding.id}` : '人工检查录入'
  const processMode = selectedPaper.status === '待补证'
    ? '补充取证后再提交复核'
    : selectedPaper.status === '复核中'
      ? '等待二/三级复核结论'
      : selectedPaper.result === '阴性'
        ? '终审通过后直接归档'
        : '终审通过后生成问题'

  return (
    <PageFrame
      title="底稿与问题"
      subtitle="以检查底稿为主对象管理取证、复核和问题生成；审查结果只作为辅助来源，不直接进入整改或报告。"
      actions={<Button type="primary" icon={<ClipboardList size={15} />} onClick={() => selectedPaper && setShowEvidenceSheet(true)}>查看内嵌取证单</Button>}
    >
      <WorkflowLayout
        side={
          <Card title="底稿列表">
            <div className="icm-list">
              {workpapers.map((paper) => (
                <button
                  className={`icm-list-row ${paper.id === selectedPaperId ? 'active' : ''}`}
                  key={paper.id}
                  onClick={() => setSelectedWorkpaperId(paper.id)}
                  type="button"
                >
                  <div>
                    <div className="icm-list-title">{paper.title}</div>
                    <div className="icm-list-meta">
                      {paper.id} · 来源：{paper.evidenceIds.length ? '审查结果生成' : '人工抽样检查'}<br />
                      处理：{paper.status === '审定通过' ? paper.result === '阴性' ? '归档' : '生成问题' : paper.status}
                    </div>
                  </div>
                  <Tag tone={statusTone(paper.result)}>{paper.result}</Tag>
                </button>
              ))}
            </div>
          </Card>
        }
        main={
          <div className="icm-workflow-main">
            {!selectedPaper ? (
              <Card title="请选择底稿">
                <div className="icm-empty-inline">
                  请选择左侧底稿
                </div>
              </Card>
            ) : (
              <div className="icm-reveal-panel" key={selectedPaper.id}>
                <Card
                  title="底稿处理区"
                  note={`${selectedPaper.id} · ${sourceLabel}`}
                  action={<Button type="info-soft" size="sm" icon={<ClipboardList size={15} />} onClick={() => setShowEvidenceSheet(true)}>查看取证单</Button>}
                >
                  <div className="icm-grid cols-3">
                    <DetailLine label="底稿来源" value={sourceLabel} />
                    <DetailLine label="处理方式" value={processMode} />
                    <DetailLine label="当前状态" value={<Tag tone={statusTone(selectedPaper.status)}>{selectedPaper.status}</Tag>} />
                  </div>
                  <SectionTitle>底稿正文</SectionTitle>
                  <div className="icm-editor">
                    <h2>{selectedPaper.title}</h2>
                    <h3>一、检查程序</h3>
                    <p>依据检查标准库规则、任务资料清单和人工复核要求，对相关业务样本执行数据核验、附件调阅、审批链检查和必要访谈。</p>
                    <h3>二、取证事实</h3>
                    <p>{linkedEvidence.length ? linkedEvidence.map((item) => `${item.title}（${item.type}，${item.status}）`).join('；') : '当前底稿已形成阴性检查记录，未发现需补充的异常证据。'}</p>
                    <h3>三、复核结论</h3>
                    <p>{selectedPaper.conclusion}</p>
                  </div>
                  <SectionTitle>内嵌取证单</SectionTitle>
                  <DataTable
                    columns={['取证单号', '检查程序', '单位确认', '附件状态', '提交复核条件']}
                    rows={[[
                      evidenceRequestNo,
                      '数据核验 / 附件调阅 / 事实确认',
                      selectedPaper.result === '阳性' ? '需确认签字' : '归档留痕',
                      linkedEvidence.map((item) => item.id).join(' / ') || '阴性记录说明',
                      evidenceComplete || selectedPaper.result === '阴性' ? <Tag tone="green">满足</Tag> : <Tag tone="amber">待补证</Tag>,
                    ]]}
                  />
                </Card>

                {(selectedIssue || canGenerateIssue || selectedPaper.result === '阴性') ? (
                  <Card
                    title={selectedIssue ? '问题闭环' : selectedPaper.result === '阴性' ? '归档结果' : '生成问题'}
                    action={canGenerateIssue && !selectedIssue ? <Button type="primary">生成问题</Button> : null}
                  >
                    {selectedIssue ? (
                      <div className="icm-grid cols-2">
                        <DetailLine label="问题编号" value={selectedIssue.id} />
                        <DetailLine label="问题等级" value={<Tag tone={statusTone(selectedIssue.level)}>{selectedIssue.level}</Tag>} />
                        <DetailLine label="问题描述" value={selectedIssue.title} />
                        <DetailLine label="整改工单" value={relatedRectification ? `${relatedRectification.id} · ${relatedRectification.lane}` : '待派发'} />
                      </div>
                    ) : (
                      <div className="icm-empty-inline">
                        {selectedPaper.result === '阴性' ? '该底稿终审后直接归档，不生成问题。' : '该阳性底稿已终审通过，可从这里生成问题并进入整改。'}
                      </div>
                    )}
                    <SectionTitle>辅助追溯链路</SectionTitle>
                    <DataTable
                      columns={['环节', '对象', '当前状态', '关系']}
                      rows={[
                        ['审查结果', selectedFinding.id, <Tag tone={statusTone(selectedFinding.status)}>{selectedFinding.status}</Tag>, '只作为底稿来源'],
                        ['检查底稿', selectedPaper.id, <Tag tone={statusTone(selectedPaper.status)}>{selectedPaper.status}</Tag>, '主处理对象'],
                        ['取证单', evidenceRequestNo, <Tag tone={evidenceComplete ? 'green' : 'amber'}>{evidenceComplete ? '已归档' : '待完善'}</Tag>, '内嵌在底稿中'],
                        ['问题', selectedIssue?.id ?? '-', <Tag tone={selectedIssue ? statusTone(selectedIssue.status) : 'gray'}>{selectedIssue?.status ?? '未生成'}</Tag>, '由终审阳性底稿生成'],
                      ]}
                    />
                  </Card>
                ) : null}
              </div>
            )}
          </div>
        }
      />
      {showEvidenceSheet && selectedPaper ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal">
            <div className="icm-modal-head">
              <div>
                <div className="icm-modal-title">底稿内嵌取证单</div>
                <div className="icm-modal-sub">{evidenceRequestNo} · 绑定底稿 {selectedPaper.id}</div>
              </div>
              <button className="icm-modal-close" type="button" onClick={() => setShowEvidenceSheet(false)} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="icm-grid cols-2">
              <DetailLine label="取证事项" value={selectedPaper.title} />
              <DetailLine label="取证责任人" value={linkedEvidence.map((item) => item.owner).join(' / ') || selectedPaper.reviewer} />
              <DetailLine label="证据来源" value={linkedEvidence.map((item) => item.sourceSystem).join(' / ') || '待确认'} />
              <DetailLine label="归档状态" value={<Tag tone={evidenceComplete ? 'green' : 'amber'}>{evidenceComplete ? '全部归档' : '存在待复核'}</Tag>} />
              <DetailLine label="关联底稿" value={selectedPaper.id} />
              <DetailLine label="关联问题" value={selectedIssue?.id ?? '待生成'} />
            </div>
            <SectionTitle>关联证据</SectionTitle>
            <DataTable
              columns={['证据编号', '证据名称', '类型', '来源系统', '链路哈希', '关联底稿', '状态']}
              rows={(linkedEvidence.length ? linkedEvidence : [{
                id: '阴性说明',
                title: '抽样检查未发现异常，取证单记录检查过程和结论',
                type: '检查记录',
                sourceSystem: '检查人员录入',
                chainHash: '归档后生成',
                link: selectedPaper.id,
                status: '待归档',
              }]).map((item) => [item.id, item.title, item.type, item.sourceSystem, item.chainHash, item.link, <Tag tone={statusTone(item.status)}>{item.status}</Tag>])}
            />
            <div className="icm-actions" style={{ marginTop: 12 }}>
              <Button type="primary">归档取证单</Button>
              <Button type="warn-soft">退回补证</Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  )
}

export function RectifyReportStage() {
  const [selectedRectifyId, setSelectedRectifyId] = useState(rectifications[0]?.id)
  const [modal, setModal] = useState<ReportModal>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [expandedGroup, setExpandedGroup] = useState('问题')
  const [flow, setFlow] = useState<ReportFlow>('editing')
  const [auditStep, setAuditStep] = useState(-1)
  const selected = rectifications.find((item) => item.id === selectedRectifyId) ?? rectifications[0]
  const sourceIssue = issues.find((issue) => issue.rectificationId === selected.id)
  const sourceWorkpaper = workpapers.find((paper) => paper.id === sourceIssue?.workpaperId)
  const sourceEvidence = evidences.filter((item) => sourceIssue?.evidenceIds.includes(item.id))
  const sourceItems = [
    ...workpapers.map((item) => ({ id: item.id, type: '底稿', title: item.title, owner: item.reviewer, status: item.status })),
    ...issues.map((item) => ({ id: item.id, type: '问题', title: item.title, owner: item.owner, status: item.status })),
    ...evidences.map((item) => ({ id: item.id, type: '取证', title: item.title, owner: item.owner, status: item.status })),
    ...rectifications.map((item) => ({ id: item.id, type: '整改', title: item.issue, owner: item.owner, status: item.lane })),
    ...reports.basket.map((item) => ({ id: item.id, type: item.type === '证据' ? '取证' : item.type, title: item.title, owner: item.owner, status: '已入报告篮' })),
    ...rules.slice(0, 3).map((item) => ({ id: item.id, type: '规则', title: item.name, owner: item.domain, status: '已同步' })),
  ]
  const filteredSourceItems = sourceItems.filter((item) => !searchKeyword || `${item.id}${item.type}${item.title}${item.owner}`.includes(searchKeyword))
  const selectedSourceItems = sourceItems.filter((item) => selectedSourceIds.includes(item.id))
  const materialGroups = ['问题', '底稿', '取证', '整改', '规则']
  const groupedSources = materialGroups.map((type) => ({
    type,
    items: filteredSourceItems.filter((item) => item.type === type),
  }))
  const canDraft = Boolean(selectedTemplate && selectedSourceIds.length)
  const draftReady = flow !== 'editing'
  const ledgerReady = flow === 'ledger' || flow === 'reviewing' || flow === 'approved' || flow === 'archived'
  const reviewNodes = ['编制确认', '组长复核', '内控审核', '报送确认']
  const flowTag = flow === 'editing' ? '待撰写' : flow === 'drafted' ? '已成稿' : flow === 'ledger' ? '待审核' : flow === 'reviewing' ? '审核中' : flow === 'approved' ? '待入库' : '已入库'
  const closedCount = issues.filter((item) => item.status === '已销号').length
  const overdueCount = issues.filter((item) => item.status !== '已销号' && item.deadline < '2026-07-02').length
  const proofTotal = rectifications.reduce((total, item) => total + item.proof, 0)
  const proofPassed = rectifications.filter((item) => item.verify === '成立').length
  const rectificationMetrics = [
    { label: '整改闭环率', value: `${Math.round((closedCount / Math.max(issues.length, 1)) * 100)}%`, note: `${closedCount}/${issues.length} 项已销号`, tone: 'green' as Tone },
    { label: '超期整改', value: `${overdueCount}`, note: '按整改期限自动预警', tone: overdueCount ? 'red' as Tone : 'green' as Tone },
    { label: '佐证材料', value: `${proofTotal}`, note: `${proofPassed} 项通过复核`, tone: 'blue' as Tone },
    { label: '回访关注', value: '3/6/12', note: '销号后回访节点', tone: 'amber' as Tone },
  ]
  const reportAuditRows = reviewNodes.map((node, index) => {
    const completedIndex = flow === 'archived' || flow === 'approved'
      ? reviewNodes.length - 1
      : flow === 'reviewing'
        ? auditStep
        : flow === 'ledger'
          ? 0
          : -1
    const isCompleted = index < completedIndex || flow === 'approved' || flow === 'archived'
    const isCurrent = flow === 'reviewing' && index === completedIndex
    const status = isCompleted ? '已完成' : isCurrent ? '处理中' : index === 0 && flow === 'ledger' ? '待提交' : '未开始'
    return {
      node,
      owner: ['编制人', '检查组长', '内控部门负责人', '报送管理员'][index],
      progress: isCompleted ? 100 : isCurrent ? 50 : 0,
      status,
    }
  })

  const selectRectification = (id: string) => {
    setSelectedRectifyId(id)
    setSelectedSourceIds([])
    setSelectedTemplate('')
    setFlow('editing')
    setAuditStep(-1)
  }

  const toggleSource = (id: string) => {
    setSelectedSourceIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])
    setFlow('editing')
    setAuditStep(-1)
  }

  const generateDraft = () => {
    if (!canDraft) return
    setFlow('drafted')
    setAuditStep(-1)
  }

  const generateLedger = () => {
    if (!draftReady) return
    setFlow('ledger')
    setAuditStep(-1)
  }

  const submitAudit = () => {
    if (flow !== 'ledger') return
    setFlow('reviewing')
    setAuditStep(0)
    reviewNodes.forEach((_, index) => {
      window.setTimeout(() => setAuditStep(index), 520 * (index + 1))
    })
    window.setTimeout(() => {
      setAuditStep(reviewNodes.length - 1)
      setFlow('approved')
    }, 520 * (reviewNodes.length + 1))
  }

  const archiveReport = () => {
    if (flow !== 'approved') return
    setFlow('archived')
  }

  return (
    <PageFrame
      title="整改报告中心"
      subtitle="整改报告编制、审核报送、报告入库。"
    >
      <div className="icm-grid" style={{ gridTemplateColumns: '270px minmax(0,1fr) minmax(320px,360px)', alignItems: 'start' }}>
        <Card title="整改追踪" note="问题整改任务">
          <div className="icm-list icm-report-board">
            {rectifications.map((item) => (
              <button className={`icm-list-row ${item.id === selected.id ? 'active' : ''}`} key={item.id} onClick={() => selectRectification(item.id)} type="button">
                <div>
                  <div className="icm-list-title">{item.issue}</div>
                  <div className="icm-list-meta">{item.id} · {item.owner} · 佐证 {item.proof} 份</div>
                </div>
                <Tag tone={statusTone(item.lane)}>{item.lane}</Tag>
              </button>
            ))}
          </div>
        </Card>

        <div className="icm-workflow-main icm-report-board">
          <Card title="当前报告" note={selected.id} action={<Tag tone={flow === 'archived' ? 'green' : flow === 'reviewing' ? 'blue' : 'amber'}>{flowTag}</Tag>}>
            <div className="icm-report-current">
              <div className="icm-grid cols-3">
                <DetailLine label="整改事项" value={selected.issue} />
                <DetailLine label="责任部门" value={selected.owner} />
                <DetailLine label="整改状态" value={<Tag tone={statusTone(selected.lane)}>{selected.lane}</Tag>} />
                <DetailLine label="问题编号" value={sourceIssue?.id ?? '待关联'} />
                <DetailLine label="问题等级" value={sourceIssue ? <Tag tone={statusTone(sourceIssue.level)}>{sourceIssue.level}</Tag> : '待关联'} />
                <DetailLine label="整改进度" value={sourceIssue ? `${sourceIssue.progress}%` : '-'} />
              </div>

              <SectionTitle>当前报告的问题</SectionTitle>
              {sourceIssue ? (
                <div className="icm-grid cols-2">
                  <DetailLine label="问题名称" value={sourceIssue.title} />
                  <DetailLine label="整改期限" value={sourceIssue.deadline} />
                  <DetailLine label="来源底稿" value={sourceWorkpaper?.id ?? '待关联'} />
                  <DetailLine label="取证附件" value={sourceEvidence.map((item) => item.id).join(' / ') || '待关联'} />
                </div>
              ) : (
                <div className="icm-empty-inline">当前整改事项未关联问题</div>
              )}

              {!draftReady ? (
                <>
                  <SectionTitle>报告配置</SectionTitle>
                  <div className="icm-grid cols-3">
                    <DetailLine label="报告模板" value={selectedTemplate || '待选择'} />
                    <DetailLine label="已选素材" value={`${selectedSourceItems.length} 项`} />
                    <DetailLine label="报送台账" value={<Tag tone="gray">待生成</Tag>} />
                  </div>
                  {selectedSourceItems.length ? (
                    <DataTable
                      columns={['素材类型', '编号', '标题', '来源/责任', '状态']}
                      rows={selectedSourceItems.map((item) => [
                        item.type,
                        item.id,
                        item.title,
                        item.owner,
                        <Tag tone={statusTone(item.status)}>{item.status}</Tag>,
                      ])}
                    />
                  ) : (
                    <div className="icm-empty-inline">尚未选择报告素材。确认素材后会在这里展示引用明细。</div>
                  )}
                </>
              ) : null}

              {draftReady ? (
                <div className="icm-report-paper">
                  <h2>{selectedTemplate}</h2>
                  <h3>一、整改概况</h3>
                  <p>本报告围绕“{selected.issue}”形成，责任部门为{selected.owner}，当前整改状态为{selected.lane}。</p>
                  <h3>二、问题事实</h3>
                  <p>{sourceIssue ? `${sourceIssue.title}，问题等级为${sourceIssue.level}，整改期限为${sourceIssue.deadline}。` : '当前整改事项未关联问题台账。'}</p>
                  <h3>三、引用素材</h3>
                  <p>{selectedSourceItems.map((item) => `${item.type}-${item.id}`).join('、') || '待补充报告素材。'}</p>
                  <h3>四、审核口径</h3>
                  <p>报告按整改事项逐项确认事实、佐证、责任部门、复核意见和报送状态。</p>
                </div>
              ) : null}

              {ledgerReady ? (
                <div className="icm-report-ledger">
                  <strong>报送台账：RPT-2026-{selected.id.replace('RC-', '')}</strong>
                  <span>{selectedTemplate} · {selected.owner} · 素材 {selectedSourceItems.length} 项 · 状态 {flowTag}</span>
                </div>
              ) : null}

              <div className="icm-report-action-bar">
                <Button type="info-soft" icon={<UploadCloud size={15} />} onClick={() => setModal('materials')}>选择报告素材</Button>
                <Button type="info-soft" icon={<FileText size={15} />} onClick={() => setModal('templates')}>选择报告模板</Button>
                {flow === 'editing' ? (
                  <Button type="primary" icon={<FileText size={15} />} disabled={!canDraft} onClick={generateDraft}>生成报告初稿</Button>
                ) : flow === 'drafted' ? (
                  <Button type="primary" icon={<ClipboardList size={15} />} onClick={generateLedger}>生成报送台账</Button>
                ) : flow === 'ledger' ? (
                  <Button type="success-soft" icon={<Send size={15} />} onClick={submitAudit}>提交审核</Button>
                ) : flow === 'approved' ? (
                  <Button type="primary" icon={<CheckCircle2 size={15} />} onClick={archiveReport}>确认入库</Button>
                ) : flow === 'archived' ? (
                  <Tag tone="green">已入库</Tag>
                ) : (
                  <Tag tone="blue">审核中</Tag>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="icm-workflow-main">
          <Card title="整改监督指标" note="贴合整改闭环、佐证复核、报告引用和回访要求">
            <div className="icm-grid cols-2">
              {rectificationMetrics.map((item) => (
                <Kpi key={item.label} value={item.value} label={item.label} note={item.note} tone={item.tone} />
              ))}
            </div>
          </Card>

          {ledgerReady ? (
            <Card title="审核报送" note="报送台账生成后进入审核流程">
              <div className="icm-list">
                {reportAuditRows.map((row) => (
                  <div className={`icm-audit-row ${row.progress === 100 ? 'done' : row.status === '处理中' ? 'running' : ''}`} key={row.node}>
                    <div className="icm-audit-row-head">
                      <div>
                        <strong>{row.node}</strong>
                        <span>{row.owner} · RPT-2026-{selected.id.replace('RC-', '')}</span>
                      </div>
                      <Tag tone={row.progress === 100 ? 'green' : row.status === '处理中' ? 'blue' : row.status === '待提交' ? 'amber' : 'gray'}>{row.status}</Tag>
                    </div>
                    <div className="icm-audit-progress"><b style={{ width: `${row.progress}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {modal === 'materials' ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal">
            <div className="icm-modal-head">
              <div>
                <div className="icm-modal-title">选择报告素材</div>
                <div className="icm-modal-sub">已选 {selectedSourceItems.length} 项</div>
              </div>
              <button className="icm-modal-close" type="button" onClick={() => setModal(null)} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="icm-modal-tools">
              <div className="icm-modal-search">
                <span>检索</span>
                <input value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="问题、底稿、取证、整改、法规" />
              </div>
            </div>
            <div className="icm-reference-list">
              {groupedSources.map((group) => (
                <div className="icm-list" key={group.type}>
                  <button className="icm-list-row icm-material-group-row" type="button" onClick={() => setExpandedGroup(expandedGroup === group.type ? '' : group.type)}>
                    <div>
                      <div className="icm-list-title">{group.type}素材</div>
                      <div className="icm-list-meta">可引用 {group.items.length} 项 · 已选 {group.items.filter((item) => selectedSourceIds.includes(item.id)).length} 项</div>
                    </div>
                    <span className={`icm-expand-btn ${expandedGroup === group.type ? 'active' : ''}`} aria-hidden="true">
                      <ChevronDown size={15} />
                    </span>
                  </button>
                  {expandedGroup === group.type ? group.items.map((item) => (
                    <button className={`icm-reference-row ${selectedSourceIds.includes(item.id) ? 'active' : ''}`} key={item.id} type="button" onClick={() => toggleSource(item.id)}>
                      <span className="icm-reference-check">{selectedSourceIds.includes(item.id) ? '✓' : ''}</span>
                      <span>
                        <strong>{item.title}</strong>
                        <em>{item.type} · {item.id} · {item.owner}</em>
                      </span>
                      <Tag tone={statusTone(item.status)}>{item.status}</Tag>
                    </button>
                  )) : null}
                </div>
              ))}
            </div>
            <div className="icm-modal-foot">
              <span>已选择 {selectedSourceItems.length} 项素材</span>
              <Button type="primary" onClick={() => setModal(null)}>确认素材</Button>
            </div>
          </div>
        </div>
      ) : null}

      {modal === 'templates' ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal icm-modal-small">
            <div className="icm-modal-head">
              <div>
                <div className="icm-modal-title">选择报告模板</div>
                <div className="icm-modal-sub">{selectedTemplate || '未选择模板'}</div>
              </div>
              <button className="icm-modal-close" type="button" onClick={() => setModal(null)} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="icm-reference-list">
              {reports.templates.map((template) => (
                <button className={`icm-reference-row ${selectedTemplate === template ? 'active' : ''}`} key={template} type="button" onClick={() => { setSelectedTemplate(template); setFlow('editing'); setAuditStep(-1) }}>
                  <span className="icm-reference-check">{selectedTemplate === template ? '✓' : ''}</span>
                  <span>
                    <strong>{template}</strong>
                    <em>目录、审核流、报送口径、归档分类</em>
                  </span>
                  <Tag tone={selectedTemplate === template ? 'blue' : 'gray'}>{selectedTemplate === template ? '已选' : '模板'}</Tag>
                </button>
              ))}
            </div>
            <div className="icm-modal-foot">
              <span>{selectedTemplate || '请选择模板'}</span>
              <Button type="primary" disabled={!selectedTemplate} onClick={() => setModal(null)}>确认模板</Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  )
}
