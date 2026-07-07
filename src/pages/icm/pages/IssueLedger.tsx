import { useMemo, useState } from 'react'
import { ArrowLeft, Edit3, FileText, GitPullRequestArrow, Save, Search, X } from 'lucide-react'
import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Tag, Toolbar } from '../components/IcmPageKit'

const localIssues = [
  { id: 'IS-2026-001', title: '三家投标供应商报价差异极小且格式相似', level: '重大', status: '待确认', owner: '采购管理部', workpaper: 'WP-CG-001', evidence: 'EV-2026-0618-01', deadline: '2026-07-08', fact: '', basis: '', impact: '', suggestion: '' },
  { id: 'IS-2026-002', title: '供应商联系人与注册地址存在重合', level: '重要', status: '整改中', owner: '供应商管理岗', workpaper: 'WP-CG-002', evidence: 'EV-2026-0620-04', deadline: '2026-07-15', fact: '', basis: '', impact: '', suggestion: '' },
  { id: 'IS-2026-003', title: '个别项目评审说明缺少独立评分依据', level: '一般', status: '待整改', owner: '评审组织岗', workpaper: 'WP-NK-004', evidence: 'EV-2026-0618-02', deadline: '2026-07-12', fact: '', basis: '', impact: '', suggestion: '' },
  { id: 'IS-2026-004', title: '付款节点早于验收资料归档时间', level: '重要', status: '已关闭', owner: '财务共享中心', workpaper: 'WP-ZJ-003', evidence: 'EV-2026-0619-03', deadline: '2026-06-28', fact: '', basis: '', impact: '', suggestion: '' },
]

function tone(value: string) {
  if (value.includes('重大') || value.includes('待确认')) return 'red'
  if (value.includes('重要') || value.includes('整改') || value.includes('待')) return 'amber'
  if (value.includes('关闭')) return 'green'
  return 'blue'
}

export default function IssueLedger() {
  const [items, setItems] = useState(localIssues)
  const [selectedId, setSelectedId] = useState(items[0].id)
  const [draftId, setDraftId] = useState<string | null>(null)
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId])
  const draft = draftId ? items.find((i) => i.id === draftId) : null

  // ── Draft form state ──
  const [draftFact, setDraftFact] = useState('')
  const [draftBasis, setDraftBasis] = useState('')
  const [draftImpact, setDraftImpact] = useState('')
  const [draftSuggestion, setDraftSuggestion] = useState('')
  const [draftToast, setDraftToast] = useState('')

  const openDraft = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setDraftId(id)
    setDraftFact(item.fact || '')
    setDraftBasis(item.basis || '')
    setDraftImpact(item.impact || '')
    setDraftSuggestion(item.suggestion || '')
  }
  const saveDraft = () => {
    if (!draftId) return
    setItems((prev) => prev.map((i) => i.id === draftId ? { ...i, fact: draftFact, basis: draftBasis, impact: draftImpact, suggestion: draftSuggestion } : i))
    setDraftToast('草稿已保存')
    setTimeout(() => setDraftToast(''), 1800)
  }
  const confirmIssue = () => {
    if (!draftId) return
    if (!draftFact.trim() || !draftBasis.trim()) { setDraftToast('请至少填写问题事实和制度依据'); setTimeout(() => setDraftToast(''), 1800); return }
    setItems((prev) => prev.map((i) => i.id === draftId ? { ...i, status: '待整改', fact: draftFact, basis: draftBasis, impact: draftImpact, suggestion: draftSuggestion } : i))
    setDraftId(null)
    setDraftToast('问题已确认，进入待整改状态')
    setTimeout(() => setDraftToast(''), 1800)
  }

  // ── List view ──
  if (!selectedId) {
    return (
      <PageFrame title="问题台账" subtitle="围绕问题筛选、列表、详情和来源追溯组织台账，支持从问题回到底稿和取证记录。">
        <Toolbar>
          <Search size={16} color="#607089" />
          <input className="icm-input" placeholder="搜索问题、责任部门、编号" />
          <select className="icm-select" defaultValue="全部状态">
            <option>全部状态</option><option>待确认</option><option>待整改</option><option>整改中</option><option>已关闭</option>
          </select>
        </Toolbar>
        <div className="icm-grid cols-4" style={{ marginBottom: 12 }}>
          <Kpi value="24" label="问题总数" note="采购领域 11 项" tone="blue" />
          <Kpi value="6" label="重大/重要" note="需领导关注" tone="red" />
          <Kpi value="15" label="已派发整改" note="平均剩余 8 天" tone="amber" />
          <Kpi value="83%" label="证据完备率" note="可直接入报告" tone="green" />
        </div>
        <Card title="问题列表">
          <DataTable columns={['问题编号', '问题描述', '等级', '状态', '责任部门', '期限', '操作']} rows={items.map((item) => [
            <button className="icm-link" onClick={e => { e.stopPropagation(); setSelectedId(item.id) }}>{item.id}</button>,
            item.title,
            <Tag tone={tone(item.level)}>{item.level}</Tag>,
            <Tag tone={tone(item.status)}>{item.status}</Tag>,
            item.owner, item.deadline,
            <button className="icm-link" onClick={e => { e.stopPropagation(); setSelectedId(item.id) }}>查看</button>,
          ])} onRowClick={(i) => setSelectedId(items[i].id)} />
        </Card>
      </PageFrame>
    )
  }

  // ── Detail view ──
  return (
    <PageFrame
      title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={() => { setSelectedId(''); setDraftId(null) }}>返回列表</Button>问题详情</span>}
      subtitle={`${selected.id} · ${selected.title}`}
    >
      {draftToast ? <div className="icm-toast-fixed">{draftToast}</div> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Info card */}
        <Card title="问题概况" note={selected.id} action={<>
          <Tag tone={tone(selected.level)}>{selected.level}</Tag>
          <Tag tone={tone(selected.status)}>{selected.status}</Tag>
        </>}>
          <div className="icm-grid cols-3" style={{ gap: 6 }}>
            <DetailLine label="问题描述" value={selected.title} />
            <DetailLine label="责任部门" value={selected.owner} />
            <DetailLine label="整改期限" value={selected.deadline} />
            <DetailLine label="来源底稿" value={<button className="icm-link">{selected.workpaper}</button>} />
            <DetailLine label="来源证据" value={<button className="icm-link">{selected.evidence}</button>} />
            <DetailLine label="当前状态" value={<Tag tone={tone(selected.status)}>{selected.status}</Tag>} />
          </div>
        </Card>

        {/* Source chain */}
        <Card title="溯源链" note="事实链 → 制度链 → 责任链">
          <div className="icm-grid cols-3" style={{ gap: 10 }}>
            <div><div className="icm-list-title" style={{ fontWeight: 800, color: '#155bd4', marginBottom: 4 }}>事实链</div><div className="icm-list-meta">从采购项目、报价文件、评审记录、合同、付款凭证逐项形成可核查链条。</div></div>
            <div><div className="icm-list-title" style={{ fontWeight: 800, color: '#0891b2', marginBottom: 4 }}>制度链</div><div className="icm-list-meta">引用采购管理办法、供应商管理细则、评审纪律要求和内控手册条款。</div></div>
            <div><div className="icm-list-title" style={{ fontWeight: 800, color: '#d97706', marginBottom: 4 }}>责任链</div><div className="icm-list-meta">明确业务责任部门、经办岗位、复核岗位和整改审批岗位。</div></div>
          </div>
        </Card>

        {/* Draft / Confirmed 问题草稿四要素 */}
        {selected.status === '待确认' ? (
          <Card title="问题草稿" note="编写完成后确认问题，进入待整改状态。需填写问题事实、制度依据、影响评估和整改建议。"
            action={<>
              <Button type="primary-soft" icon={<Save size={15} />} onClick={saveDraft}>保存草稿</Button>
              <Button type="primary" icon={<GitPullRequestArrow size={15} />} onClick={confirmIssue}>确认问题</Button>
            </>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 13, marginBottom: 4 }}>问题事实</div>
                <textarea className="icm-input" style={{ width: '100%', height: 80, padding: '8px 10px' }} placeholder="描述具体的事实情况：时间、金额、涉及主体、异常表现…" value={draftFact} onChange={e => setDraftFact(e.target.value)} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 13, marginBottom: 4 }}>制度依据</div>
                <textarea className="icm-input" style={{ width: '100%', height: 64, padding: '8px 10px' }} placeholder="引用违反的法规条款或内控制度…" value={draftBasis} onChange={e => setDraftBasis(e.target.value)} />
              </div>
              <div className="icm-grid cols-2" style={{ gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 13, marginBottom: 4 }}>影响评估</div>
                  <textarea className="icm-input" style={{ width: '100%', height: 64, padding: '8px 10px' }} placeholder="对业务、财务、合规的影响程度…" value={draftImpact} onChange={e => setDraftImpact(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 13, marginBottom: 4 }}>整改建议</div>
                  <textarea className="icm-input" style={{ width: '100%', height: 64, padding: '8px 10px' }} placeholder="建议的整改措施和方向…" value={draftSuggestion} onChange={e => setDraftSuggestion(e.target.value)} />
                </div>
              </div>
            </div>
          </Card>
        ) : selected.fact ? (
          <Card title="问题定稿" note="已确认的四要素" action={<Button type="info-soft" icon={<Edit3 size={14} />} onClick={() => openDraft(selected.id)}>编辑</Button>}>
            <div className="icm-grid cols-2" style={{ gap: 10 }}>
              <div><div style={{ fontWeight: 800, color: '#0b1f43', marginBottom: 2 }}>问题事实</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{selected.fact}</div></div>
              <div><div style={{ fontWeight: 800, color: '#0b1f43', marginBottom: 2 }}>制度依据</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{selected.basis}</div></div>
              <div><div style={{ fontWeight: 800, color: '#0b1f43', marginBottom: 2 }}>影响评估</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{selected.impact}</div></div>
              <div><div style={{ fontWeight: 800, color: '#0b1f43', marginBottom: 2 }}>整改建议</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{selected.suggestion}</div></div>
            </div>
          </Card>
        ) : (
          <Card title="问题定稿" note="该问题尚未编写草稿"><div className="icm-empty-inline">问题定稿内容为空，可在"待确认"阶段编辑填写。</div></Card>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {selected.status === '待确认' ? (
            <Button type="primary" icon={<GitPullRequestArrow size={15} />} onClick={confirmIssue}>确认并派发整改</Button>
          ) : (
            <>
              <Button type="primary" icon={<FileText size={15} />}>生成问题报告</Button>
              <Button type="primary-soft" icon={<GitPullRequestArrow size={15} />}>派发整改</Button>
            </>
          )}
        </div>
      </div>

      {/* Draft edit modal (for confirmed items) */}
      {draftId && selected.status !== '待确认' ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal">
            <div className="icm-modal-head">
              <div><div className="icm-modal-title">编辑问题草稿</div><div className="icm-modal-sub">{selected.id} · {selected.title}</div></div>
              <button className="icm-modal-close" onClick={() => setDraftId(null)}><X size={16} /></button>
            </div>
            <div className="icm-modal-body" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 13, marginBottom: 4 }}>问题事实</div>
                <textarea className="icm-input" style={{ width: '100%', height: 80, padding: '8px 10px' }} value={draftFact} onChange={e => setDraftFact(e.target.value)} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 13, marginBottom: 4 }}>制度依据</div>
                <textarea className="icm-input" style={{ width: '100%', height: 64, padding: '8px 10px' }} value={draftBasis} onChange={e => setDraftBasis(e.target.value)} />
              </div>
              <div className="icm-grid cols-2" style={{ gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 13, marginBottom: 4 }}>影响评估</div>
                  <textarea className="icm-input" style={{ width: '100%', height: 64, padding: '8px 10px' }} value={draftImpact} onChange={e => setDraftImpact(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 13, marginBottom: 4 }}>整改建议</div>
                  <textarea className="icm-input" style={{ width: '100%', height: 64, padding: '8px 10px' }} value={draftSuggestion} onChange={e => setDraftSuggestion(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="icm-modal-foot">
              <Button type="primary" onClick={() => { saveDraft(); setDraftId(null) }}>保存草稿</Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  )
}
