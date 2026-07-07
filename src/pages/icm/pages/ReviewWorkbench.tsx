import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Bot, CheckCircle2, FileText, FileUp, GitPullRequestArrow, Loader2, Play, Search, Settings2, ShieldCheck, X } from 'lucide-react'

import { toast } from '@heroui/react'

import { knowledge, rules as stdRules } from '../data'
import { Button, Card, DataTable, DetailLine, PageFrame, Tag } from '../components/IcmPageKit'

type TaskId = 'purchase' | 'contract' | 'payment' | 'supplier'
type ReviewStage = 'task' | 'agent' | 'run' | 'result'

type Finding = { title: string; level: string; rule: string; confidence: number; basis: string; evidence: string; amount?: string; ruleId?: string }

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

const runSteps = ['读取任务数据包', '匹配检查标准库规则', '调用知识库法规与案例', '运行字段比对与相似度识别', '生成疑似问题', '等待人工复核']

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

function determineIssueLevel(amountStr?: string): { level: string; label: string } {
  if (!amountStr) return { level: '一般', label: '一般缺陷（<1000万）' }
  const amount = parseFloat(amountStr.replace(/[,，\s]万/g, ''))
  if (amount >= 5000) return { level: '重大', label: '重大缺陷（>5000万/舞弊嫌疑）' }
  if (amount >= 1000) return { level: '重要', label: '重要缺陷（1000-5000万）' }
  return { level: '一般', label: '一般缺陷（<1000万）' }
}

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
  const [stage, setStage] = useState<ReviewStage>('task')
  const [selectedAgents, setSelectedAgents] = useState<string[]>(task.recommendedAgents)
  const [running, setRunning] = useState(false)
  const [stepIndex, setStepIndex] = useState(-1)
  const [done, setDone] = useState(false)
  const [planTargetId, setPlanTargetId] = useState<TaskId | null>(null)
  const [agentRulesets, setAgentRulesets] = useState<Record<string, string>>(() => Object.fromEntries(agentCatalog.map((agent) => [agent.id, agent.defaultRuleset])))
  const [rulesetModalAgentId, setRulesetModalAgentId] = useState<string>()
  const [basisTarget, setBasisTarget] = useState<Finding | null>(null)
  const [workpaperTarget, setWorkpaperTarget] = useState<Finding | null>(null)
  const [issueTarget, setIssueTarget] = useState<Finding | null>(null)
  const [workpaperDoneIds, setWorkpaperDoneIds] = useState<Set<string>>(new Set())
  const [issueDoneIds, setIssueDoneIds] = useState<Set<string>>(new Set())
  const [taskSearch, setTaskSearch] = useState('')
  const [agentSearch, setAgentSearch] = useState('')

  const planTask = planTargetId ? (reviewTasks.find((t) => t.id === planTargetId) ?? task) : task

  useEffect(() => {
    setSelectedAgents(task.recommendedAgents)
    setRunning(false)
    setStepIndex(-1)
    setDone(false)
    setBasisTarget(null)
    setWorkpaperTarget(null)
    setIssueTarget(null)
    setWorkpaperDoneIds(new Set())
    setIssueDoneIds(new Set())
    setTaskSearch('')
    setAgentSearch('')
  }, [task.id])

  useEffect(() => {
    if (!running) return
    if (stepIndex >= runSteps.length - 1) {
      const timer = window.setTimeout(() => {
        setRunning(false)
        setDone(true)
        setStage('result')
      }, 650)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setStepIndex((value) => value + 1), 650)
    return () => window.clearTimeout(timer)
  }, [running, stepIndex])

  const selectedAgentInfo = useMemo(() => agentCatalog.filter((agent) => selectedAgents.includes(agent.id)), [selectedAgents])
  const findings = done ? findingsByTask[taskId] : []

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return reviewTasks
    const kw = taskSearch.trim().toLowerCase()
    return reviewTasks.filter((t) => t.name.toLowerCase().includes(kw) || t.no.toLowerCase().includes(kw) || t.unit.toLowerCase().includes(kw) || t.domain.toLowerCase().includes(kw))
  }, [taskSearch])

  const filteredAgents = useMemo(() => {
    if (!agentSearch.trim()) return agentCatalog
    const kw = agentSearch.trim().toLowerCase()
    return agentCatalog.filter((a) => a.name.toLowerCase().includes(kw) || a.domain.toLowerCase().includes(kw) || a.ability.toLowerCase().includes(kw))
  }, [agentSearch])

  const selectTask = (id: TaskId) => {
    if (id === taskId) return
    setTaskId(id)
    setStage('task')
    setRunning(false)
    setStepIndex(-1)
    setDone(false)
    setBasisTarget(null)
    setWorkpaperTarget(null)
    setIssueTarget(null)
    setWorkpaperDoneIds(new Set())
    setIssueDoneIds(new Set())
    setTaskSearch('')
    setAgentSearch('')
  }
  const toggleAgent = (id: string) => {
    if (running) return
    setSelectedAgents((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  const startReview = () => {
    if (!selectedAgents.length || task.dataStatus !== '已就绪') return
    setStage('run')
    setDone(false)
    setStepIndex(0)
    setRunning(true)
    setWorkpaperDoneIds(new Set())
    setIssueDoneIds(new Set())
  }

  const resetReview = () => {
    setStage('task')
    setRunning(false)
    setStepIndex(-1)
    setDone(false)
    setWorkpaperDoneIds(new Set())
    setIssueDoneIds(new Set())
  }

  const getRuleDetail = (finding: Finding) => {
    const stdRule = stdRules.find((rule) => rule.id === finding.ruleId) ?? stdRules.find((rule) => rule.name === finding.rule)
    const clause = knowledge.clauses.find((clauseItem) => clauseItem.id === stdRule?.linkedClauseId)
    return { stdRule, clause }
  }

  const confirmWorkpaper = (finding: Finding) => {
    const key = `${taskId}-${finding.title}`
    setWorkpaperDoneIds((prev) => new Set([...prev, key]))
    setWorkpaperTarget(null)
    toast.success(`底稿已生成：${finding.title}核查底稿`)
  }

  const confirmIssue = (finding: Finding) => {
    const key = `${taskId}-${finding.title}`
    setIssueDoneIds((prev) => new Set([...prev, key]))
    setIssueTarget(null)
    toast.success(`问题已转入台账：${finding.title}`)
  }

  const renderTaskStep = () => (
    <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 360px', alignItems: 'start' }}>
      <Card title="选择审查任务" note="点击任务行查看详情，支持关键字检索。">
        <div className="icm-modal-search" style={{ marginBottom: 10 }}>
          <Search size={14} />
          <input placeholder="输入关键字检索任务…" value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} />
        </div>
        <div className="icm-review-task-list">
          {filteredTasks.map((item) => {
            const active = taskId === item.id
            return (
              <button className={`icm-review-task-row ${active ? 'active' : ''}`} key={item.id} onClick={() => selectTask(item.id)} type="button">
                <div className="icm-review-task-main">
                  <div className="icm-review-task-head">
                    <strong className="icm-review-task-name">{item.name}</strong>
                  </div>
                  <div className="icm-review-task-meta">
                    <span>{item.no}</span>
                    <span>{item.unit}</span>
                    <span>{item.domain}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag tone={item.dataStatus === '已就绪' ? 'green' : 'amber'}>{item.dataStatus}</Tag>
                  <button className="icm-agent-config-btn" type="button" onClick={(e) => { e.stopPropagation(); setPlanTargetId(item.id) }}>
                    <FileText size={12} /> 附件
                  </button>
                </div>
              </button>
            )
          })}
        </div>
      </Card>
      <Card title="任务摘要" note={task.no} action={<Tag tone={task.dataStatus === '已就绪' ? 'green' : 'amber'}>{task.dataStatus}</Tag>}>
        <DetailLine label="审查范围" value={task.scope} />
        <DetailLine label="数据包" value={task.packages.join(' / ')} />
        <DetailLine label="适用规则" value={task.rules.join(' / ')} />
        <DetailLine label="引用依据" value={task.basis.join(' / ')} />
        <div className="icm-actions" style={{ marginTop: 14 }}>
          <Button type="primary" icon={<Play size={16} />} onClick={() => setStage('agent')}>下一步：配置智能体</Button>
        </div>
      </Card>
    </div>
  )

  const renderAgentStep = () => (
    <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px', alignItems: 'start' }}>
      <Card title="配置审查智能体" note="勾选智能体后点开始审查，支持关键字检索。">
        <div className="icm-modal-search" style={{ marginBottom: 10 }}>
          <Search size={14} />
          <input placeholder="输入关键字检索智能体…" value={agentSearch} onChange={(e) => setAgentSearch(e.target.value)} />
        </div>
        <div className="icm-agent-list">
          {filteredAgents.map((agent) => {
            const checked = selectedAgents.includes(agent.id)
            const currentRuleset = agentRulesets[agent.id] ?? agent.defaultRuleset
            return (
              <div className={`icm-agent-card ${checked ? 'active' : ''}`} key={agent.id} role="group">
                <span className="icm-agent-check" onClick={() => toggleAgent(agent.id)} style={{ cursor: 'pointer' }}>{checked ? '✓' : ''}</span>
                <span className="icm-agent-main" onClick={() => toggleAgent(agent.id)} style={{ cursor: 'pointer' }}>
                  <strong><Bot size={14} /> {agent.name}</strong>
                  <em>{agent.ability}</em>
                  <b>{currentRuleset}</b>
                </span>
                <button className="icm-agent-config-btn" type="button" onClick={() => setRulesetModalAgentId(agent.id)}>
                  <Settings2 size={12} /> 规则包
                </button>
              </div>
            )
          })}
        </div>
      </Card>
      <Card title="本次审查配置" note="确认后开始执行审查">
        <DetailLine label="审查任务" value={task.name} />
        <DetailLine label="已选智能体" value={`${selectedAgents.length} 个`} />
        <DataTable columns={['智能体', '规则包']} rows={selectedAgentInfo.map((agent) => [agent.name, agentRulesets[agent.id] ?? agent.defaultRuleset])} />
        <div className="icm-actions" style={{ marginTop: 14 }}>
          <Button type="default-soft" onClick={() => setStage('task')}>上一步</Button>
          <Button type="primary" icon={<Play size={16} />} disabled={!selectedAgents.length || task.dataStatus !== '已就绪'} onClick={startReview}>开始审查</Button>
        </div>
      </Card>
    </div>
  )

  const renderRunStep = () => (
    <Card title="执行审查" note="系统正在按规则包处理数据，完成后自动进入结果处理。" action={<Tag tone="blue">运行中</Tag>}>
      <div className="icm-review-run-panel">
        {runSteps.map((step, index) => {
          const status = index < stepIndex ? '完成' : index === stepIndex ? '运行中' : '等待'
          return (
            <div className={`icm-review-run-step ${status === '运行中' ? 'active' : status === '完成' ? 'done' : ''}`} key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
              <em>{status === '运行中' ? <Loader2 className="icm-spin" size={13} /> : status === '完成' ? <CheckCircle2 size={13} /> : null}{status}</em>
            </div>
          )
        })}
      </div>
    </Card>
  )

  const renderResultStep = () => (
    <Card title="审查结果处理" note="线索不能直接定案，需查看依据、生成底稿，再按复核结论确认问题。" action={<Tag tone="green">审查完成</Tag>}>
      <DataTable
        columns={['问题线索', '等级', '命中规则', '置信度', '下一步操作']}
        rows={findings.map((item) => {
          const key = `${taskId}-${item.title}`
          const wpDone = workpaperDoneIds.has(key)
          const issueDone = issueDoneIds.has(key)
          return [
            <div><div className="icm-list-title">{item.title}</div><div className="icm-list-meta">{item.evidence}</div></div>,
            <Tag tone={item.level === '重大' ? 'red' : 'amber'}>{item.level}</Tag>,
            item.rule,
            `${item.confidence}%`,
            <div className="icm-row-actions">
              <button type="button" onClick={() => setBasisTarget(item)}><BookOpen size={12} /> 查看依据</button>
              <button type="button" disabled={wpDone} onClick={() => setWorkpaperTarget(item)}><FileUp size={12} /> {wpDone ? '已生成底稿' : '生成底稿'}</button>
              <button type="button" disabled={issueDone} onClick={() => setIssueTarget(item)}><GitPullRequestArrow size={12} /> {issueDone ? '已转台账' : '转问题'}</button>
            </div>,
          ]
        })}
      />
    </Card>
  )

  const renderStage = () => {
    if (stage === 'task') return renderTaskStep()
    if (stage === 'agent') return renderAgentStep()
    if (stage === 'run') return renderRunStep()
    return renderResultStep()
  }

  return (
    <PageFrame
      title="智能审查"
      subtitle="按任务、配置、执行、结果处理的顺序推进，避免在多个面板中来回拼流程。"
    >
      {stage !== 'run' ? (
        <div className="icm-review-context">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {stage !== 'task' ? (
              <Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={() => setStage('task')}>返回</Button>
            ) : null}
            <div>
              <strong>{task.name}</strong>
              <span>{task.no} · {task.unit} · {task.domain}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag tone={done ? 'green' : running ? 'blue' : 'amber'}>{done ? '审查完成' : running ? '审查运行中' : '待审查'}</Tag>
            <Tag tone={task.dataStatus === '已就绪' ? 'green' : 'amber'}>数据{task.dataStatus}</Tag>
          </div>
        </div>
      ) : (
        <div className="icm-review-context">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={() => setStage('task')}>返回</Button>
            <div>
              <strong>{task.name}</strong>
              <span>{task.no} · {task.unit} · {task.domain}</span>
            </div>
          </div>
          <Tag tone="blue">审查运行中</Tag>
        </div>
      )}


      {renderStage()}

      {planTargetId ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal icm-modal-small">
            <div className="icm-modal-head">
              <div><div className="icm-modal-title">校审计划附件</div><div className="icm-modal-sub">{planTask.name} · {planTask.no}</div></div>
              <button className="icm-modal-close" type="button" onClick={() => setPlanTargetId(null)} aria-label="关闭"><X size={16} /></button>
            </div>
            <div className="icm-plan-preview">
              <h3>{planTask.name}</h3>
              <p>受检单位：{planTask.unit}</p>
              <p>审查范围：{planTask.scope}</p>
              <p>数据包：{planTask.packages.join('、')}</p>
              <p>适用规则：{planTask.rules.join('、')}</p>
              <p>引用依据：{planTask.basis.join('、')}</p>
            </div>
          </div>
        </div>
      ) : null}

      {basisTarget ? (() => {
        const { stdRule, clause } = getRuleDetail(basisTarget)
        return (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal icm-modal-small">
              <div className="icm-modal-head">
                <div><div className="icm-modal-title">审查依据详情</div><div className="icm-modal-sub">{basisTarget.title}</div></div>
                <button className="icm-modal-close" type="button" onClick={() => setBasisTarget(null)} aria-label="关闭"><X size={16} /></button>
              </div>
              <div style={{ padding: 18, display: 'grid', gap: 14 }}>
                <Card title="命中规则" note="来自检查标准库">
                  <DetailLine label="规则名称" value={stdRule?.name ?? basisTarget.rule} />
                  <DetailLine label="判定条件" value={stdRule?.condition ?? '——'} />
                  <DetailLine label="适用场景" value={stdRule?.applicableScenario ?? '——'} />
                  <DetailLine label="置信度" value={`${basisTarget.confidence}%`} />
                </Card>
                <Card title="法规依据" note="来自知识库">
                  <DetailLine label="法规名称" value={clause?.title ?? basisTarget.basis} />
                  <DetailLine label="条款号" value={clause?.clauseNo ?? '——'} />
                  <DetailLine label="条款摘要" value={clause?.summary ?? '未在知识库中找到结构化条款。'} />
                </Card>
              </div>
            </div>
          </div>
        )
      })() : null}

      {workpaperTarget ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal">
            <div className="icm-modal-head">
              <div><div className="icm-modal-title">生成检查底稿</div><div className="icm-modal-sub">确认后进入底稿管理流程</div></div>
              <button className="icm-modal-close" type="button" onClick={() => setWorkpaperTarget(null)} aria-label="关闭"><X size={16} /></button>
            </div>
            <div style={{ padding: 18, display: 'grid', gap: 14 }}>
              <DetailLine label="底稿类型" value={<Tag tone="red">阳性底稿</Tag>} />
              <DetailLine label="底稿来源" value={`智能审查线索 ${task.no}`} />
              <DetailLine label="命中规则" value={workpaperTarget.rule} />
              <div className="icm-editor" style={{ minHeight: 180 }}>
                <h2>{workpaperTarget.title}核查底稿</h2>
                <h3>一、检查程序</h3>
                <p>依据「{workpaperTarget.rule}」对相关数据包、审批链和业务附件进行核验。</p>
                <h3>二、取证事实</h3>
                <p>{workpaperTarget.evidence}</p>
                <h3>三、复核结论</h3>
                <p>该事项形成阳性底稿草稿，需进入复核链路后确认是否转化为问题。</p>
              </div>
            </div>
            <div className="icm-modal-foot"><span>生成后可在底稿与问题模块继续复核。</span><Button type="primary" icon={<FileUp size={15} />} onClick={() => confirmWorkpaper(workpaperTarget)}>确认生成底稿</Button></div>
          </div>
        </div>
      ) : null}

      {issueTarget ? (() => {
        const issueLevel = determineIssueLevel(issueTarget.amount)
        const dept = matchDepartment(issueTarget.rule)
        return (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal icm-modal-small">
              <div className="icm-modal-head">
                <div><div className="icm-modal-title">确认问题</div><div className="icm-modal-sub">确认后进入整改闭环</div></div>
                <button className="icm-modal-close" type="button" onClick={() => setIssueTarget(null)} aria-label="关闭"><X size={16} /></button>
              </div>
              <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                <DetailLine label="问题描述" value={issueTarget.title} />
                <DetailLine label="自动定级" value={<Tag tone={issueLevel.level === '重大' ? 'red' : 'amber'}>{issueLevel.label}</Tag>} />
                <DetailLine label="责任部门" value={dept} />
                <DetailLine label="法规依据" value={issueTarget.basis} />
              </div>
              <div className="icm-modal-foot"><span>确认后自动生成问题草稿并关联底稿。</span><Button type="primary" icon={<GitPullRequestArrow size={15} />} onClick={() => confirmIssue(issueTarget)}>确认转问题</Button></div>
            </div>
          </div>
        )
      })() : null}

      {rulesetModalAgentId ? (() => {
        const agent = agentCatalog.find((item) => item.id === rulesetModalAgentId)!
        const current = agentRulesets[agent.id] ?? agent.defaultRuleset
        return (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal icm-modal-small">
              <div className="icm-modal-head">
                <div><div className="icm-modal-title">配置规则包</div><div className="icm-modal-sub">{agent.name}</div></div>
                <button className="icm-modal-close" type="button" onClick={() => setRulesetModalAgentId(undefined)} aria-label="关闭"><X size={16} /></button>
              </div>
              <div className="icm-reference-list">
                {availableRulesets.map((ruleset) => {
                  const selected = current === ruleset.name
                  return (
                    <button className={`icm-reference-row ${selected ? 'active' : ''}`} key={ruleset.name} type="button" onClick={() => { setAgentRulesets((prev) => ({ ...prev, [agent.id]: ruleset.name })); setRulesetModalAgentId(undefined) }}>
                      <span className="icm-reference-check">{selected ? '✓' : ''}</span>
                      <span><strong>{ruleset.name}</strong><em>{ruleset.label}</em></span>
                      <Tag tone={selected ? 'blue' : 'gray'}>{selected ? '当前' : '可选'}</Tag>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })() : null}
    </PageFrame>
  )
}
