import { useState } from 'react'
import { ChevronDown, Database, FileUp, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Button, Card, DataTable, Kpi, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { dataCollect, overview } from '../data'

type Tab = 'demands' | 'materials' | 'packages' | 'quality'

const navItems: { key: Tab; label: string; note: string }[] = [
  { key: 'demands', label: '数据需求与文件', note: '需求分派与文件入库' },
  { key: 'materials', label: '材料清单', note: '按归档节点核验完整性' },
  { key: 'packages', label: '数据包管理', note: '查看可进入审查的数据包' },
  { key: 'quality', label: '质量校验', note: '字段质量与映射规则' },
]

const materialChecklist = [
  { stage: '阶段一', node: '检查计划', type: '立项类', required: '是', count: 1, material: '2026年度采购围标风险专项检查计划.pdf', status: '已齐' },
  { stage: '阶段一', node: '资料需求清单', type: '备查类', required: '是', count: 1, material: '采购与合同专项资料需求清单.xlsx', status: '已齐' },
  { stage: '阶段一', node: '供应商准入资料', type: '证明类', required: '是', count: 0, material: '需补充供应商准入审批、评价记录', status: '待补充' },
  { stage: '阶段二', node: '招标评分表', type: '证明类', required: '是', count: 2, material: '评分表扫描件.zip', status: '待完善' },
  { stage: '阶段二', node: '付款审批流水', type: '证明类', required: '是', count: 1, material: '大额付款审批流水.xlsx', status: '已齐' },
  { stage: '阶段三', node: '整改佐证', type: '整改类', required: '是', count: 0, material: '待责任部门提交整改佐证', status: '待补充' },
]

const stats = {
  demandsTotal: dataCollect.demands.length,
  collected: dataCollect.demands.filter((d) => d.status === '已采集').length,
  packagesReady: dataCollect.resultPackages.filter((p) => p.status === '可审查').length,
  qualityAvg: Math.round(dataCollect.quality.reduce((sum, item) => sum + item.score, 0) / Math.max(dataCollect.quality.length, 1)),
  materialIncomplete: materialChecklist.filter((item) => item.status !== '已齐').length,
}

function toneForStatus(status: string): Tone {
  if (['已采集', '已入库', '可审查', '已齐', '通过'].includes(status)) return 'green'
  if (['待补充', '待完善', '关注'].includes(status)) return 'amber'
  if (status === '待处理') return 'red'
  return 'blue'
}

export default function DataCollectCenter() {
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('view')
  const tab = navItems.some((item) => item.key === requestedTab) ? requestedTab as Tab : 'demands'
  const [expandedPackages, setExpandedPackages] = useState<string[]>([dataCollect.resultPackages[0]?.id ?? ''])
  const togglePackage = (id: string) => setExpandedPackages((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])
  const active = navItems.find((item) => item.key === tab) ?? navItems[0]

  return (
    <PageFrame title="数据采集" subtitle="统一管理检查所需数据、归档材料、结果数据包和质量门禁。" actions={<><Button type="primary" icon={<FileUp size={15} />}>上传资料</Button><Button type="info-soft" icon={<Database size={15} />}>接入系统数据</Button></>}>
      <Toolbar><div className="icm-modal-search" style={{ flex: 1, maxWidth: 360 }}><Search size={15} /><input placeholder="搜索数据需求、数据包、文件…" /></div><span className="icm-toolbar-spacer" /><span style={{ color: '#64748b', fontSize: 12 }}>检查任务：{overview.taskId} · {overview.planName}</span></Toolbar>
      <div className="icm-data-kpi-row" style={{ marginBottom: 12 }}><Kpi value={stats.demandsTotal.toString()} label="数据需求" note="本次检查需求项" tone="blue" /><Kpi value={`${stats.collected}/${stats.demandsTotal}`} label="已采集" note="数据需求完成度" tone={stats.collected === stats.demandsTotal ? 'green' : 'amber'} /><Kpi value={`${stats.packagesReady}/${dataCollect.resultPackages.length}`} label="可审查数据包" note="已通过质量校验" tone="green" /><Kpi value={`${stats.qualityAvg}%`} label="数据质量均分" note="字段完整性与一致性" tone={stats.qualityAvg >= 90 ? 'green' : 'amber'} /><Kpi value={stats.materialIncomplete.toString()} label="待补材料" note={`共 ${materialChecklist.length} 个归档节点`} tone={stats.materialIncomplete ? 'amber' : 'green'} /></div>

      <Card title={active.label} note={active.note}>
        {tab === 'demands' ? <div className="icm-data-content-stack"><DataTable columns={['需求项', '责任部门', '数据量', '采集方式', '状态', '期限']} rows={dataCollect.demands.map((item) => [item.name, item.owner, `${item.rows} 行`, item.method, <Tag tone={toneForStatus(item.status)}>{item.status}</Tag>, item.due])} /><DataTable columns={['文件编号', '文件名称', '所属部门', '关联需求', '状态']} rows={dataCollect.uploads.map((item) => [item.id, item.fileName, item.owner, item.linkedDemand, <Tag tone={toneForStatus(item.status)}>{item.status}</Tag>])} /></div> : null}
        {tab === 'materials' ? <DataTable columns={['阶段', '节点名称', '类型', '是否必填', '数量', '归档材料', '状态', '操作']} rows={materialChecklist.map((item) => [item.stage, item.node, item.type, item.required, item.count, item.material, <Tag tone={toneForStatus(item.status)}>{item.status}</Tag>, item.status === '已齐' ? <button className="icm-link" type="button">查看</button> : <Button type="primary-soft" icon={<FileUp size={14} />}>立即上传</Button>])} /> : null}
        {tab === 'packages' ? <div className="icm-package-tree">{dataCollect.resultPackages.map((pkg) => { const open = expandedPackages.includes(pkg.id); return <div className="icm-package-tree-node" key={pkg.id}><button className="icm-package-tree-head" type="button" onClick={() => togglePackage(pkg.id)}><ChevronDown className={open ? 'active' : ''} size={16} /><span><strong>{pkg.name}</strong><em>{pkg.id}</em></span><Tag tone={toneForStatus(pkg.status)}>{pkg.status}</Tag></button>{open ? <div className="icm-package-tree-children">{pkg.includes.map((item) => <div key={item}><span />{item}</div>)}<p>数据来源：{pkg.includes.map((item) => { const demand = dataCollect.demands.find((demand) => demand.name.includes(item.slice(0, 2))); return demand ? `${demand.owner} · ${demand.method}` : '待确认' }).filter((item, index, list) => list.indexOf(item) === index).join(' / ')}</p></div> : null}</div> })}</div> : null}
        {tab === 'quality' ? <div className="icm-data-content-stack"><DataTable columns={['校验规则', '目标字段', '校验结果', '得分', '处理建议']} rows={dataCollect.quality.map((item) => [item.rule, item.target, <Tag tone={toneForStatus(item.result)}>{item.result}</Tag>, <b style={{ color: item.score >= 90 ? '#16a34a' : '#d97706' }}>{item.score}</b>, item.fixHint])} /><DataTable columns={['源字段', '标准字段', '业务含义']} rows={[['vendorName', 'supplier_name', '供应商名称'], ['contractAmount', 'contract_amount', '合同金额'], ['signDate', 'sign_date', '签署日期'], ['approvalNode', 'approval_node', '审批节点']]} /></div> : null}
      </Card>
    </PageFrame>
  )
}
