import { useMemo, useState } from 'react'
import { AlertTriangle, Filter, GitPullRequestArrow, Search } from 'lucide-react'
import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Segmented, Tag, Toolbar } from '../components/IcmPageKit'

type Level = 'all' | 'major' | 'normal' | 'closed'

const issues = [
  { id: 'IS-2026-001', title: '三家投标供应商报价差异极小且格式相似', level: '重大', status: '待确认', owner: '采购管理部', workpaper: 'WP-CG-001', evidence: 'EV-2026-0618-01', deadline: '2026-07-08' },
  { id: 'IS-2026-002', title: '供应商联系人与注册地址存在重合', level: '重要', status: '整改中', owner: '供应商管理岗', workpaper: 'WP-CG-002', evidence: 'EV-2026-0620-04', deadline: '2026-07-15' },
  { id: 'IS-2026-003', title: '个别项目评审说明缺少独立评分依据', level: '一般', status: '待整改', owner: '评审组织岗', workpaper: 'WP-NK-004', evidence: 'EV-2026-0618-02', deadline: '2026-07-12' },
  { id: 'IS-2026-004', title: '付款节点早于验收资料归档时间', level: '重要', status: '已关闭', owner: '财务共享中心', workpaper: 'WP-ZJ-003', evidence: 'EV-2026-0619-03', deadline: '2026-06-28' },
]

function tone(value: string) {
  if (value.includes('重大') || value.includes('待确认')) return 'red'
  if (value.includes('重要') || value.includes('整改') || value.includes('待')) return 'amber'
  if (value.includes('关闭')) return 'green'
  return 'blue'
}

export default function IssueLedger() {
  const [level, setLevel] = useState<Level>('all')
  const [selectedId, setSelectedId] = useState(issues[0].id)
  const selected = useMemo(() => issues.find((item) => item.id === selectedId) ?? issues[0], [selectedId])
  const filtered = issues.filter((item) => {
    if (level === 'major') return item.level === '重大' || item.level === '重要'
    if (level === 'normal') return item.level === '一般'
    if (level === 'closed') return item.status === '已关闭'
    return true
  })

  return (
    <PageFrame
      title="问题台账"
      subtitle="围绕问题筛选、列表、详情和来源追溯组织台账，支持从问题回到底稿和取证记录。"
      actions={
        <>
          <Button type="primary" icon={<AlertTriangle size={16} />}>生成问题</Button>
          <Button type="primary-soft" icon={<GitPullRequestArrow size={16} />}>派发整改</Button>
        </>
      }
    >
      <Toolbar>
        <Search size={16} color="#607089" />
        <input className="icm-input" placeholder="搜索问题、责任部门、编号" />
        <select className="icm-select" defaultValue="全部状态">
          <option>全部状态</option>
          <option>待确认</option>
          <option>待整改</option>
          <option>整改中</option>
          <option>已关闭</option>
        </select>
        <Segmented
          value={level}
          onChange={setLevel}
          options={[
            { label: '全部', value: 'all' },
            { label: '重大/重要', value: 'major' },
            { label: '一般', value: 'normal' },
            { label: '已关闭', value: 'closed' },
          ]}
        />
      </Toolbar>

      <div className="icm-grid cols-4" style={{ marginBottom: 12 }}>
        <Kpi value="24" label="问题总数" note="采购领域 11 项" tone="blue" />
        <Kpi value="6" label="重大/重要" note="需领导关注" tone="red" />
        <Kpi value="15" label="已派发整改" note="平均剩余 8 天" tone="amber" />
        <Kpi value="83%" label="证据完备率" note="可直接入报告" tone="green" />
      </div>

      <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(360px,.8fr)' }}>
        <Card title="问题列表" note="筛选后仍保留来源编号，便于业务人员扫读">
          <DataTable
            columns={['问题编号', '问题描述', '等级', '状态', '责任部门', '期限']}
            rows={filtered.map((item) => [
              <button className="icm-link" onClick={(e) => { e.stopPropagation(); setSelectedId(item.id) }}>{item.id}</button>,
              item.title,
              <Tag tone={tone(item.level)}>{item.level}</Tag>,
              <Tag tone={tone(item.status)}>{item.status}</Tag>,
              item.owner,
              item.deadline,
            ])}
            onRowClick={(i) => setSelectedId(filtered[i].id)}
          />
        </Card>

        <Card title="问题详情与溯源" note={selected.id} action={<Button type="warn-soft" icon={<Filter size={15} />}>补充筛查</Button>}>
          <DetailLine label="问题描述" value={selected.title} />
          <DetailLine label="问题等级" value={<Tag tone={tone(selected.level)}>{selected.level}</Tag>} />
          <DetailLine label="责任部门" value={selected.owner} />
          <DetailLine label="来源底稿" value={<button className="icm-link">{selected.workpaper}</button>} />
          <DetailLine label="来源证据" value={<button className="icm-link">{selected.evidence}</button>} />
          <DetailLine label="确认口径" value="问题确认需包含事实描述、制度依据、影响程度、责任归属和整改要求。" />
          <DetailLine label="下一步" value={selected.status === '已关闭' ? '纳入报告闭环案例。' : '派发整改任务并跟踪佐证材料。'} />
        </Card>
      </div>

      <div className="icm-grid cols-3" style={{ marginTop: 12 }}>
        {[
          ['事实链', '从采购项目、报价文件、评审记录、合同、付款凭证逐项形成可核查链条。', 'blue'],
          ['制度链', '引用采购管理办法、供应商管理细则、评审纪律要求和内控手册条款。', 'cyan'],
          ['责任链', '明确业务责任部门、经办岗位、复核岗位和整改审批岗位。', 'amber'],
        ].map(([title, text, itemTone]) => (
          <Card title={title} note="问题确认三要素" key={title}>
            <div className="icm-list-row">
              <div>
                <div className="icm-list-title">{title}</div>
                <div className="icm-list-meta">{text}</div>
              </div>
              <Tag tone={itemTone as 'blue' | 'cyan' | 'amber'}>溯源</Tag>
            </div>
          </Card>
        ))}
      </div>
    </PageFrame>
  )
}
