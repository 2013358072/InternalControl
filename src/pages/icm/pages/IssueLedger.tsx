import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, GitPullRequestArrow, Save, Search } from 'lucide-react'

import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { useWorkflowStore, type WorkflowIssue } from '../store/workflowStore'

function tone(value: string): Tone {
  if (value === '重大' || value === '待确认') return 'red'
  if (value === '重要' || value === '整改中') return 'amber'
  if (value === '已整改' || value === '已关闭') return 'green'
  return 'blue'
}

export default function IssueLedger() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const issues = useWorkflowStore((state) => state.issues)
  const saveIssueDraft = useWorkflowStore((state) => state.saveIssueDraft)
  const confirmIssue = useWorkflowStore((state) => state.confirmIssue)
  const [selectedId, setSelectedId] = useState(searchParams.get('issue') ?? '')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('全部状态')
  const [notice, setNotice] = useState('')
  const selected = issues.find((item) => item.id === selectedId)
  const [draft, setDraft] = useState<Pick<WorkflowIssue, 'fact' | 'basis' | 'rootCause' | 'impact' | 'suggestion'>>({ fact: '', basis: '', rootCause: '', impact: '', suggestion: '' })

  useEffect(() => {
    if (selected) setDraft({ fact: selected.fact, basis: selected.basis, rootCause: selected.rootCause, impact: selected.impact, suggestion: selected.suggestion })
  }, [selected])

  const filtered = useMemo(() => issues.filter((item) => {
    const matchedKeyword = !keyword.trim() || `${item.id}${item.title}${item.owner}`.includes(keyword.trim())
    const matchedStatus = status === '全部状态' || item.status === status
    return matchedKeyword && matchedStatus
  }), [issues, keyword, status])
  const selectIssue = (id: string) => setSelectedId(id)
  const saveDraft = () => {
    if (!selected) return
    saveIssueDraft(selected.id, draft)
    setNotice('问题草稿已暂存')
  }
  const submitConfirmation = () => {
    if (!selected) return
    const rectificationId = confirmIssue(selected.id, draft)
    if (!rectificationId) { setNotice('请补全问题事实、制度依据和根因分析'); return }
    navigate(`/rectify?rect=${rectificationId}`)
  }

  if (!selected) {
    const pending = issues.filter((item) => item.status === '待确认').length
    const ongoing = issues.filter((item) => item.status === '整改中').length
    const completed = issues.filter((item) => item.status === '已整改').length
    return <PageFrame title="问题台账" subtitle="从审查记录形成问题草稿，确认后自动派发整改并持续追溯。">
      <Toolbar><div className="icm-modal-search" style={{ maxWidth: 340 }}><Search size={15} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索问题编号、描述或责任部门" /></div><select className="icm-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>待确认</option><option>整改中</option><option>已整改</option><option>已关闭</option></select><span className="icm-toolbar-spacer" /><Tag tone="blue">共 {filtered.length} 条</Tag></Toolbar>
      <div className="icm-grid cols-4" style={{ marginBottom: 12 }}><Kpi value={issues.length.toString()} label="问题总数" note="均关联来源底稿" tone="blue" /><Kpi value={pending.toString()} label="待确认" note="需补全定稿要素" tone="red" /><Kpi value={ongoing.toString()} label="整改中" note="已派发责任单位" tone="amber" /><Kpi value={completed.toString()} label="已整改" note="可进入报告引用" tone="green" /></div>
      <Card title="问题列表" note="点击问题进入定稿、来源追溯和整改派发。"><DataTable columns={['问题编号', '问题描述', '等级', '状态', '责任部门', '期限', '操作']} rows={filtered.map((item) => [item.id, item.title, <Tag tone={tone(item.level)}>{item.level}</Tag>, <Tag tone={tone(item.status)}>{item.status}</Tag>, item.owner, item.deadline, <button className="icm-link" type="button" onClick={(event) => { event.stopPropagation(); selectIssue(item.id) }}>查看</button>])} onRowClick={(index) => selectIssue(filtered[index].id)} /></Card>
    </PageFrame>
  }

  const isPending = selected.status === '待确认'
  return <PageFrame title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={() => setSelectedId('')}>返回列表</Button>问题详情</span>} subtitle={`${selected.id} · ${selected.title}`}>
    <Toolbar><Tag tone={tone(selected.level)}>{selected.level}</Tag><Tag tone={tone(selected.status)}>{selected.status}</Tag><span className="icm-toolbar-spacer" />{isPending ? <><Button type="default-soft" icon={<Save size={14} />} onClick={saveDraft}>暂存</Button><Button type="primary" icon={<GitPullRequestArrow size={14} />} onClick={submitConfirmation}>确认并派发整改</Button></> : <Button type="primary-soft" icon={<FileText size={14} />} onClick={() => navigate(selected.rectificationId ? `/rectify?rect=${selected.rectificationId}` : '/rectify')}>查看整改</Button>}</Toolbar>
    <div className="icm-issue-detail-layout">
      <div className="icm-issue-detail-main">
        <Card title="问题概况" note="问题定级、责任和整改时限"><div className="icm-grid cols-3"><DetailLine label="问题等级" value={<Tag tone={tone(selected.level)}>{selected.level}</Tag>} /><DetailLine label="责任部门" value={selected.owner} /><DetailLine label="整改期限" value={selected.deadline} /><DetailLine label="来源底稿" value={<button className="icm-link" type="button" onClick={() => navigate('/workpaper')}>{selected.workpaperId}</button>} /><DetailLine label="取证材料" value={selected.evidenceIds.join(' / ')} /><DetailLine label="整改工单" value={selected.rectificationId ?? '确认后自动生成'} /></div></Card>
        <Card title={isPending ? '问题定稿' : '问题定稿内容'} note={isPending ? '补齐核心要素后才能确认问题。' : '已确认问题保留定稿版本和来源。'}>
          <div className="icm-issue-form-grid">{([['问题事实', 'fact'], ['制度依据', 'basis'], ['根因分析', 'rootCause'], ['影响评估', 'impact'], ['整改建议', 'suggestion']] as const).map(([label, key]) => <label key={key}><span>{label}{(key === 'fact' || key === 'basis' || key === 'rootCause') ? ' *' : ''}</span>{isPending ? <textarea className="icm-input" value={draft[key]} onChange={(event) => setDraft((item) => ({ ...item, [key]: event.target.value }))} placeholder={`填写${label}`} /> : <p>{selected[key] || '未填写'}</p>}</label>)}</div>
        </Card>
      </div>
      <aside className="icm-issue-detail-side"><Card title="来源追溯" note="问题不可脱离底稿和证据单独存在"><div className="icm-trace-list"><button type="button" onClick={() => navigate('/review-workbench?view=results')}>审查线索<span>查看结果</span></button><button type="button" onClick={() => navigate('/workpaper')}>{selected.workpaperId}<span>审查记录</span></button><button type="button" onClick={() => navigate('/evidence')}>{selected.evidenceIds.join(' / ')}<span>取证材料</span></button>{selected.rectificationId ? <button type="button" onClick={() => navigate(`/rectify?rect=${selected.rectificationId}`)}>{selected.rectificationId}<span>整改跟踪</span></button> : null}</div></Card><Card title="状态记录"><DetailLine label="最后更新" value={selected.updatedAt} /><DetailLine label="当前环节" value={selected.status === '待确认' ? '问题确认' : selected.status === '整改中' ? '整改执行' : '整改复核完成'} /></Card></aside>
    </div>
    {notice ? <div className="icm-toast-fixed">{notice}</div> : null}
  </PageFrame>
}