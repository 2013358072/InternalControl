import { create } from 'zustand'

export type IssueLevel = '重大' | '重要' | '一般'
export type IssueStatus = '待确认' | '整改中' | '已整改' | '已关闭'
export type RectificationStatus = '整改中' | '已整改'
export type AuditStatus = '待处理' | '已通过' | '已退回'
export type ReportStatus = '草稿' | '待审核' | '审核中' | '审核不通过' | '审核通过' | '已归档'

export interface WorkflowIssue { id: string; title: string; level: IssueLevel; status: IssueStatus; owner: string; deadline: string; workpaperId: string; evidenceIds: string[]; fact: string; basis: string; rootCause: string; impact: string; suggestion: string; rectificationId?: string; updatedAt: string }
export interface WorkflowRectification { id: string; issueId: string; title: string; owner: string; status: RectificationStatus; progress: number; proofCount: number; verifyConclusion: string; updatedAt: string }
export interface WorkflowAudit { id: string; type: string; title: string; businessId: string; route: string; applicant: string; status: AuditStatus; node: string; submittedAt: string; opinion?: string }
export interface WorkflowReport { id: string; title: string; rectificationId: string; owner: string; status: ReportStatus; referenceIds: string[]; updatedAt: string; auditOpinion?: string }

const stamp = '2026-07-14 10:00'
const issues: WorkflowIssue[] = [
  { id: 'ISS-2026-001', title: '三家投标供应商报价差异极小且格式相似', level: '重大', status: '待确认', owner: '采购管理部', deadline: '2026-07-30', workpaperId: 'WP-CG-001', evidenceIds: ['EV-2026-0618-01'], fact: '三家投标供应商报价差异极小，投标文件格式和生成信息存在相似特征。', basis: '集团采购管理办法第18条、招投标合规指引第12条。', rootCause: '供应商独立性核验和评审复核控制执行不足。', impact: '可能影响采购竞争充分性和价格公允性。', suggestion: '补充关联关系核验，完善异常报价复核和供应商准入控制。', updatedAt: stamp },
  { id: 'ISS-2026-002', title: '供应商联系人与注册地址存在重合', level: '重要', status: '整改中', owner: '供应链管理部', deadline: '2026-08-05', workpaperId: 'WP-CG-002', evidenceIds: ['EV-2026-0620-04'], fact: '两家报名供应商联系人和注册地址存在重合。', basis: '供应商管理细则第9条。', rootCause: '供应商准入信息核验范围不足。', impact: '存在陪标围标和供应商管理失效风险。', suggestion: '建立关联供应商识别规则并复核存量供应商档案。', rectificationId: 'RCT-2026-002', updatedAt: stamp },
  { id: 'ISS-2026-003', title: '个别项目评审说明缺少独立评分依据', level: '一般', status: '整改中', owner: '采购管理部', deadline: '2026-07-25', workpaperId: 'WP-NK-004', evidenceIds: ['EV-2026-0618-02'], fact: '个别评审说明未完整记录评分差异的判断依据。', basis: '采购评审管理细则第14条。', rootCause: '评审记录模板未固化复核要求。', impact: '评审过程可追溯性不足。', suggestion: '修订评审记录模板并开展业务培训。', rectificationId: 'RCT-2026-003', updatedAt: stamp },
  { id: 'ISS-2026-004', title: '付款节点早于验收资料归档时间', level: '重要', status: '已整改', owner: '财务共享中心', deadline: '2026-07-10', workpaperId: 'WP-ZJ-003', evidenceIds: ['EV-2026-0619-03'], fact: '付款审批节点早于验收资料归档时间。', basis: '资金支付管理办法第15条。', rootCause: '付款审批与验收归档未形成系统校验。', impact: '可能造成验收前付款风险。', suggestion: '增加付款前验收资料完整性校验。', rectificationId: 'RCT-2026-004', updatedAt: stamp },
]
const rectifications: WorkflowRectification[] = [
  { id: 'RCT-2026-002', issueId: 'ISS-2026-002', title: '供应商关联关系核验整改', owner: '供应链管理部', status: '整改中', progress: 55, proofCount: 2, verifyConclusion: '待检查组复核', updatedAt: stamp },
  { id: 'RCT-2026-003', issueId: 'ISS-2026-003', title: '评审记录完整性整改', owner: '采购管理部', status: '整改中', progress: 70, proofCount: 1, verifyConclusion: '待补充培训记录', updatedAt: stamp },
  { id: 'RCT-2026-004', issueId: 'ISS-2026-004', title: '付款验收联动整改', owner: '财务共享中心', status: '已整改', progress: 100, proofCount: 3, verifyConclusion: '复核通过', updatedAt: stamp },
]
const audits: WorkflowAudit[] = [{ id: 'APR-2026-021', type: '问题确认', title: '三家投标供应商报价差异极小且格式相似', businessId: 'ISS-2026-001', route: '/issues?issue=ISS-2026-001', applicant: '李娜', status: '待处理', node: '检查组长确认', submittedAt: stamp }]
const reports: WorkflowReport[] = [{ id: 'RPT-2026-004', title: '付款验收联动整改情况报告', rectificationId: 'RCT-2026-004', owner: '财务共享中心', status: '草稿', referenceIds: ['ISS-2026-004', 'WP-ZJ-003', 'EV-2026-0619-03', 'RCT-2026-004'], updatedAt: stamp }]

interface WorkflowState {
  issues: WorkflowIssue[]; rectifications: WorkflowRectification[]; audits: WorkflowAudit[]; reports: WorkflowReport[]
  saveIssueDraft: (id: string, patch: Pick<WorkflowIssue, 'fact' | 'basis' | 'rootCause' | 'impact' | 'suggestion'>) => void
  createIssueDraft: (input: Pick<WorkflowIssue, 'title' | 'level' | 'owner' | 'workpaperId' | 'evidenceIds' | 'basis'>) => string
  confirmIssue: (id: string, patch?: Pick<WorkflowIssue, 'fact' | 'basis' | 'rootCause' | 'impact' | 'suggestion'>) => string | undefined; addRectificationProof: (id: string) => void; submitRectificationReview: (id: string) => void
  createReport: (id: string) => string; generateReportLedger: (id: string) => void; submitReportAudit: (id: string) => void; archiveReport: (id: string) => void
  approveAudit: (id: string, opinion: string) => void; returnAudit: (id: string, opinion: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  issues, rectifications, audits, reports,
  saveIssueDraft: (id, patch) => set((state) => ({ issues: state.issues.map((item) => item.id === id ? { ...item, ...patch, updatedAt: stamp } : item) })),
  createIssueDraft: (input) => { const id = `ISS-2026-${String(get().issues.length + 1).padStart(3, '0')}`; set((state) => ({ issues: [...state.issues, { id, ...input, status: '待确认', deadline: '待确认', fact: '', rootCause: '', impact: '', suggestion: '', updatedAt: stamp }] })); return id },
  confirmIssue: (id) => { const issue = get().issues.find((item) => item.id === id); if (!issue || !issue.fact.trim() || !issue.basis.trim() || !issue.rootCause.trim()) return; const rectificationId = issue.rectificationId ?? `RCT-2026-${id.slice(-3)}`; set((state) => ({ issues: state.issues.map((item) => item.id === id ? { ...item, status: '整改中', rectificationId, updatedAt: stamp } : item), rectifications: state.rectifications.some((item) => item.id === rectificationId) ? state.rectifications : [...state.rectifications, { id: rectificationId, issueId: id, title: `${issue.title}整改`, owner: issue.owner, status: '整改中', progress: 0, proofCount: 0, verifyConclusion: '待责任单位反馈', updatedAt: stamp }] })); return rectificationId },
  addRectificationProof: (id) => set((state) => ({ rectifications: state.rectifications.map((item) => item.id === id ? { ...item, proofCount: item.proofCount + 1, progress: Math.min(95, item.progress + 15), updatedAt: stamp } : item) })),
  submitRectificationReview: (id) => { const rectification = get().rectifications.find((item) => item.id === id); if (!rectification || get().audits.some((item) => item.businessId === id && item.status === '待处理')) return; set((state) => ({ audits: [...state.audits, { id: `APR-2026-${String(state.audits.length + 21).padStart(3, '0')}`, type: '整改复核', title: rectification.title, businessId: id, route: `/rectify?rect=${id}`, applicant: rectification.owner, status: '待处理', node: '内控部门复核', submittedAt: stamp }] })) },
  createReport: (id) => { const existing = get().reports.find((item) => item.rectificationId === id); if (existing) return existing.id; const rectification = get().rectifications.find((item) => item.id === id); const issue = get().issues.find((item) => item.id === rectification?.issueId); const reportId = `RPT-2026-${id.slice(-3)}`; set((state) => ({ reports: [...state.reports, { id: reportId, title: `${issue?.title ?? '整改事项'}整改情况报告`, rectificationId: id, owner: rectification?.owner ?? '待确认', status: '草稿', referenceIds: [issue?.id, issue?.workpaperId, ...(issue?.evidenceIds ?? []), id].filter(Boolean) as string[], updatedAt: stamp }] })); return reportId },
  generateReportLedger: (id) => set((state) => ({ reports: state.reports.map((item) => item.id === id && (item.status === '草稿' || item.status === '审核不通过') ? { ...item, status: '待审核', updatedAt: stamp } : item) })),
  submitReportAudit: (id) => { const report = get().reports.find((item) => item.id === id); if (!report || report.status !== '待审核') return; set((state) => ({ reports: state.reports.map((item) => item.id === id ? { ...item, status: '审核中', updatedAt: stamp } : item), audits: [...state.audits, { id: `APR-2026-${String(state.audits.length + 21).padStart(3, '0')}`, type: '报告审核', title: report.title, businessId: id, route: `/report?report=${id}`, applicant: report.owner, status: '待处理', node: '内控部门审核', submittedAt: stamp }] })) },
  archiveReport: (id) => set((state) => ({ reports: state.reports.map((item) => item.id === id && item.status === '审核通过' ? { ...item, status: '已归档', updatedAt: stamp } : item) })),
  approveAudit: (id, opinion) => { const audit = get().audits.find((item) => item.id === id); set((state) => ({ audits: state.audits.map((item) => item.id === id ? { ...item, status: '已通过', opinion } : item), rectifications: audit?.type === '整改复核' ? state.rectifications.map((item) => item.id === audit.businessId ? { ...item, status: '已整改', progress: 100, verifyConclusion: '复核通过', updatedAt: stamp } : item) : state.rectifications, issues: audit?.type === '整改复核' ? state.issues.map((item) => state.rectifications.find((rectification) => rectification.id === audit.businessId)?.issueId === item.id ? { ...item, status: '已整改', updatedAt: stamp } : item) : state.issues, reports: audit?.type === '报告审核' ? state.reports.map((item) => item.id === audit.businessId ? { ...item, status: '审核通过', auditOpinion: opinion, updatedAt: stamp } : item) : state.reports })) },
  returnAudit: (id, opinion) => { const audit = get().audits.find((item) => item.id === id); set((state) => ({ audits: state.audits.map((item) => item.id === id ? { ...item, status: '已退回', opinion } : item), reports: audit?.type === '报告审核' ? state.reports.map((item) => item.id === audit.businessId ? { ...item, status: '审核不通过', auditOpinion: opinion, updatedAt: stamp } : item) : state.reports })) },
}))