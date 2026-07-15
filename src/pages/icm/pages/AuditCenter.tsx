import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, RotateCcw, Search } from 'lucide-react'

import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Segmented, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { useWorkflowStore, type AuditStatus } from '../store/workflowStore'

type AuditTab = 'pending' | 'mine' | 'done'
const tone = (status: AuditStatus): Tone => status === '已通过' ? 'green' : status === '已退回' ? 'red' : 'amber'

export default function AuditCenter() {
  const navigate = useNavigate()
  const audits = useWorkflowStore((state) => state.audits)
  const approveAudit = useWorkflowStore((state) => state.approveAudit)
  const returnAudit = useWorkflowStore((state) => state.returnAudit)
  const [tab, setTab] = useState<AuditTab>('pending')
  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [opinion, setOpinion] = useState('')
  const selected = audits.find((item) => item.id === selectedId)
  const visible = useMemo(() => audits.filter((item) => {
    const matchesTab = tab === 'pending' ? item.status === '待处理' : tab === 'mine' ? item.applicant === '系统管理员' : item.status !== '待处理'
    return matchesTab && (!keyword.trim() || `${item.id}${item.type}${item.title}${item.applicant}${item.node}`.includes(keyword.trim()))
  }), [audits, tab, keyword])
  const handleApprove = () => { if (!selected) return; approveAudit(selected.id, opinion || '审核通过，按当前业务口径执行。'); setSelectedId(''); setOpinion('') }
  const handleReturn = () => { if (!selected) return; returnAudit(selected.id, opinion || '请补充材料或完善业务说明后重新提交。'); setSelectedId(''); setOpinion('') }

  return <PageFrame title="审核中心" subtitle="统一处理问题确认、整改复核和报告审核，所有动作回写对应业务对象。"><div className="icm-grid cols-4" style={{ marginBottom: 12 }}><Kpi value={audits.filter((item) => item.status === '待处理').length.toString()} label="待处理" note="当前用户待办" tone="amber" /><Kpi value={audits.filter((item) => item.type === '问题确认' && item.status === '待处理').length.toString()} label="问题确认" note="待检查组确认" tone="red" /><Kpi value={audits.filter((item) => item.type === '整改复核' && item.status === '待处理').length.toString()} label="整改复核" note="通过后进入报告" tone="blue" /><Kpi value={audits.filter((item) => item.type === '报告审核' && item.status === '待处理').length.toString()} label="报告审核" note="待审核发布" tone="green" /></div><Toolbar><Segmented value={tab} onChange={setTab} options={[{ label: '待处理', value: 'pending' }, { label: '我发起的', value: 'mine' }, { label: '已处理', value: 'done' }]} /><div className="icm-modal-search" style={{ maxWidth: 320 }}><Search size={15} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索业务编号、事项或节点" /></div><span className="icm-toolbar-spacer" /><Tag tone="blue">{visible.length} 条</Tag></Toolbar><div className="icm-audit-center-layout"><Card title="审核待办" note="选择事项后在右侧处理"><DataTable columns={['审批编号', '类型', '摘要', '发起人', '节点', '状态']} rows={visible.map((item) => [item.id, item.type, item.title, item.applicant, item.node, <Tag tone={tone(item.status)}>{item.status}</Tag>])} onRowClick={(index) => { setSelectedId(visible[index].id); setOpinion('') }} /></Card><aside><Card title="审核处理" note={selected ? selected.id : '请选择左侧待办'}>{selected ? <><DetailLine label="业务类型" value={selected.type} /><DetailLine label="业务编号" value={selected.businessId} /><DetailLine label="当前节点" value={selected.node} /><DetailLine label="发起人" value={selected.applicant} /><DetailLine label="提交时间" value={selected.submittedAt} /><textarea className="icm-input" style={{ width: '100%', minHeight: 92, marginTop: 10 }} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder="填写审核意见" /><div className="icm-actions" style={{ marginTop: 12 }}><Button type="default-soft" onClick={() => navigate(selected.route)}>查看业务</Button>{selected.status === '待处理' ? <><Button type="default-soft" icon={<RotateCcw size={14} />} onClick={handleReturn}>退回</Button><Button type="primary" icon={<CheckCircle2 size={14} />} onClick={handleApprove}>通过</Button></> : <Tag tone={tone(selected.status)}>{selected.status}</Tag>}</div>{selected.opinion ? <div className="icm-audit-opinion">处理意见：{selected.opinion}</div> : null}</> : <div className="icm-empty-inline">从待办列表选择事项后，可查看业务并处理审核。</div>}</Card></aside></div></PageFrame>
}