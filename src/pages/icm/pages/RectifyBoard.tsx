import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, Search } from 'lucide-react'

import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { useWorkflowStore, type RectificationStatus } from '../store/workflowStore'

function tone(status: RectificationStatus): Tone {
  return status === '已整改' ? 'green' : 'amber'
}

export default function RectifyBoard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rectifications = useWorkflowStore((state) => state.rectifications)
  const issues = useWorkflowStore((state) => state.issues)
  const reports = useWorkflowStore((state) => state.reports)
  const createReport = useWorkflowStore((state) => state.createReport)
  const [selectedId, setSelectedId] = useState(searchParams.get('rect') ?? '')
  const [keyword, setKeyword] = useState('')
  const requestedStatus = searchParams.get('status')
  const [status, setStatus] = useState(requestedStatus === '已整改' || requestedStatus === '整改中' ? requestedStatus : '全部状态')
  const selected = rectifications.find((item) => item.id === selectedId)
  const selectedIssue = issues.find((item) => item.id === selected?.issueId)
  const selectedReport = reports.find((item) => item.rectificationId === selected?.id)
  const visible = useMemo(() => rectifications.filter((item) => {
    const issue = issues.find((record) => record.id === item.issueId)
    const matchesKeyword = !keyword.trim() || `${item.id}${item.title}${item.owner}${issue?.title ?? ''}`.includes(keyword.trim())
    const matchesStatus = status === '全部状态' || item.status === status
    return matchesKeyword && matchesStatus
  }), [rectifications, issues, keyword, status])

  if (!selected) {
    const ongoing = rectifications.filter((item) => item.status === '整改中').length
    const completed = rectifications.filter((item) => item.status === '已整改').length
    return <PageFrame title="整改追踪" subtitle="问题确认后形成整改事项；整改中仅展示进度与追溯信息，已整改且复核通过后方可编制报告。">
      <Toolbar><div className="icm-modal-search" style={{ maxWidth: 340 }}><Search size={15} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索整改编号、事项或责任部门" /></div><select className="icm-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>整改中</option><option>已整改</option></select><span className="icm-toolbar-spacer" /><Tag tone="blue">共 {visible.length} 项</Tag></Toolbar>
      <div className="icm-grid cols-4" style={{ marginBottom: 12 }}><Kpi value={rectifications.length.toString()} label="整改事项" note="均关联已确认问题" tone="blue" /><Kpi value={ongoing.toString()} label="整改中" note="跟踪进度与佐证情况" tone="amber" /><Kpi value={completed.toString()} label="已整改" note="已复核通过" tone="green" /><Kpi value={reports.length.toString()} label="已形成报告" note="整改报告任务" tone="cyan" /></div>
      <Card title="整改事项列表" note="点击事项查看整改进度、来源问题、底稿与佐证材料。"><DataTable columns={['整改编号', '整改事项', '来源问题', '责任部门', '进度', '状态', '操作']} rows={visible.map((item) => { const issue = issues.find((record) => record.id === item.issueId); return [item.id, item.title, issue?.title ?? item.issueId, item.owner, `${item.progress}%`, <Tag tone={tone(item.status)}>{item.status}</Tag>, <button className="icm-link" type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(item.id) }}>查看</button>] })} onRowClick={(index) => setSelectedId(visible[index].id)} /></Card>
    </PageFrame>
  }

  const canCreateReport = selected.status === '已整改'
  const openReport = () => navigate(`/report?report=${selectedReport?.id ?? createReport(selected.id)}`)
  return <PageFrame title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={() => setSelectedId('')}>返回列表</Button>整改事项详情</span>} subtitle={`${selected.id} · ${selected.title}`}>
    <Toolbar><Tag tone={tone(selected.status)}>{selected.status}</Tag><span className="icm-toolbar-spacer" />{canCreateReport ? <Button type="primary" icon={<FileText size={14} />} onClick={openReport}>{selectedReport ? '查看报告' : '编制报告'}</Button> : <Tag tone="amber">整改执行中</Tag>}</Toolbar>
    <div className="icm-rectify-detail-layout"><div style={{ display: 'grid', gap: 12 }}><Card title="整改事项信息" note="整改责任、期限和来源问题保持绑定。"><div className="icm-grid cols-3"><DetailLine label="整改状态" value={<Tag tone={tone(selected.status)}>{selected.status}</Tag>} /><DetailLine label="责任部门" value={selected.owner} /><DetailLine label="整改进度" value={`${selected.progress}%`} /><DetailLine label="来源问题" value={<button className="icm-link" type="button" onClick={() => navigate(`/issues?issue=${selected.issueId}`)}>{selected.issueId}</button>} /><DetailLine label="问题等级" value={selectedIssue ? <Tag tone={selectedIssue.level === '重大' ? 'red' : selectedIssue.level === '重要' ? 'amber' : 'blue'}>{selectedIssue.level}</Tag> : '-'} /><DetailLine label="最后更新" value={selected.updatedAt} /></div><div className="icm-progress-line"><span style={{ width: `${selected.progress}%` }} /><b>{selected.progress}%</b></div></Card><Card title="整改进度与复核结论" note="整改中仅供查看；已整改表示检查组复核通过。"><DetailLine label="整改措施" value={selectedIssue?.suggestion ?? '待补充'} /><DetailLine label="佐证材料" value={`${selected.proofCount} 份`} /><DetailLine label="复核结论" value={selected.verifyConclusion} /><DetailLine label="当前环节" value={selected.status === '整改中' ? '责任单位整改执行' : '复核完成，可编制报告'} /></Card></div><aside><Card title="来源追溯" note="整改事项不能脱离问题、底稿和取证材料单独存在。"><div className="icm-trace-list"><button type="button" onClick={() => navigate(`/issues?issue=${selected.issueId}`)}>{selected.issueId}<span>问题台账</span></button><button type="button" onClick={() => navigate('/workpaper')}>{selectedIssue?.workpaperId ?? '-'}<span>审查记录</span></button><button type="button" onClick={() => navigate('/evidence')}>{selectedIssue?.evidenceIds.join(' / ') ?? '-'}<span>取证材料</span></button>{selectedReport ? <button type="button" onClick={openReport}>{selectedReport.id}<span>整改报告</span></button> : null}</div></Card><Card title="状态说明"><DetailLine label="整改中" value="可查看整改事项、进度、来源与佐证情况" /><DetailLine label="已整改" value="复核通过后可进入报告编制" /></Card></aside></div>
  </PageFrame>
}
