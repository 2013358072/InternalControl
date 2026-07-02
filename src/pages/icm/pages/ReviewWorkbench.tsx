import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Bot, CheckCircle2, FileText, FileUp, GitPullRequestArrow, Loader2, Play, RotateCcw, Settings2, ShieldCheck, X } from 'lucide-react'

import { toast } from '@heroui/react'

import { knowledge, rules as stdRules } from '../data'
import { Button, Card, DataTable, DetailLine, PageFrame, Tag, Toolbar } from '../components/IcmPageKit'

type TaskId = 'purchase' | 'contract' | 'payment' | 'supplier'

const reviewTasks = [
  {
    id: 'purchase' as TaskId,
    no: 'RV-2026-018',
    name: '采购围标风险专项审查',
    unit: '华北装备制造集团西北分公司',
    domain: '采购',
    status: '待审查',
    dataStatus: '已就绪',
    scope: '2026 年 1-5 月工程物资采购、招标评审、合同签订事项',
    packages: ['采购合同结果包', '招标评分结果包', '供应商准入资料'],
    rules: ['采购招标异常检查标准', '供应商关联关系检查标准'],
    basis: ['集团采购管理办法第 18 条', '招投标合规指引第 12 条'],
    recommendedAgents: ['procure', 'supplier'],
  },
  {
    id: 'contract' as TaskId,
    no: 'RV-2026-019',
    name: '合同签订合规审查',
    unit: '华北装备制造集团西北分公司',
    domain: '合同',
    status: '待审查',
    dataStatus: '已就绪',
    scope: '采购合同、补充协议、审批记录与合同变更事项',
    packages: ['合同台账结果包', '审批记录结果包'],
    rules: ['合同审批链完整性检查', '补充协议异常检查'],
    basis: ['合同管理办法第 11 条', '授权审批指引第 6 条'],
    recommendedAgents: ['contract'],
  },
  {
    id: 'payment' as TaskId,
    no: 'RV-2026-020',
    name: '资金付款异常审查',
    unit: '华北装备制造集团西北分公司',
    domain: '资金',
    status: '待审查',
    dataStatus: '待补充',
    scope: '合同付款、预付款、验收前付款与审批流水',
    packages: ['资金付款结果包', '合同台账结果包'],
    rules: ['合同付款异常检查标准'],
    basis: ['资金支付制度第 8 条'],
    recommendedAgents: ['payment'],
  },
  {
    id: 'supplier' as TaskId,
    no: 'RV-2026-021',
    name: '供应商关联关系审查',
    unit: '华北装备制造集团西北分公司',
    domain: '供应商',
    status: '待审查',
    dataStatus: '已就绪',
    scope: '供应商准入、报名供应商、历史投标与联系人信息',
    packages: ['供应商准入资料', '招标评分结果包'],
    rules: ['供应商关联关系检查标准'],
    basis: ['供应商管理细则第 9 条'],
    recommendedAgents: ['supplier'],
  },
]

const agentCatalog = [
  { id: 'procure', name: '采购审查智能体', domain: '采购', defaultRuleset: '采购招标异常规则包', ability: '识别拆分采购、短周期连续合同、金额接近阈值。' },
  { id: 'contract', name: '合同审查智能体', domain: '合同', defaultRuleset: '合同审批完整性规则包', ability: '核查合同审批链、补充协议、授权边界。' },
  { id: 'payment', name: '资金审查智能体', domain: '资金', defaultRuleset: '资金付款异常规则包', ability: '比对合同约定比例、实际付款、验收节点。' },
  { id: 'supplier', name: '供应商关联核验智能体', domain: '供应商', defaultRuleset: '供应商关联关系规则包', ability: '比对联系人、账户、地址、文件元数据和历史投标。' },
]

// 可选规则包（从标准库规则按领域聚合）
const availableRulesets = [
  { name: '采购招标异常规则包', rules: ['STD-CG-001'], label: '围标串标、拆分采购、应招未招' },
  { name: '供应商关联关系规则包', rules: ['STD-SUP-002'], label: '供应商联系人/地址/账户重合识别' },
  { name: '合同审批完整性规则包', rules: ['STD-HT-001'], label: '审批链缺失、补充协议、授权边界' },
  { name: '资金付款异常规则包', rules: ['STD-PAY-003'], label: '超比例付款、越权审批、验收前置' },
  { name: '投资方向偏离规则包', rules: ['STD-HR-001'], label: '主责主业偏离、无关多元化投资' },
  { name: '财务信息质量规则包', rules: ['STD-HR-002'], label: '合并范围调整、潜亏挂账、虚构业务' },
  { name: '产权变动合规规则包', rules: ['STD-HR-003'], label: '产权交易决策审批、未进场交易' },
  { name: '薪酬违规发放规则包', rules: ['STD-HR-004'], label: '超发工资、违规自定薪酬、兼职取酬' },
  { name: '金融风险敞口规则包', rules: ['STD-HR-005'], label: '偏离主业投资、承担刚兑损失' },
  { name: '境外资产监管规则包', rules: ['STD-HR-006'], label: '境内决策审批缺失、数据未回传' },
]

const steps = ['读取任务数据包', '匹配检查标准库规则', '调用知识库法规与案例', '运行字段比对与相似度识别', '生成疑似问题', '等待人工复核']

type Finding = { title: string; level: string; rule: string; confidence: number; basis: string; evidence: string; amount?: string; ruleId?: string }

const findingsByTask: Record<TaskId, Finding[]> = {
  purchase: [
    { title: '三份合同疑似拆分采购规避公开招标', level: '重大', rule: '采购招标异常检查标准', confidence: 92, basis: '集团采购管理办法第 18 条', evidence: 'HT-1182/1183/1184 合同金额与签订日期', amount: '1,180 万', ruleId: 'STD-CG-001' },
    { title: '两家供应商报价与联系人异常相似', level: '重要', rule: '供应商关联关系检查标准', confidence: 84, basis: '招投标合规指引第 12 条', evidence: '投标文件元数据、联系人手机号', amount: '395 万', ruleId: 'STD-SUP-002' },
  ],
  contract: [
    { title: '补充协议签订未见完整审批记录', level: '重要', rule: '合同审批链完整性检查', confidence: 81, basis: '合同管理办法第 11 条', evidence: '补充协议 SP-2026-044 审批节点缺失', amount: '620 万', ruleId: 'STD-HT-001' },
  ],
  payment: [
    { title: '中标后预付款比例超合同约定', level: '重大', rule: '合同付款异常检查标准', confidence: 88, basis: '资金支付制度第 8 条', evidence: '合同约定 30%，实际预付 50%', amount: '620 万', ruleId: 'STD-PAY-003' },
  ],
  supplier: [
    { title: '报名供应商联系人与账户信息存在重合', level: '重要', rule: '供应商关联关系检查标准', confidence: 86, basis: '供应商管理细则第 9 条', evidence: '供应商 A/B 联系人、账户尾号重复', amount: '390 万', ruleId: 'STD-SUP-002' },
  ],
}

/** SRS 模块六 6.1：按金额自动定级 */
function determineIssueLevel(amountStr?: string): { level: string; label: string } {
  if (!amountStr) return { level: '一般', label: '一般缺陷（<1000万）' }
  const amount = parseFloat(amountStr.replace(/[,，\s]万/g, ''))
  if (amount >= 5000) return { level: '重大', label: '重大缺陷（>5000万/舞弊嫌疑）' }
  if (amount >= 1000) return { level: '重要', label: '重要缺陷（1000-5000万）' }
  return { level: '一般', label: '一般缺陷（<1000万）' }
}

/** 自动匹配责任部门（SRS 模块六 6.1：按领域匹配） */
function matchDepartment(rule: string): string {
  if (rule.includes('采购') || rule.includes('招标')) return '采购管理部'
  if (rule.includes('供应商')) return '供应链管理部'
  if (rule.includes('合同') || rule.includes('审批')) return '合同管理部 / 法务部'
  if (rule.includes('付款') || rule.includes('资金')) return '财务部'
  return '内控监督部'
}

export default function ReviewWorkbench() {
  const [taskId, setTaskId] = useState<TaskId>('purchase')
  const task = reviewTasks.find((item) => item.id === taskId) ?? reviewTasks[0]
  const [selectedAgents, setSelectedAgents] = useState<string[]>(task.recommendedAgents)
  const [running, setRunning] = useState(false)
  const [stepIndex, setStepIndex] = useState(-1)
  const [done, setDone] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [runningAgentId, setRunningAgentId] = useState<string>()

  // 每个智能体的规则包配置 <agentId, rulesetName>
  const [agentRulesets, setAgentRulesets] = useState<Record<string, string>>(
    () => Object.fromEntries(agentCatalog.map((a) => [a.id, a.defaultRuleset])),
  )
  const [rulesetModalAgentId, setRulesetModalAgentId] = useState<string>()

  // 闭环弹窗状态
  const [basisTarget, setBasisTarget] = useState<Finding | null>(null)
  const [workpaperTarget, setWorkpaperTarget] = useState<Finding | null>(null)
  const [issueTarget, setIssueTarget] = useState<Finding | null>(null)

  // 追踪已操作行
  const [workpaperDoneIds, setWorkpaperDoneIds] = useState<Set<string>>(new Set())
  const [issueDoneIds, setIssueDoneIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedAgents(task.recommendedAgents)
    setRunning(false)
    setStepIndex(-1)
    setDone(false)
    setRunningAgentId(undefined)
    setBasisTarget(null)
    setWorkpaperTarget(null)
    setIssueTarget(null)
  }, [task.id])

  useEffect(() => {
    if (!running) return
    if (stepIndex >= steps.length - 1) {
      const timer = window.setTimeout(() => {
        setRunning(false)
        setDone(true)
        setRunningAgentId(undefined)
      }, 650)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setStepIndex((value) => value + 1), 650)
    return () => window.clearTimeout(timer)
  }, [running, stepIndex])

  const selectedAgentInfo = useMemo(
    () => agentCatalog.filter((agent) => selectedAgents.includes(agent.id)),
    [selectedAgents],
  )

  // 勾选/取消勾选智能体
  const toggleAgent = (id: string) => {
    if (running) return
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // 点击开始审查
  const startReview = () => {
    if (!selectedAgents.length) return
    setDone(false)
    setStepIndex(0)
    setRunning(true)
    setRunningAgentId(undefined)
    setWorkpaperDoneIds(new Set())
    setIssueDoneIds(new Set())
  }

  const resetReview = () => {
    setRunning(false)
    setStepIndex(-1)
    setDone(false)
    setRunningAgentId(undefined)
    setWorkpaperDoneIds(new Set())
    setIssueDoneIds(new Set())
  }

  // ====== 闭环操作 ======

  /** 查看依据 → 查找对应标准规则 + 知识库法规 */
  const getRuleDetail = (finding: Finding) => {
    const stdRule = stdRules.find((r) => r.id === finding.ruleId) ?? stdRules.find((r) => r.name === finding.rule)
    const clause = knowledge.clauses.find((c) => c.id === stdRule?.linkedClauseId)
    return { stdRule, clause }
  }

  /** 生成底稿 */
  const confirmWorkpaper = (finding: Finding) => {
    const key = `${taskId}-${finding.title}`
    setWorkpaperDoneIds((prev) => new Set([...prev, key]))
    setWorkpaperTarget(null)
    toast.success(`底稿已生成：${finding.title}核查底稿 → 进入底稿管理查看`)
  }

  /** 转问题 */
  const confirmIssue = (finding: Finding) => {
    const key = `${taskId}-${finding.title}`
    setIssueDoneIds((prev) => new Set([...prev, key]))
    setIssueTarget(null)
    toast.success(`问题已转入台账：${finding.title} → 进入问题台账查看`)
  }

  const findings = done ? findingsByTask[taskId] : []

  return (
    <PageFrame
      title="智能审查"
      subtitle="以审查任务为入口，选择智能体运行规则和知识库依据，输出可复核、可追溯的问题线索。"
    >
      <Toolbar>
        <select className="icm-select" value={task.domain} disabled>
          <option>{task.domain}</option>
        </select>
        <Tag tone={done ? 'green' : running ? 'blue' : 'amber'}>{done ? '审查完成' : running ? '智能体运行中' : '待发起审查'}</Tag>
        <Tag tone="blue">已选智能体 {selectedAgents.length} 个</Tag>
        <span className="icm-toolbar-spacer" />
        <Button type="info-soft" icon={<FileText size={15} />} onClick={() => setPlanOpen(true)}>校审计划附件</Button>
        <Button type="primary" icon={running ? <Loader2 className="icm-spin" size={16} /> : <Play size={16} />} disabled={running || !selectedAgents.length} onClick={() => startReview()}>
          {running ? '审查中' : '开始审查'}
        </Button>
        <Button type="primary-soft" icon={<RotateCcw size={16} />} onClick={resetReview}>重新审查</Button>
      </Toolbar>

      <div className="icm-grid icm-review-layout" style={{ gridTemplateColumns: '280px minmax(0,1fr) 320px' }}>
        {/* ── 左侧：审查任务列表 ── */}
        <Card title="审查任务" note="选择一个任务后自动推荐智能体">
          <div className="icm-review-task-list">
            {reviewTasks.map((item) => (
              <button className={`icm-review-task-row ${task.id === item.id ? 'active' : ''}`} key={item.id} onClick={() => setTaskId(item.id)} type="button">
                <div className="icm-review-task-main">
                  <div className="icm-list-title">{item.name}</div>
                  <div className="icm-review-task-meta">
                    <span>{item.no}</span>
                    <span>{item.unit}</span>
                    <span>{item.domain}</span>
                    <span>{item.dataStatus}</span>
                  </div>
                </div>
                <span className={`icm-review-task-status ${item.dataStatus === '已就绪' ? 'ready' : 'blocked'}`}>{item.status}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* ── 中间：审查详情 + 疑似问题 ── */}
        <div className="icm-grid icm-review-middle">
          <Card title="审查详情" note={task.no}>
            <div className="icm-review-context">
              <div>
                <strong>{task.name}</strong>
                <span>{task.no} · {task.unit}</span>
              </div>
              <button type="button" onClick={() => setPlanOpen(true)}>
                <FileText size={15} />
                预览校审计划
              </button>
            </div>

            <div className="icm-grid cols-2">
              <DataTable
                columns={['审查范围', '内容']}
                rows={[
                  ['业务范围', task.scope],
                  ['数据包', task.packages.join(' / ')],
                  ['适用规则', task.rules.join(' / ')],
                  ['引用依据', task.basis.join(' / ')],
                ]}
              />
              <DataTable
                columns={['智能体', '规则包']}
                rows={selectedAgentInfo.map((agent) => [
                  agent.name,
                  agent.defaultRuleset,
                ])}
              />
            </div>
            {done || running ? (
              <div className="icm-review-agent-line">
                {done ? <Tag tone="green">已生成疑似问题</Tag> : <Tag tone="blue">审查中</Tag>}
              </div>
            ) : null}
          </Card>

          {done ? (
            <Card title="疑似问题" note="可生成底稿、查看依据或转问题台账">
              <DataTable
                columns={['问题', '等级', '命中规则', '置信度', '依据', '动作']}
                rows={findings.map((item) => {
                  const wpKey = `${taskId}-${item.title}`
                  const isKey = `${taskId}-${item.title}`
                  const wpDone = workpaperDoneIds.has(wpKey)
                  const issDone = issueDoneIds.has(isKey)
                  return [
                    <div>
                      <div className="icm-list-title">{item.title}</div>
                      <div className="icm-list-meta">{item.evidence}</div>
                    </div>,
                    <Tag tone={item.level === '重大' ? 'red' : 'amber'}>{item.level}</Tag>,
                    item.rule,
                    `${item.confidence}%`,
                    item.basis,
                    <div className="icm-row-actions">
                      <button type="button" disabled={wpDone} onClick={() => setWorkpaperTarget(item)}>
                        <FileUp size={12} /> {wpDone ? '已生成' : '生成底稿'}
                      </button>
                      <button type="button" onClick={() => setBasisTarget(item)}>
                        <BookOpen size={12} /> 查看依据
                      </button>
                      <button type="button" disabled={issDone} onClick={() => setIssueTarget(item)}>
                        <GitPullRequestArrow size={12} /> {issDone ? '已转台账' : '转问题'}
                      </button>
                    </div>,
                  ]
                })}
              />
            </Card>
          ) : null}
        </div>

        {/* ── 右侧：智能体选择 ── */}
        <Card title="智能体选择" note="勾选智能体后点击上方「开始审查」运行">
          <div className="icm-agent-list">
            {agentCatalog.map((agent) => {
              const checked = selectedAgents.includes(agent.id)
              const activeRun = running && checked
              const currentRuleset = agentRulesets[agent.id] ?? agent.defaultRuleset
              const hitCount = done && checked ? findingsByTask[task.id].filter((item) => item.rule.includes(agent.domain) || (agent.id === 'procure' && task.id === 'purchase')).length : 0
              return (
                <div className={`icm-agent-card ${checked ? 'active' : ''}`} key={agent.id} role="group">
                  <span className="icm-agent-check" onClick={() => toggleAgent(agent.id)} style={{ cursor: 'pointer' }}>{checked ? '✓' : ''}</span>
                  <span className="icm-agent-main" onClick={() => toggleAgent(agent.id)} style={{ cursor: 'pointer' }}>
                    <strong><Bot size={14} /> {agent.name}</strong>
                    <em>{agent.ability}</em>
                    <b>{currentRuleset}</b>
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <Tag tone={activeRun ? 'blue' : done && checked ? 'green' : checked ? 'amber' : 'gray'}>
                      {activeRun ? '运行中' : done && checked ? `命中 ${hitCount}条` : checked ? '已选择' : '选择'}
                    </Tag>
                    <button
                      type="button"
                      className="icm-agent-config-btn"
                      onClick={(e) => { e.stopPropagation(); setRulesetModalAgentId(agent.id) }}
                      title="配置规则包"
                    >
                      <Settings2 size={12} /> 规则包
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="icm-agent-summary">
            <ShieldCheck size={18} />
            <span>勾选智能体后，点击上方「开始审查」运行审查流程，完成后生成疑似问题。</span>
          </div>
        </Card>
      </div>

      {/* ── 审查运行动画弹窗 ── */}
      {running ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal icm-modal-small">
            <div className="icm-modal-head">
              <div>
                <div className="icm-modal-title">智能审查运行中</div>
                <div className="icm-modal-sub">{task.name}</div>
              </div>
              <Loader2 className="icm-spin" size={18} />
            </div>
            <div className="icm-review-run-panel">
              {steps.map((step, index) => {
                const status = index < stepIndex ? '完成' : index === stepIndex ? '运行中' : '等待'
                return (
                  <div className={`icm-review-run-step ${status === '运行中' ? 'active' : status === '完成' ? 'done' : ''}`} key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                    <em>
                      {status === '运行中' ? <Loader2 className="icm-spin" size={13} /> : status === '完成' ? <CheckCircle2 size={13} /> : null}
                      {status}
                    </em>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 校审计划附件弹窗 ── */}
      {planOpen ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal icm-modal-small">
            <div className="icm-modal-head">
              <div>
                <div className="icm-modal-title">校审计划附件</div>
                <div className="icm-modal-sub">{task.name} · {task.no}</div>
              </div>
              <button className="icm-modal-close" type="button" onClick={() => setPlanOpen(false)} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="icm-plan-preview">
              <h3>{task.name}</h3>
              <p>受检单位：{task.unit}</p>
              <p>审查范围：{task.scope}</p>
              <p>数据包：{task.packages.join('、')}</p>
              <p>适用规则：{task.rules.join('、')}</p>
              <p>引用依据：{task.basis.join('、')}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ══════════════════════════════════════════
          闭环弹窗一：查看依据（SRS 模块三/十）
          ══════════════════════════════════════════ */}
      {basisTarget ? (() => {
        const { stdRule, clause } = getRuleDetail(basisTarget)
        return (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal icm-modal-small">
              <div className="icm-modal-head">
                <div>
                  <div className="icm-modal-title">审查依据详情</div>
                  <div className="icm-modal-sub">{basisTarget.title}</div>
                </div>
                <button className="icm-modal-close" type="button" onClick={() => setBasisTarget(null)} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: 18, display: 'grid', gap: 14 }}>
                {/* 规则命中信息 */}
                <div style={{ border: '1px solid #e2eaf5', borderRadius: 8, background: '#fbfdff', padding: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0b1f43', marginBottom: 8 }}>命中规则</div>
                  <DetailLine label="规则名称" value={stdRule?.name ?? basisTarget.rule} />
                  <DetailLine label="规则条件" value={stdRule?.condition ?? '——'} />
                  <DetailLine label="适用场景" value={stdRule?.applicableScenario ?? '——'} />
                  <DetailLine label="风险权重" value={stdRule ? `${stdRule.riskWeight}` : '——'} />
                  <DetailLine label="置信度" value={`${basisTarget.confidence}%`} />
                </div>

                {/* 法规依据 */}
                {clause ? (
                  <div style={{ border: '1px solid #e2eaf5', borderRadius: 8, background: '#fbfdff', padding: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0b1f43', marginBottom: 8 }}>法规依据</div>
                    <DetailLine label="法规名称" value={clause.title} />
                    <DetailLine label="条款号" value={clause.clauseNo ?? '——'} />
                    <DetailLine label="发布机构" value={clause.issuer ?? '——'} />
                    <DetailLine label="生效日期" value={clause.effectiveDate ?? '——'} />
                    <DetailLine label="版本" value={clause.version ?? '——'} />
                    <DetailLine label="结构化状态" value={<Tag tone={clause.structureStatus === '已结构化' ? 'green' : 'amber'}>{clause.structureStatus}</Tag>} />
                    <DetailLine label="条款摘要" value={clause.summary} />
                  </div>
                ) : (
                  <div className="icm-empty-inline">未在知识库中找到关联法规条款。建议补充法规录入。</div>
                )}

                {/* 审查智能体信息 */}
                <div style={{ border: '1px solid #e2eaf5', borderRadius: 8, background: '#fbfdff', padding: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0b1f43', marginBottom: 8 }}>执行智能体</div>
                  <DetailLine label="命中规则" value={basisTarget.rule} />
                  <DetailLine label="规则来源" value={stdRule?.sourceType ?? '检查标准库'} />
                  <DetailLine label="证据样本" value={basisTarget.evidence} />
                </div>
              </div>
              <div className="icm-modal-foot">
                <span>规则来源：检查标准库 / 知识库同步；依据标注遵循SRS规则K3</span>
                <Button type="primary" icon={<BookOpen size={15} />} onClick={() => setBasisTarget(null)}>关闭</Button>
              </div>
            </div>
          </div>
        )
      })() : null}

      {/* ══════════════════════════════════════════
          闭环弹窗二：生成底稿（SRS 模块五 5.1/5.2）
          ══════════════════════════════════════════ */}
      {workpaperTarget ? (() => {
        const wpId = `WP-${taskId.toUpperCase()}-${Date.now().toString(36).slice(-4)}`
        const now = new Date().toLocaleString('zh-CN', { hour12: false })
        return (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal">
              <div className="icm-modal-head">
                <div>
                  <div className="icm-modal-title">生成检查底稿</div>
                  <div className="icm-modal-sub">基于审查线索自动生成底稿草稿，确认后进入底稿管理流程</div>
                </div>
                <button className="icm-modal-close" type="button" onClick={() => setWorkpaperTarget(null)} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: 18, display: 'grid', gap: 14, maxHeight: '60vh', overflow: 'auto' }}>
                {/* 底稿基本信息 */}
                <div style={{ border: '1px solid #e2eaf5', borderRadius: 8, background: '#fbfdff', padding: 12 }}>
                  <div className="icm-card-title" style={{ marginBottom: 8 }}>底稿基本信息</div>
                  <DetailLine label="底稿编号" value={wpId} />
                  <DetailLine label="底稿类型" value={<Tag tone="red">阳性底稿</Tag>} />
                  <DetailLine label="底稿来源" value={`智能审查线索 ${task.no}`} />
                  <DetailLine label="编制人" value="检查人员（当前用户）" />
                  <DetailLine label="创建时间" value={now} />
                  <DetailLine label="索引号" value={`CG-${task.domain.toUpperCase()}-${now.slice(5, 7)}${now.slice(8, 10)}`} />
                </div>

                {/* SRS 规则W1：底稿完整要素 */}
                <div className="icm-editor" style={{ minHeight: 220 }}>
                  <h2>{workpaperTarget.title}核查底稿</h2>
                  <h3>一、检查程序</h3>
                  <p>依据检查标准库规则「{workpaperTarget.rule}」及{workpaperTarget.basis}，对本审查任务范围内相关业务样本执行数据核验、附件调阅、审批链检查及必要访谈。具体程序包括：抽取目标时间段内全部合同台账，按项目编号、供应商、合同签订日期、合同金额进行聚合比对；调阅采购包划分审批记录、招标方案及评分表；核查付款审批节点与验收资料。</p>
                  <h3>二、取证事实</h3>
                  <p>经审查发现：{workpaperTarget.evidence}。{workpaperTarget.confidence > 85 ? '该事实经多方数据交叉验证，置信度较高，建议作为阳线性底稿定论。' : '当前证据尚需补充取证，建议先行形成底稿草稿，待补充证据后进入复核。'}</p>
                  <h3>三、复核结论</h3>
                  <p>该事项存在{workpaperTarget.level}控制缺陷——{workpaperTarget.title}。依据{workpaperTarget.basis}及SRS规定缺陷认定标准，该底稿应经一级复核（编制人自查）、二级复核（检查组长）、交叉复核后形成正式底稿结论，阳性底稿审定通过后进入问题管理流程。</p>
                  <h3>四、后续处理</h3>
                  <p>底稿审定通过后，系统将自动生成问题草稿并匹配责任部门为{matchDepartment(workpaperTarget.rule)}，按SRS规则P1要求关联本底稿作为问题来源。</p>
                </div>

                {/* 关联信息 */}
                <div style={{ border: '1px solid #e2eaf5', borderRadius: 8, background: '#fbfdff', padding: 12 }}>
                  <div className="icm-card-title" style={{ marginBottom: 8 }}>关联信息（SRS 五自动之数据溯源）</div>
                  <DetailLine label="审查线索编号" value={`SUS-${task.no.slice(-3)}`} />
                  <DetailLine label="命中规则" value={workpaperTarget.rule} />
                  <DetailLine label="数据快照" value={`SNAP-${task.domain.toUpperCase()}-${now.slice(0, 10).replace(/\//g, '')}`} />
                  <DetailLine label="关联数据包" value={task.packages.join(' / ')} />
                  <DetailLine label="取证要求" value="需调阅原始合同正本、招标方案审批表、付款审批单，形成完整证据链" />
                </div>
              </div>
              <div className="icm-modal-foot">
                <span>按SRS规则W1/W2/W4：阳性底稿含完整要素，3工作日内完成复核并转化问题</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="default-soft" onClick={() => setWorkpaperTarget(null)}>取消</Button>
                  <Button type="primary" icon={<FileUp size={15} />} onClick={() => confirmWorkpaper(workpaperTarget)}>确认生成底稿</Button>
                </div>
              </div>
            </div>
          </div>
        )
      })() : null}

      {/* ══════════════════════════════════════════
          闭环弹窗三：转问题（SRS 模块六 6.1/6.2）
          ══════════════════════════════════════════ */}
      {issueTarget ? (() => {
        const issueLevel = determineIssueLevel(issueTarget.amount)
        const dept = matchDepartment(issueTarget.rule)
        const issId = `ISS-${task.domain.toUpperCase()}-${Date.now().toString(36).slice(-4)}`
        const deadline = new Date(Date.now() + (issueLevel.level === '重大' ? 30 : issueLevel.level === '重要' ? 60 : 90) * 86400000).toISOString().slice(0, 10)
        const now = new Date().toLocaleString('zh-CN', { hour12: false })
        return (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal">
              <div className="icm-modal-head">
                <div>
                  <div className="icm-modal-title">转化问题台账</div>
                  <div className="icm-modal-sub">阳性底稿复核后自动生成问题草稿，确认后进入问题台账与整改闭环</div>
                </div>
                <button className="icm-modal-close" type="button" onClick={() => setIssueTarget(null)} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: 18, display: 'grid', gap: 14, maxHeight: '60vh', overflow: 'auto' }}>
                {/* 问题定级（SRS 模块六 6.1） */}
                <div style={{ border: '1px solid #f4c7c7', borderRadius: 8, background: '#fff8f8', padding: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#b91c1c', marginBottom: 8 }}>问题定级（SRS 缺陷认定标准）</div>
                  <DetailLine label="问题描述" value={issueTarget.title} />
                  <DetailLine label="涉及金额" value={issueTarget.amount ?? '待确认'} />
                  <DetailLine label="自动定级" value={<Tag tone={issueLevel.level === '重大' ? 'red' : 'amber'}>{issueLevel.label}</Tag>} />
                  <DetailLine label="定级依据" value="SRS模块六 6.1：重大缺陷（>5000万/舞弊嫌疑）、重要缺陷（1000-5000万）、一般缺陷（<1000万）" />
                  <DetailLine label="置信度" value={`${issueTarget.confidence}%`} />
                </div>

                {/* 问题草稿（SRS 模块六 6.1 完整要素） */}
                <div style={{ border: '1px solid #e2eaf5', borderRadius: 8, background: '#fbfdff', padding: 12 }}>
                  <div className="icm-card-title" style={{ marginBottom: 8 }}>问题草稿信息</div>
                  <div className="icm-grid cols-2">
                    <DetailLine label="问题编号" value={issId} />
                    <DetailLine label="问题分类" value={`${task.domain} / ${issueTarget.rule.slice(0, 10)}`} />
                    <DetailLine label="责任部门" value={dept} />
                    <DetailLine label="整改期限" value={`${deadline}（${issueLevel.level === '重大' ? 30 : issueLevel.level === '重要' ? 60 : 90}天）`} />
                    <DetailLine label="来源底稿" value={`WP-${taskId.toUpperCase()}-${Date.now().toString(36).slice(-4)}`} />
                    <DetailLine label="关联法规" value={issueTarget.basis} />
                    <DetailLine label="确认要求" value="需被检查单位5工作日内在线确认" />
                    <DetailLine label="创建时间" value={now} />
                  </div>
                </div>

                {/* 业务规则提示 */}
                <div style={{ border: '1px solid #c9dcff', borderRadius: 8, background: '#f6f9ff', padding: 12 }}>
                  <div className="icm-card-title" style={{ marginBottom: 8 }}>业务规则校验（SRS 模块六）</div>
                  <DetailLine label="SRS规则P1" value={<Tag tone="green">✓ 每个问题关联至少1份底稿</Tag>} />
                  <DetailLine label="SRS规则P2" value={<Tag tone="amber">⚠ 问题定级一经确认不得随意下调</Tag>} />
                  <DetailLine label="SRS规则R1" value={<Tag tone="blue">ℹ {issueLevel.level === '重大' ? '重大缺陷30天内完成整改' : issueLevel.level === '重要' ? '重要缺陷60天内完成整改' : '一般缺陷90天内完成整改'}</Tag>} />
                  <DetailLine label="SRS五自动" value={<Tag tone="blue">ℹ 确认后将自动派单至{matchDepartment(issueTarget.rule)}负责人</Tag>} />
                </div>
              </div>
              <div className="icm-modal-foot">
                <span>按SRS模块六/七：问题→整改→销号全流程留痕，满足终身追责要求</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="default-soft" onClick={() => setIssueTarget(null)}>取消</Button>
                  <Button type="primary" icon={<GitPullRequestArrow size={15} />} onClick={() => confirmIssue(issueTarget)}>确认转问题</Button>
                </div>
              </div>
            </div>
          </div>
        )
      })() : null}

      {/* ══════════════════════════════════════════
          规则包配置弹窗
          ══════════════════════════════════════════ */}
      {rulesetModalAgentId ? (() => {
        const agent = agentCatalog.find((a) => a.id === rulesetModalAgentId)!
        const current = agentRulesets[agent.id] ?? agent.defaultRuleset
        return (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal icm-modal-small">
              <div className="icm-modal-head">
                <div>
                  <div className="icm-modal-title">配置规则包</div>
                  <div className="icm-modal-sub">{agent.name} · 选择审查规则包</div>
                </div>
                <button className="icm-modal-close" type="button" onClick={() => setRulesetModalAgentId(undefined)} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>
              <div className="icm-reference-list">
                {availableRulesets.map((ruleset) => {
                  const selected = current === ruleset.name
                  return (
                    <button
                      className={`icm-reference-row ${selected ? 'active' : ''}`}
                      key={ruleset.name}
                      type="button"
                      onClick={() => {
                        setAgentRulesets((prev) => ({ ...prev, [agent.id]: ruleset.name }))
                        setRulesetModalAgentId(undefined)
                      }}
                    >
                      <span className="icm-reference-check">{selected ? '✓' : ''}</span>
                      <span>
                        <strong>{ruleset.name}</strong>
                        <em>{ruleset.label}</em>
                      </span>
                      <Tag tone={selected ? 'blue' : 'gray'}>{selected ? '当前' : '可选'}</Tag>
                    </button>
                  )
                })}
              </div>
              <div className="icm-modal-foot">
                <span>选择规则包后，审查时将调用对应标准库规则执行检查</span>
                <Button type="default-soft" onClick={() => setRulesetModalAgentId(undefined)}>关闭</Button>
              </div>
            </div>
          </div>
        )
      })() : null}
    </PageFrame>
  )
}
