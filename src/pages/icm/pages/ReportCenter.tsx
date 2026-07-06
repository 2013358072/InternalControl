import { useMemo, useState } from 'react'
import { ArrowLeft, Download, FileSearch, Printer, Search, Send, SquarePen, X } from 'lucide-react'

import { Button, Card, DataTable, PageFrame, Tag, Toolbar, downloadWord, printHtml } from '../components/IcmPageKit'

type Template = 'special' | 'summary' | 'notice'
type ReferenceType = '全部' | '底稿' | '证据' | '问题' | '整改'

const references = [
  { type: '底稿', id: 'WP-CG-001', title: '供应商报价相似度异常底稿', owner: '张岚', source: '检查底稿管理', status: '已复核' },
  { type: '证据', id: 'EV-2026-0618-01', title: '投标文件报价明细采集', owner: '采购管理部', source: '取证单台账', status: '已固化' },
  { type: '问题', id: 'IS-2026-001', title: '三家投标供应商报价差异极小且格式相似', owner: '采购管理部', source: '问题台账', status: '待整改' },
  { type: '整改', id: 'RC-001', title: '补充供应商报价异常说明并完善评审记录', owner: '采购管理部', source: '整改闭环管理', status: '推进中' },
  { type: '证据', id: 'EV-2026-0618-02', title: '投标文件元数据与联系人比对记录', owner: '招采中心', source: '取证单台账', status: '已固化' },
  { type: '底稿', id: 'WP-PAY-003', title: '中标后预付款比例复核底稿', owner: '王锐', source: '检查底稿管理', status: '已复核' },
]

const reportTasks = [
  { id: 'RP-2026-018', name: '采购围标风险专项检查报告', type: '专项报告' as const, date: '2026-07-01', status: '草稿', unit: '华北装备制造集团西北分公司', author: '张衡', template: 'special' as Template },
  { id: 'RP-2026-012', name: '二季度内控检查综合报告', type: '综合报告' as const, date: '2026-06-20', status: '已归档', unit: '集团内控部', author: '李娜', template: 'summary' as Template },
  { id: 'RP-2026-009', name: '问题整改督办通知', type: '督办通知' as const, date: '2026-06-15', status: '已发布', unit: '采购管理部', author: '王锐', template: 'notice' as Template },
  { id: 'RP-2026-025', name: '合同审批合规专项报告', type: '专项报告' as const, date: '2026-07-03', status: '草稿', unit: '合同管理部', author: '刘峰', template: 'special' as Template },
  { id: 'RP-2026-031', name: '2026年上半年内控检查综合报告', type: '综合报告' as const, date: '2026-07-05', status: '审核中', unit: '集团内控部', author: '陈明', template: 'summary' as Template },
]

const templateMap = {
  special: '采购围标风险专项检查报告',
  summary: '内控检查综合报告',
  notice: '问题整改督办通知',
}

function buildReportHtml(title: string, selectedReferences: typeof references) {
  const rows = selectedReferences
    .map((item) => `<tr><td>${item.type}</td><td>${item.id}</td><td>${item.title}</td><td>${item.owner}</td></tr>`)
    .join('')
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body{font-family:"Microsoft YaHei",Arial,sans-serif;color:#1f2937;line-height:1.8;padding:34px}
    h1{font-size:24px;color:#0b1f43;margin:0 0 8px}
    h2{font-size:16px;color:#155bd4;margin:22px 0 8px;border-bottom:1px solid #dbe5f1;padding-bottom:6px}
    .meta{color:#64748b;font-size:13px;margin-bottom:18px}
    table{border-collapse:collapse;width:100%;font-size:13px;margin-top:10px}
    th,td{border:1px solid #dbe5f1;padding:8px;text-align:left;vertical-align:top}
    th{background:#f6f9fd;color:#475569}
    @media print{body{padding:18mm}.print-hide{display:none}}
  </style>
</head>
<body>
  <button class="print-hide" onclick="window.print()">打印 / 另存为 PDF</button>
  <h1>${title}</h1>
  <div class="meta">生成时间：2026-07-01 · 数据范围：采购管理、合同管理、资金支付、整改闭环</div>
  <h2>一、检查概况</h2>
  <p>本报告基于检查底稿、取证记录、问题台账和整改闭环数据自动生成，重点关注采购围标风险、供应商关联关系和评审记录完整性。</p>
  <h2>二、主要发现</h2>
  <p>系统识别出报价相似度异常、供应商联系人重合、评审依据缺失等风险线索，其中重大问题 1 项、重要问题 2 项、一般问题 1 项。</p>
  <h2>三、数据引用</h2>
  <table><thead><tr><th>类型</th><th>编号</th><th>标题</th><th>责任部门</th></tr></thead><tbody>${rows}</tbody></table>
  <h2>四、整改安排</h2>
  <p>对未闭环事项持续跟踪，要求责任部门提交佐证材料，经部门确认和检查组复核后归档。</p>
</body>
</html>`
}

export default function ReportCenter() {
  const [selectedTaskId, setSelectedTaskId] = useState<string>()
  const [searchKeyword, setSearchKeyword] = useState('')

  const selectedTask = reportTasks.find((t) => t.id === selectedTaskId)

  const filteredTasks = useMemo(() => {
    if (!searchKeyword.trim()) return reportTasks
    const kw = searchKeyword.trim().toLowerCase()
    return reportTasks.filter((t) =>
      t.id.toLowerCase().includes(kw)
      || t.name.toLowerCase().includes(kw)
      || t.unit.toLowerCase().includes(kw)
      || t.author.toLowerCase().includes(kw)
      || t.type.toLowerCase().includes(kw)
    )
  }, [searchKeyword])

  const enterDetail = (id: string) => {
    setSelectedTaskId(id)
    setSearchKeyword('')
  }

  const backToList = () => {
    setSelectedTaskId(undefined)
    setSearchKeyword('')
  }

  return selectedTask ? (
    <ReportDetail task={selectedTask} onBack={backToList} />
  ) : (
    <PageFrame
      title="报告中心"
      subtitle="按报告任务检索，点击查看或编辑对应报告；支持从底稿、证据、问题、整改数据中引用素材。"
    >
      <Toolbar>
        <div className="icm-modal-search" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={15} />
          <input placeholder="检索报告编号、名称、单位、作者…" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
        </div>
        <span className="icm-toolbar-spacer" />
        <span style={{ color: '#64748b', fontSize: 12 }}>共 {filteredTasks.length} 条</span>
      </Toolbar>

      <Card title="报告任务列表" note="点击任一报告进入详情撰写与发布。">
        <DataTable
          columns={['报告编号', '报告名称', '报告类型', '编制单位', '编制人', '编制日期', '状态', '操作']}
          rows={filteredTasks.map((t) => [
            t.id,
            t.name,
            t.type,
            t.unit,
            t.author,
            t.date,
            <Tag tone={t.status === '已归档' || t.status === '已发布' ? 'green' : t.status === '审核中' ? 'amber' : 'blue'}>{t.status}</Tag>,
            <button type="button" className="icm-link" onClick={(e) => { e.stopPropagation(); enterDetail(t.id) }}>查看报告</button>,
          ])}
          onRowClick={(i) => enterDetail(filteredTasks[i].id)}
        />
      </Card>
    </PageFrame>
  )
}

function ReportDetail({ task, onBack }: { task: typeof reportTasks[number]; onBack: () => void }) {
  const [localStatus, setLocalStatus] = useState(task.status)
  const isDraft = localStatus === '草稿'
  const isReviewing = localStatus === '审核中'
  const [referenceOpen, setReferenceOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ReferenceType>('全部')
  const [selectedIds, setSelectedIds] = useState(() => new Set(references.slice(0, 4).map((item) => item.id)))
  const [auditExpanded, setAuditExpanded] = useState(true)
  const [toast, setToast] = useState('')

  const handleSubmit = () => {
    setLocalStatus('审核中')
    setAuditExpanded(true)
    setToast('已提交审核，主审复核中')
    setTimeout(() => setToast(''), 2200)
  }
  const handlePublish = () => {
    setLocalStatus('已发布')
    setAuditExpanded(true)
    setToast('已发布')
    setTimeout(() => setToast(''), 2200)
  }
  const handleArchive = () => {
    setLocalStatus('已归档')
    setAuditExpanded(true)
    setToast('已归档')
    setTimeout(() => setToast(''), 2200)
  }

  const title = templateMap[task.template]
  const selectedReferences = useMemo(() => references.filter((item) => selectedIds.has(item.id)), [selectedIds])
  const html = useMemo(() => buildReportHtml(title, selectedReferences), [title, selectedReferences])

  const filteredReferences = useMemo(() => {
    const keyword = query.trim()
    return references.filter((item) => {
      const typeMatched = type === '全部' || item.type === type
      const keywordMatched = !keyword || `${item.type}${item.id}${item.title}${item.owner}${item.source}`.includes(keyword)
      return typeMatched && keywordMatched
    })
  }, [query, type])

  const toggleReference = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const statusTag = localStatus === '已归档' || localStatus === '已发布' ? 'green' : localStatus === '审核中' ? 'amber' : 'blue'

  const showDraftBtns = isDraft
  const showReviewBtns = isReviewing

  return (
    <>
      <PageFrame
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={onBack}>返回列表</Button>报告详情</span>}
        subtitle={`${task.id} · ${task.name}`}
      >
        <Toolbar>
          <Tag tone={statusTag}>{localStatus}</Tag>
          <span style={{ color: '#64748b', fontSize: 12 }}>{task.id} · {task.unit} · {task.author} · {task.date}</span>
          <span className="icm-toolbar-spacer" />
          <Button type="info-soft" icon={<FileSearch size={15} />} onClick={() => setReferenceOpen(true)}>
            数据引用
          </Button>
          {showDraftBtns && (
            <>
              <Button type="primary" icon={<Download size={16} />} onClick={() => downloadWord(`${title}.doc`, html)}>导出 Word</Button>
              <Button type="primary-soft" icon={<Printer size={16} />} onClick={() => printHtml(html)}>导出 PDF</Button>
              <Button type="success-soft" icon={<Send size={16} />} onClick={handleSubmit}>提交审核</Button>
            </>
          )}
          {showReviewBtns && (
            <Button type="success-soft" icon={<Send size={16} />} onClick={handlePublish}>确认发布</Button>
          )}
        </Toolbar>

        <Card
          title="智能撰写"
          note="依据当前模板和引用数据生成报告正文"
          action={isDraft ? <Button type="primary-soft" icon={<SquarePen size={15} />}>保存草稿</Button> : undefined}
        >
          <div className="icm-editor">
            <h2>{title}</h2>
            <p>生成时间：{task.date} · 编制部门：{task.unit} · 版本：V1.0 · 引用数据：{selectedReferences.length} 条</p>
            <h3>一、检查概况</h3>
            <p>本次检查围绕采购管理、合同管理、资金支付及整改闭环开展，形成底稿、取证记录、问题台账和整改任务。</p>
            <h3>二、主要发现</h3>
            <p>采购围标风险集中表现为报价相似度异常、供应商联系人重合、评审依据记录不足，建议纳入专项督办。</p>
            <h3>三、数据引用</h3>
            <p>已引用 {selectedReferences.length} 条数据，覆盖{Array.from(new Set(selectedReferences.map((item) => item.type))).join('、') || '待选择'}。</p>
            <h3>四、整改建议</h3>
            <p>建议责任部门补充业务说明、完善评审记录、调整供应商准入规则，并由检查组复核闭环。</p>
          </div>

          <div className="icm-subsection-head" onClick={() => setAuditExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
            <div className="icm-card-title">审核发布</div>
            <span style={{ color: '#748299', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {auditExpanded ? '收起' : '展开'} · {isDraft ? '草稿' : isReviewing ? '复核中' : localStatus}
            </span>
          </div>
          {auditExpanded && (
            <div className="icm-list">
              {/* 起草 */}
              <div className="icm-list-row">
                <div>
                  <div className="icm-list-title">起草状态</div>
                  <div className="icm-list-meta">V1.0 草稿已生成</div>
                </div>
                <Tag tone="blue">已完成起草</Tag>
              </div>
              {/* 主审复核 */}
              <div className={`icm-list-row ${isReviewing ? 'active' : ''}`}>
                <div>
                  <div className="icm-list-title">主审复核</div>
                  <div className="icm-list-meta">{localStatus === '草稿' ? '待提交审核' : isReviewing ? '复核中' : '已通过'}</div>
                </div>
                {isDraft ? (
                  <Button type="primary-soft" onClick={handleSubmit}>提交审核</Button>
                ) : isReviewing ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button type="success-soft" onClick={handlePublish}>审核通过</Button>
                    <Button type="default-soft" onClick={() => { setLocalStatus('草稿'); setToast('已退回至草稿'); setTimeout(() => setToast(''), 2200) }}>退回修改</Button>
                  </div>
                ) : (
                  <Tag tone="green">已通过</Tag>
                )}
              </div>
              {/* 发布 */}
              <div className="icm-list-row">
                <div>
                  <div className="icm-list-title">发布状态</div>
                  <div className="icm-list-meta">{localStatus === '已发布' ? '已发布' : localStatus === '已归档' ? '已归档至档案库' : '未发布'}</div>
                </div>
                {localStatus === '已发布' ? (
                  <Tag tone="green">已发布</Tag>
                ) : localStatus === '审核中' ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button type="primary-soft" onClick={handlePublish}>确认发布</Button>
                    <Button type="default-soft" onClick={handleArchive}>直接归档</Button>
                  </div>
                ) : localStatus === '已归档' ? (
                  <Tag tone="green">已归档</Tag>
                ) : (
                  <Tag tone="gray">未发布</Tag>
                )}
              </div>
            </div>
          )}
        </Card>

        {referenceOpen ? (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal">
              <div className="icm-modal-head">
                <div>
                  <div className="icm-modal-title">数据引用检索</div>
                  <div className="icm-modal-sub">从底稿、证据、问题和整改数据中选择报告引用项</div>
                </div>
                <button className="icm-modal-close" type="button" onClick={() => setReferenceOpen(false)} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>
              <div className="icm-modal-tools">
                <div className="icm-modal-search">
                  <Search size={15} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索编号、标题、责任部门、来源" />
                </div>
                <select className="icm-select" value={type} onChange={(event) => setType(event.target.value as ReferenceType)}>
                  <option>全部</option>
                  <option>底稿</option>
                  <option>证据</option>
                  <option>问题</option>
                  <option>整改</option>
                </select>
              </div>
              <div className="icm-reference-list">
                {filteredReferences.map((item) => (
                  <button className={`icm-reference-row ${selectedIds.has(item.id) ? 'active' : ''}`} key={item.id} onClick={() => toggleReference(item.id)}>
                    <span className="icm-reference-check">{selectedIds.has(item.id) ? '✓' : ''}</span>
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.id} · {item.source} · {item.owner}</em>
                    </span>
                    <Tag tone={item.type === '问题' ? 'amber' : item.type === '整改' ? 'green' : 'blue'}>{item.type}</Tag>
                  </button>
                ))}
              </div>
              <div className="icm-modal-foot">
                <span>已选择 {selectedReferences.length} 条引用</span>
                <Button type="primary" onClick={() => setReferenceOpen(false)}>确认引用</Button>
              </div>
            </div>
          </div>
        ) : null}
      </PageFrame>
      {toast ? <div className="icm-toast-fixed">{toast}</div> : null}
    </>
  )
}
