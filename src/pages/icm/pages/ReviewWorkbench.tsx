import { type ChangeEvent, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bot, BookOpen, FileDown, FileText, FileUp, GitPullRequestArrow, Search, Settings2, X } from 'lucide-react'

import { Button, Card, DataTable, DetailLine, PageFrame, Tag, type Tone } from '../components/IcmPageKit'
import { useWorkflowStore } from '../store/workflowStore'

type TaskId = 'purchase' | 'contract' | 'payment' | 'supplier'
type Finding = { title: string; level: string; rule: string; confidence: number; basis: string; evidence: string }
type AgentModel = { id: string; name: string; domain: string; description: string; baseModel: string; threshold: number; promptVersion: string }

const reviewTasks = [
  { id: 'purchase' as TaskId, no: 'RV-2026-018', name: '采购围标风险专项审查', unit: '华北装备制造集团西北分公司', domain: '采购', dataStatus: '已就绪', scope: '工程物资采购、招标评审、合同签订事项', packages: ['采购合同结果包', '招标评分结果包'], rules: ['采购围标串标规则包'], basis: ['集团采购管理办法第18条'] },
  { id: 'contract' as TaskId, no: 'RV-2026-019', name: '合同签订合规审查', unit: '华北装备制造集团西北分公司', domain: '合同', dataStatus: '已就绪', scope: '采购合同、补充协议、审批记录与合同变更事项', packages: ['合同台账结果包'], rules: ['合同风险条款规则包'], basis: ['合同管理办法第11条'] },
  { id: 'payment' as TaskId, no: 'RV-2026-020', name: '资金付款异常审查', unit: '华北装备制造集团西北分公司', domain: '资金', dataStatus: '待补充', scope: '合同付款、预付款、验收前付款与审批流水', packages: ['资金付款结果包'], rules: ['资金异常流动规则包'], basis: ['资金支付制度第8条'] },
  { id: 'supplier' as TaskId, no: 'RV-2026-021', name: '供应商关联关系审查', unit: '华北装备制造集团西北分公司', domain: '供应商', dataStatus: '已就绪', scope: '供应商准入、报名供应商、历史投标与联系人信息', packages: ['供应商准入资料'], rules: ['采购围标串标规则包'], basis: ['供应商管理细则第9条'] },
]

const initialAgentModels: AgentModel[] = [
  { id: 'property', name: '产权变动合规模型', domain: '产权', description: '识别产权交易决策审批不合规、未进场交易等问题。', baseModel: '合规识别模型', threshold: 85, promptVersion: 'v1.0' },
  { id: 'investment', name: '投资方向偏离模型', domain: '投资', description: '识别违规投向非主责主业、无关多元化投资。', baseModel: '投资风险模型', threshold: 82, promptVersion: 'v1.0' },
  { id: 'finance', name: '财务信息质量模型', domain: '财务', description: '识别人为调整合并范围、潜亏挂账、虚构业务。', baseModel: '财务分析模型', threshold: 88, promptVersion: 'v1.1' },
  { id: 'funds', name: '资金异常流动模型', domain: '资金', description: '识别越权审批、不相容岗位未分离、违规理财。', baseModel: '资金监测模型', threshold: 86, promptVersion: 'v1.0' },
  { id: 'salary', name: '薪酬违规发放模型', domain: '薪酬', description: '识别超发工资、违规自定薪酬、兼职取酬。', baseModel: '薪酬核验模型', threshold: 84, promptVersion: 'v1.0' },
  { id: 'financial', name: '金融风险敞口模型', domain: '金融', description: '识别偏离主业投资、承担刚兑损失风险。', baseModel: '金融风险模型', threshold: 83, promptVersion: 'v1.0' },
  { id: 'procure', name: '采购围标串标模型', domain: '采购', description: '识别围标串标、应招未招、人为拆分合同。', baseModel: '采购审查模型', threshold: 90, promptVersion: 'v1.2' },
  { id: 'contract', name: '合同风险条款模型', domain: '合同', description: '识别风险条款、关联交易未披露。', baseModel: '合同审查模型', threshold: 85, promptVersion: 'v1.1' },
  { id: 'overseas', name: '境外资产监管模型', domain: '境外', description: '识别境内决策审批缺失、数据未回传。', baseModel: '境外监管模型', threshold: 82, promptVersion: 'v1.0' },
  { id: 'military', name: '军品合规管理模型综合风险画像模型', domain: '军品', description: '综合识别军品业务合规管理、供应链和资金风险画像。', baseModel: '综合风险画像模型', threshold: 88, promptVersion: 'v1.0' },
]

const findingsByTask: Record<TaskId, Finding[]> = {
  purchase: [{ title: '三份合同疑似拆分采购规避公开招标', level: '重大', rule: '采购围标串标规则包', confidence: 92, basis: '集团采购管理办法第18条', evidence: 'HT-1182/1183/1184合同金额与签订日期' }, { title: '两家供应商报价与联系人异常相似', level: '重要', rule: '采购围标串标规则包', confidence: 84, basis: '招投标合规指引第12条', evidence: '投标文件元数据、联系人手机号' }],
  contract: [{ title: '补充协议签订未见完整审批记录', level: '重要', rule: '合同风险条款规则包', confidence: 81, basis: '合同管理办法第11条', evidence: '补充协议SP-2026-044审批节点缺失' }],
  payment: [{ title: '中标后预付款比例超合同约定', level: '重大', rule: '资金异常流动规则包', confidence: 88, basis: '资金支付制度第8条', evidence: '合同约定30%，实际预付50%' }],
  supplier: [{ title: '报名供应商联系人与账户信息存在重合', level: '重要', rule: '采购围标串标规则包', confidence: 86, basis: '供应商管理细则第9条', evidence: '供应商A/B联系人、账户尾号重复' }],
}

function tone(value: string): Tone {
  return value === '重大' ? 'red' : value === '重要' || value.includes('待') ? 'amber' : 'green'
}

function toImportedAgent(value: unknown): AgentModel | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<AgentModel>
  if (!item.id || !item.name || !item.domain || !item.description) return null
  return {
    id: String(item.id),
    name: String(item.name),
    domain: String(item.domain),
    description: String(item.description),
    baseModel: item.baseModel ? String(item.baseModel) : '通用审查模型',
    threshold: Number.isFinite(Number(item.threshold)) ? Number(item.threshold) : 80,
    promptVersion: item.promptVersion ? String(item.promptVersion) : 'v1.0',
  }
}

export default function ReviewWorkbench() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const importInputRef = useRef<HTMLInputElement>(null)
  const view = searchParams.get('view') ?? 'execute'
  const [taskId, setTaskId] = useState<TaskId>('purchase')
  const [taskSearch, setTaskSearch] = useState('')
  const [resultSearch, setResultSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('全部等级')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [attachmentTarget, setAttachmentTarget] = useState<(typeof reviewTasks)[number] | null>(null)
  const [basisTarget, setBasisTarget] = useState<Finding | null>(null)
  const [agentModels, setAgentModels] = useState<AgentModel[]>(initialAgentModels)
  const [agentSearch, setAgentSearch] = useState('')
  const [configTarget, setConfigTarget] = useState<AgentModel | null>(null)
  const [configDraft, setConfigDraft] = useState<Pick<AgentModel, 'baseModel' | 'threshold' | 'promptVersion'>>({ baseModel: '', threshold: 80, promptVersion: '' })
  const [agentNotice, setAgentNotice] = useState('')
  const createIssueDraft = useWorkflowStore((state) => state.createIssueDraft)

  const task = reviewTasks.find((item) => item.id === taskId) ?? reviewTasks[0]
  const visibleTasks = reviewTasks.filter((item) => {
    const matchesSearch = !taskSearch.trim() || `${item.name}${item.no}${item.unit}${item.domain}`.includes(taskSearch.trim())
    const matchesLevel = levelFilter === '全部等级' || findingsByTask[item.id].some((finding) => finding.level === levelFilter)
    return matchesSearch && matchesLevel
  })
  const visibleFindings = useMemo(() => findingsByTask[taskId].filter((item) => (!resultSearch.trim() || `${item.title}${item.rule}`.includes(resultSearch.trim())) && (levelFilter === '全部等级' || item.level === levelFilter)), [taskId, resultSearch, levelFilter])
  const visibleAgents = agentModels.filter((item) => !agentSearch.trim() || `${item.name}${item.domain}${item.description}${item.baseModel}`.includes(agentSearch.trim()))

  const chooseTask = (id: TaskId) => {
    setTaskId(id)
    setDrawerOpen(true)
  }
  const openModelConfig = (model: AgentModel) => {
    setConfigTarget(model)
    setConfigDraft({ baseModel: model.baseModel, threshold: model.threshold, promptVersion: model.promptVersion })
  }
  const saveModelConfig = () => {
    if (!configTarget) return
    setAgentModels((items) => items.map((item) => item.id === configTarget.id ? { ...item, ...configDraft } : item))
    setConfigTarget(null)
    setAgentNotice('模型配置已保存')
    window.setTimeout(() => setAgentNotice(''), 1800)
  }
  const exportAgents = () => {
    const blob = new Blob([JSON.stringify(agentModels, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '智能体模型配置.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }
  const importAgents = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result)) as unknown
        const source = Array.isArray(payload) ? payload : (payload as { agents?: unknown[] })?.agents
        const imported = Array.isArray(source) ? source.map(toImportedAgent).filter((item): item is AgentModel => item !== null) : []
        if (!imported.length) throw new Error('invalid agents')
        setAgentModels(imported)
        setAgentNotice(`已导入 ${imported.length} 个智能体`)
      } catch {
        setAgentNotice('导入失败：请选择有效的智能体配置文件')
      }
    }
    reader.readAsText(file)
  }

  if (view === 'agents') {
    return <PageFrame title="智能体配置" subtitle="维护智能体、模型参数和识别规则。" actions={<><input ref={importInputRef} style={{ display: 'none' }} type="file" accept="application/json" onChange={importAgents} /><Button type="primary-soft" icon={<FileUp size={15} />} onClick={() => importInputRef.current?.click()}>导入智能体</Button><Button type="primary" icon={<FileDown size={15} />} onClick={exportAgents}>导出智能体</Button></>}>
      <Card title="智能体列表" note="可维护智能体所使用的模型配置。">
        <div className="icm-agent-toolbar"><div className="icm-modal-search"><Search size={14} /><input value={agentSearch} onChange={(event) => setAgentSearch(event.target.value)} placeholder="搜索智能体、领域或模型" /></div>{agentNotice ? <span className="icm-agent-notice">{agentNotice}</span> : null}</div>
        <div className="icm-agent-config-grid">{visibleAgents.map((model) => <article className="icm-agent-config-card" key={model.id}><div className="icm-agent-config-main"><span className="icm-agent-config-icon"><Bot size={17} /></span><div><strong>{model.name}</strong><p>{model.description}</p><div className="icm-agent-config-meta"><Tag tone="blue">{model.domain}</Tag><span>{model.baseModel}</span><span>阈值 {model.threshold}%</span><span>{model.promptVersion}</span></div></div></div><Button type="primary-soft" icon={<Settings2 size={14} />} onClick={() => openModelConfig(model)}>模型配置</Button></article>)}</div>
      </Card>
      {configTarget ? <div className="icm-modal-mask" role="dialog" aria-modal="true"><div className="icm-modal icm-modal-small"><div className="icm-modal-head"><div><div className="icm-modal-title">模型配置</div><div className="icm-modal-sub">{configTarget.name}</div></div><button className="icm-modal-close" type="button" onClick={() => setConfigTarget(null)}><X size={16} /></button></div><div className="icm-modal-body icm-agent-modal-body"><label>基础模型<select className="icm-select" value={configDraft.baseModel} onChange={(event) => setConfigDraft((item) => ({ ...item, baseModel: event.target.value }))}><option>通用审查模型</option><option>规则推理模型</option><option>文本识别模型</option><option>风险分析模型</option></select></label><label>命中阈值（%）<input className="icm-input" min="1" max="100" type="number" value={configDraft.threshold} onChange={(event) => setConfigDraft((item) => ({ ...item, threshold: Number(event.target.value) || 0 }))} /></label><label>提示词版本<input className="icm-input" value={configDraft.promptVersion} onChange={(event) => setConfigDraft((item) => ({ ...item, promptVersion: event.target.value }))} /></label></div><div className="icm-modal-foot"><Button type="primary" onClick={saveModelConfig}>保存配置</Button></div></div></div> : null}
    </PageFrame>
  }

  return <PageFrame title="智能审查" subtitle="按审查任务查看线索、结果和处理记录。">
    <div className="icm-review-workspace">
      <Card title="审查任务" note="选择任务后查看对应审查结果。">
        <div className="icm-review-task-filter"><div className="icm-modal-search"><Search size={14} /><input value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} placeholder="搜索审查任务" /></div><select aria-label="按等级筛选任务" className="icm-select" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option>全部等级</option><option>重大</option><option>重要</option><option>一般</option></select></div>
        <div className="icm-review-task-menu">{visibleTasks.map((item) => <div className={`icm-review-task-menu-item ${item.id === taskId ? 'active' : ''}`} key={item.id} role="button" tabIndex={0} onClick={() => chooseTask(item.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') chooseTask(item.id) }}><div className="icm-review-task-menu-title"><strong>{item.name}</strong><span>{item.no}</span></div><div className="icm-review-task-menu-actions"><Tag tone={item.dataStatus === '已就绪' ? 'green' : 'amber'}>{item.dataStatus}</Tag><button type="button" onClick={(event) => { event.stopPropagation(); setAttachmentTarget(item) }}><FileText size={13} />附件</button><button type="button" onClick={(event) => { event.stopPropagation(); navigate('/review-workbench?view=agents') }}><Settings2 size={13} />智能体审查</button></div></div>)}{!visibleTasks.length ? <div className="icm-empty-inline">暂无符合条件的审查任务</div> : null}</div>
      </Card>
      <Card title="审查结果" note={`当前任务：${task.name}`} action={<Tag tone="green">审查完成</Tag>}><div className="icm-modal-search" style={{ marginBottom: 10 }}><Search size={14} /><input value={resultSearch} onChange={(event) => setResultSearch(event.target.value)} placeholder="搜索问题线索或规则" /></div><DataTable columns={['问题线索', '等级', '命中规则', '置信度', '处理']} rows={visibleFindings.map((item) => [<div><div className="icm-list-title">{item.title}</div><div className="icm-list-meta">{item.evidence}</div></div>, <Tag tone={tone(item.level)}>{item.level}</Tag>, item.rule, `${item.confidence}%`, <div className="icm-row-actions"><button type="button" onClick={() => setBasisTarget(item)}><BookOpen size={12} /> 查看依据</button><button type="button" onClick={() => navigate(`/workpaper?source=review&finding=${encodeURIComponent(item.title)}`)}><FileUp size={12} /> 生成底稿</button><button type="button" onClick={() => { const issueId = createIssueDraft({ title: item.title, level: item.level as '重大' | '重要' | '一般', owner: task.unit.includes('西北') ? '采购管理部' : '责任部门', workpaperId: '待生成底稿', evidenceIds: [item.evidence], basis: item.basis }); navigate(`/issues?issue=${issueId}`) }}><GitPullRequestArrow size={12} /> 转问题草稿</button></div>])} /></Card>
    </div>
    {drawerOpen ? <aside className="icm-review-task-drawer"><div className="icm-review-task-drawer-head"><strong>任务摘要</strong><button type="button" onClick={() => setDrawerOpen(false)}><X size={15} /></button></div><DetailLine label="审查任务" value={task.name} /><DetailLine label="审查范围" value={task.scope} /><DetailLine label="数据包" value={task.packages.join(' / ')} /><DetailLine label="适用规则" value={task.rules.join(' / ')} /><DetailLine label="引用依据" value={task.basis.join(' / ')} /></aside> : null}
    {attachmentTarget ? <div className="icm-modal-mask" role="dialog" aria-modal="true"><div className="icm-modal icm-modal-small"><div className="icm-modal-head"><div><div className="icm-modal-title">任务附件</div><div className="icm-modal-sub">{attachmentTarget.name}</div></div><button className="icm-modal-close" type="button" onClick={() => setAttachmentTarget(null)}><X size={16} /></button></div><div style={{ padding: 18 }}><DetailLine label="关联数据包" value={attachmentTarget.packages.join(' / ')} /><DetailLine label="适用规则包" value={attachmentTarget.rules.join(' / ')} /><DetailLine label="制度依据" value={attachmentTarget.basis.join(' / ')} /></div></div></div> : null}
    {basisTarget ? <div className="icm-modal-mask" role="dialog" aria-modal="true"><div className="icm-modal icm-modal-small"><div className="icm-modal-head"><div><div className="icm-modal-title">审查依据详情</div><div className="icm-modal-sub">{basisTarget.title}</div></div><button className="icm-modal-close" type="button" onClick={() => setBasisTarget(null)}><X size={16} /></button></div><div style={{ padding: 18 }}><DetailLine label="命中规则" value={basisTarget.rule} /><DetailLine label="制度依据" value={basisTarget.basis} /><DetailLine label="取证事实" value={basisTarget.evidence} /></div></div></div> : null}
  </PageFrame>
}
