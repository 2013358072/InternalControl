import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronLeft, ClipboardList, Download, FilePlus2, FileText, Play, Search, Send, X } from 'lucide-react'
import * as XLSX from 'xlsx'

import {
  agents,
  dataCollect,
  dispatch,
  evidences,
  findings,
  issues,
  plans,
  rectifications,
  reports,
  rules,
  tasks,
  toneByStatus,
  walkthrough,
  workpapers,
} from '../data'
import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Segmented, StepList, Tag, Toolbar, type Tone } from '../components/IcmPageKit'

type DataTab = 'demand' | 'quality' | 'rules'
type ReviewTab = 'rules' | 'walkthrough' | 'confirm'
type RectifyTab = 'plan' | 'proof' | 'report'
type ReportModal = 'materials' | 'templates' | null
type ReportFlow = 'editing' | 'drafted' | 'ledger' | 'reviewing' | 'approved' | 'archived'

function statusTone(status: string): Tone {
  return toneByStatus(status) as Tone
}

function SectionTitle({ children }: { children: string }) {
  return <div className="icm-subsection-head"><div className="icm-card-title">{children}</div></div>
}

function WorkflowLayout({ side, main }: { side: React.ReactNode; main: React.ReactNode }) {
  return (
    <div className="icm-workflow-layout">
      <div className="icm-workflow-side">{side}</div>
      <div className="icm-workflow-main">{main}</div>
    </div>
  )
}

const planPool = [
  {
    id: 'PL-2026-001',
    name: '2026年度采购围标风险专项检查计划',
    type: '专项检查',
    source: '年度计划',
    status: '已立项',
    unit: '华北装备制造集团西北分公司',
    unitLevel: '二级企业',
    checkDomain: '采购',
    riskTheme: '采购围标风险',
    owner: '张衡',
    period: '2026-06-20 至 2026-07-31',
    budget: '32 人/天',
    basis: '年度内控检查安排（内控办〔2026〕3号）、集团采购管理办法第18条、招投标合规指引第12条',
    objective: '核验采购围标风险识别、报价异常检测、供应商关联关系排查的完整性和整改闭环有效性。',
    avoidanceCheck: '已通过',
    blocker: '检查组已进场，正执行检查任务',
    next: '进入智能审查',
    approvals: [
      { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '通过', date: '2026-06-10', opinion: '检查范围适当，建议增加供应商关联关系核验指标。' },
      { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '通过', date: '2026-06-12', opinion: '检查依据充分，合规性审核通过。' },
      { node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '通过', date: '2026-06-14', opinion: '经党委会研究，同意纳入年度专项检查计划。' },
      { node: '分管领导审批', owner: '赵总', role: '分管副总经理', status: '通过', date: '2026-06-16', opinion: '同意按方案执行，重点关注围标陪标风险。' },
      { node: '主要领导审批', owner: '孙总', role: '总经理', status: '通过', date: '2026-06-18', opinion: '批准立项，检查组尽快进场。' },
    ],
  },
  {
    id: 'PL-2026-014',
    name: '供应商关联交易风险专项检查',
    type: '专项检查',
    source: '风险预警',
    status: '待校审',
    unit: '华东装备制造有限公司',
    unitLevel: '二级企业',
    checkDomain: '采购',
    riskTheme: '供应商关联风险',
    owner: '李娜',
    period: '2026-07-05 至 2026-08-05',
    budget: '28 人天',
    basis: '风险驾驶舱红色预警（预警编号 RA-2026-0628）、供应商管理细则第9条、关联交易管理办法',
    objective: '核验供应商关联关系、异常交易和审批留痕是否完整，排查围标陪标风险。',
    avoidanceCheck: '已通过',
    blocker: '待提交线上校审',
    next: '提交审批流',
    approvals: [
      { node: '风险预警触发', owner: '风险驾驶舱', role: '系统自动', status: '通过', date: '2026-07-01', opinion: '红色预警已自动触发专项检查建议。' },
      { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '待处理', date: '-', opinion: '待确认检查范围与抽样口径。' },
      { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '待处理', date: '-', opinion: '待线上流转。' },
      { node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '待处理', date: '-', opinion: '待前置研究。' },
      { node: '分管领导审批', owner: '赵总', role: '分管副总经理', status: '待处理', date: '-', opinion: '待线上校审通过后审批。' },
    ],
  },
  {
    id: 'PL-2026-021',
    name: '资金支付审批链抽查计划',
    type: '专项抽查',
    source: '审计协同',
    status: '已派发',
    unit: '财务共享中心',
    unitLevel: '集团直管',
    checkDomain: '资金',
    riskTheme: '资金支付风险',
    owner: '王锐',
    period: '2026-06-18 至 2026-07-20',
    budget: '18 人天',
    basis: '审计部年度审计计划（审计〔2026〕12号）、资金支付制度第8条、大额资金监督管理办法',
    objective: '复核大额支付审批链完整性、超比例付款情况和验收前付款合规性。',
    avoidanceCheck: '已通过',
    blocker: '无阻塞，已进入执行阶段',
    next: '查看执行',
    approvals: [
      { node: '审计计划同步', owner: '审计部', role: '审计部', status: '通过', date: '2026-06-18', opinion: '已纳入年度审计协同计划。' },
      { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '通过', date: '2026-06-19', opinion: '同意协同审计，由内控检查组执行抽查。' },
      { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '通过', date: '2026-06-19', opinion: '合规审查通过。' },
      { node: '分管领导审批', owner: '赵总', role: '分管副总经理', status: '通过', date: '2026-06-20', opinion: '同意派发至财务共享中心。' },
    ],
  },
  {
    id: 'PL-2026-028',
    name: '境外投资项目内控专项检查',
    type: '穿透监管测试',
    source: '上级交办',
    status: '待校审',
    unit: '国际业务事业部',
    unitLevel: '集团直管',
    checkDomain: '境外',
    riskTheme: '境外投资监管',
    owner: '赵明',
    period: '2026-08-01 至 2026-09-15',
    budget: '45 人天',
    basis: '国资委国资厅监督〔2026〕15号文、境外投资管理办法、境外资产监督管理办法',
    objective: '验证境外投资项目数据回传、授权审批和风险预警专岗配置情况，执行穿透监管测试。',
    avoidanceCheck: '已通过',
    blocker: '计划范围待完善',
    next: '完善计划详情',
    approvals: [
      { node: '计划草拟', owner: '赵明', role: '国际业务部', status: '进行中', date: '2026-07-01', opinion: '检查范围和系统清单待补充。' },
      { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '未提交', date: '-', opinion: '完善后提交线上校审。' },
      { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '未提交', date: '-', opinion: '待前置条件满足。' },
      { node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '未提交', date: '-', opinion: '穿透监管测试类须党委前置研究。' },
      { node: '董事会审议', owner: '董事会办公室', role: '董事会办', status: '未提交', date: '-', opinion: '穿透监管测试类须经董事会审议。' },
      { node: '分管领导审批', owner: '钱总', role: '分管副总经理', status: '未提交', date: '-', opinion: '待前置审批完成。' },
    ],
  },
  {
    id: 'PL-2026-035',
    name: '产权转让合规性专项检查',
    type: '专项检查',
    source: '巡视移送',
    status: '草稿',
    unit: '南方能源集团有限公司',
    unitLevel: '二级企业',
    checkDomain: '产权',
    riskTheme: '产权转让合规',
    owner: '周伟',
    period: '2026-08-10 至 2026-09-20',
    budget: '35 人天',
    basis: '巡视组移送问题线索（巡移〔2026〕18号）、企业国有资产交易监督管理办法、集团产权管理规定',
    objective: '核验产权转让进场交易、资产评估备案和审批决策程序完整性。',
    avoidanceCheck: '校验中',
    blocker: '检查组成员待确定',
    next: '完善计划并提交校审',
    approvals: [
      { node: '巡视移送接收', owner: '内控监督部', role: '接收登记', status: '通过', date: '2026-06-28', opinion: '巡视移送线索已登记，转内控专项检查。' },
      { node: '计划草拟', owner: '周伟', role: '检查组', status: '进行中', date: '-', opinion: '检查方案编制中。' },
      { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '未提交', date: '-', opinion: '待计划草拟完成。' },
      { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '未提交', date: '-', opinion: '待前置条件满足。' },
      { node: '分管领导审批', owner: '赵总', role: '分管副总经理', status: '未提交', date: '-', opinion: '巡视移送类必须经分管领导审批。' },
    ],
  },
  {
    id: 'PL-2026-042',
    name: '金融衍生品业务风险专项检查',
    type: '专项检查',
    source: '上级交办',
    status: '待校审',
    unit: '集团金融事业部',
    unitLevel: '集团直管',
    checkDomain: '金融',
    riskTheme: '金融衍生品风险',
    owner: '陈明',
    period: '2026-07-15 至 2026-08-30',
    budget: '38 人天',
    basis: '国资委金融衍生品业务监管通知（国资发评价〔2026〕42号）、集团金融业务管理办法',
    objective: '核验金融衍生品交易的授权审批、风险敞口限额控制和套期保值合规性。',
    avoidanceCheck: '已通过',
    blocker: '待外部专家聘用到岗',
    next: '提交审批流',
    approvals: [
      { node: '上级交办接收', owner: '内控监督部', role: '接收登记', status: '通过', date: '2026-06-25', opinion: '国资委通知已登记，纳入年度检查计划。' },
      { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '待处理', date: '-', opinion: '待外部专家聘用到岗后启动校审。' },
      { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '待处理', date: '-', opinion: '金融衍生品业务须合规部专项审查。' },
      { node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '待处理', date: '-', opinion: '重大金融风险领域须党委前置研究。' },
      { node: '分管领导审批', owner: '钱总', role: '分管金融副总经理', status: '待处理', date: '-', opinion: '待线上流转。' },
    ],
  },
  {
    id: 'PL-2026-008',
    name: '工程项目招投标合规性检查',
    type: '专项抽查',
    source: '年度计划',
    status: '已派发',
    unit: '西南建设投资集团有限公司',
    unitLevel: '二级企业',
    checkDomain: '工程项目',
    riskTheme: '招投标合规',
    owner: '刘峰',
    period: '2026-05-10 至 2026-07-10',
    budget: '40 人天',
    basis: '年度内控检查安排（内控办〔2026〕3号）、招标投标法实施条例、集团工程建设招标管理办法',
    objective: '抽查工程项目招标文件编制、评委抽取、评标过程和定标程序的合规完整性。',
    avoidanceCheck: '已通过',
    blocker: '无阻塞，已进场执行',
    next: '进入检查底稿',
    approvals: [
      { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '通过', date: '2026-04-20', opinion: '以工程项目招投标为抽查重点，建议覆盖3类以上工程类型。' },
      { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '通过', date: '2026-04-22', opinion: '合规审查通过。' },
      { node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '通过', date: '2026-04-24', opinion: '经党委会研究，同意立项。' },
      { node: '分管领导审批', owner: '赵总', role: '分管副总经理', status: '通过', date: '2026-04-26', opinion: '同意派发执行。' },
      { node: '主要领导审批', owner: '孙总', role: '总经理', status: '通过', date: '2026-04-28', opinion: '批准。' },
    ],
  },
]

const splitSteps = ['读取计划范围', '匹配检查规则', '生成任务包', '生成资料清单', '生成派发对象']

export function PlanDispatchStage() {
  const wizardFileInputRef = useRef<HTMLInputElement>(null)
  const keyFocusInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create'>('list')
  const [allPlans, setAllPlans] = useState<typeof planPool>(planPool)
  const [selectedPlanId, setSelectedPlanId] = useState(planPool[0]?.id)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [splitIds, setSplitIds] = useState<string[]>([])
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [dispatchedIds, setDispatchedIds] = useState<string[]>(['PL-2026-021'])
  const [taskBookIds, setTaskBookIds] = useState<string[]>([])
  const [assignedPlans, setAssignedPlans] = useState<string[]>(['PL-2026-021'])
  const [splitting, setSplitting] = useState(false)
  const [splitIndex, setSplitIndex] = useState(-1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sourceFilter, setSourceFilter] = useState('全部来源')
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([])
  const [exportMode, setExportMode] = useState(false)
  type CreateStep = 'basic' | 'scope' | 'resources' | 'preview'
  interface TeamMember { name: string; role: string }
  interface CreatePlanForm {
    name: string; type: string; checkDomains: string[]; riskTheme: string
    unit: string; unitLevel: string; periodStart: string; periodEnd: string; budgetWorkdays: string
    policyBasis: string; objective: string; scopeDescription: string
    keyFocusAreas: string[]; samplingRule: string; samplingDetail: string
    teamLeader: string; teamMembers: TeamMember[]; needExternalExpert: boolean
    externalExpert: string; approver: string; needParty: boolean; needBoard: boolean
  }
  const [currentStep, setCurrentStep] = useState<CreateStep>('basic')
  const [formDirty, setFormDirty] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof CreatePlanForm | 'form', string>>>({})
  const [wizardForm, setWizardForm] = useState<CreatePlanForm>({
    name: '', type: '专项检查', checkDomains: [], riskTheme: '',
    unit: '', unitLevel: '二级企业', periodStart: '', periodEnd: '', budgetWorkdays: '',
    policyBasis: '', objective: '', scopeDescription: '',
    keyFocusAreas: [], samplingRule: '风险导向抽样', samplingDetail: '',
    teamLeader: '', teamMembers: [], needExternalExpert: false,
    externalExpert: '', approver: '', needParty: true, needBoard: false,
  })
  type Wiz = typeof wizardForm

  const resetWizard = () => {
    setWizardForm({
      name: '', type: '专项检查', checkDomains: [], riskTheme: '',
      unit: '', unitLevel: '二级企业', periodStart: '', periodEnd: '', budgetWorkdays: '',
      policyBasis: '', objective: '', scopeDescription: '',
      keyFocusAreas: [], samplingRule: '风险导向抽样', samplingDetail: '',
      teamLeader: '', teamMembers: [], needExternalExpert: false,
      externalExpert: '', approver: '', needParty: true, needBoard: false,
    })
    setCurrentStep('basic')
    setFormDirty(false)
    setValidationErrors({})
    setSubmitted(false)
    setEditingPlanId(null)
  }

  const updateForm = (patch: Partial<Wiz>) => {
    setWizardForm((f) => ({ ...f, ...patch }))
    setFormDirty(true)
  }

  const stepOrder: CreateStep[] = ['basic', 'scope', 'resources', 'preview']

  function validateStep(step: CreateStep): boolean {
    const errors: Partial<Record<keyof CreatePlanForm, string>> = {}
    if (step === 'basic' || step === 'preview') {
      if (!wizardForm.name.trim()) errors.name = '计划名称为必填项'
      if (!wizardForm.unit.trim()) errors.unit = '被检查单位为必填项'
      if (wizardForm.checkDomains.length === 0) (errors as Record<string,string>).checkDomains = '请至少选择一个检查领域'
    }
    if (step === 'resources' || step === 'preview') {
      if (!wizardForm.teamLeader.trim()) errors.teamLeader = '检查组长为必填项'
      if (!wizardForm.approver.trim()) errors.approver = '内控审批人为必填项'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const startEditPlan = (plan: (typeof planPool)[number]) => {
    setWizardForm({
      name: plan.name, type: plan.type, checkDomains: plan.checkDomain ? plan.checkDomain.split('/').filter(Boolean) : [], riskTheme: plan.riskTheme || '',
      unit: plan.unit, unitLevel: plan.unitLevel || '二级企业', periodStart: '', periodEnd: '', budgetWorkdays: (plan.budget || '').replace(/[^0-9]/g, ''),
      policyBasis: plan.basis || '', objective: plan.objective || '', scopeDescription: '',
      keyFocusAreas: [], samplingRule: '风险导向抽样', samplingDetail: '',
      teamLeader: plan.owner || '', teamMembers: [], needExternalExpert: false,
      externalExpert: '', approver: '', needParty: true, needBoard: plan.type === '穿透监管测试',
    })
    setEditingPlanId(plan.id)
    setCurrentStep('basic')
    setFormDirty(false)
    setValidationErrors({})
    setSubmitted(false)
    setViewMode('create')
  }

  const buildApprovalChain = (): typeof planPool[number]['approvals'] => {
    const now = new Date()
    const approvals: typeof planPool[number]['approvals'] = []
    approvals.push({ node: '计划草拟', owner: wizardForm.teamLeader || '当前用户', role: '检查组', status: '通过', date: now.toISOString().slice(0, 10), opinion: '手工创建计划。' })
    if (wizardForm.needParty) approvals.push({ node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '待处理', date: '-', opinion: '重大检查事项须党委前置研究。' })
    if (wizardForm.needBoard) approvals.push({ node: '董事会审议', owner: '董事会办公室', role: '董事会办', status: '待处理', date: '-', opinion: '穿透监管测试类须经董事会审议。' })
    approvals.push({ node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '待处理', date: '-', opinion: '待合规审查。' })
    approvals.push({ node: '内控部门审核', owner: wizardForm.approver || '待分配', role: '内控部负责人', status: '待处理', date: '-', opinion: '需线上确认检查范围和依据。' })
    approvals.push({ node: '分管领导审批', owner: '待分配', role: '分管领导', status: '待处理', date: '-', opinion: '待线上流转。' })
    return approvals
  }

  const [lastSavedAsDraft, setLastSavedAsDraft] = useState(false)

  const handleSubmitPlan = (asDraft = false) => {
    if (!asDraft && !validateStep('preview')) return
    const period = wizardForm.periodStart && wizardForm.periodEnd
      ? `${wizardForm.periodStart} 至 ${wizardForm.periodEnd}`
      : '待确定'
    const editingId = editingPlanId

    if (editingId) {
      setAllPlans((prev) => prev.map((plan) => {
        if (plan.id !== editingId) return plan
        const keepApprovals = plan.approvals && plan.approvals.length > 0
        return {
          ...plan,
          name: wizardForm.name.trim() || plan.name,
          type: wizardForm.type,
          status: asDraft ? '草稿' : '待校审',
          unit: wizardForm.unit.trim() || plan.unit,
          unitLevel: wizardForm.unitLevel,
          owner: wizardForm.teamLeader.trim() || plan.owner,
          period, basis: wizardForm.policyBasis.trim() || plan.basis,
          objective: wizardForm.objective.trim() || plan.objective,
          riskTheme: wizardForm.riskTheme.trim() || plan.riskTheme,
          checkDomain: wizardForm.checkDomains.join('/') || plan.checkDomain,
          budget: wizardForm.budgetWorkdays?.trim() ? `${wizardForm.budgetWorkdays.trim()} 人天` : plan.budget,
          blocker: asDraft ? '草稿待完善' : '待提交线上校审',
          next: asDraft ? '完善并提交校审' : '提交审批流',
          approvals: asDraft ? plan.approvals : (keepApprovals ? plan.approvals : buildApprovalChain()),
        }
      }))
    } else {
      const idSuffix = String(allPlans.length + 1).padStart(3, '0')
      const id = `PL-${new Date().getFullYear()}-${idSuffix}`
      const newPlan = {
        id, name: wizardForm.name.trim() || '未命名计划', type: wizardForm.type,
        status: asDraft ? '草稿' : '待校审', unit: wizardForm.unit.trim() || '待填写',
        unitLevel: wizardForm.unitLevel, owner: wizardForm.teamLeader.trim() || '当前用户',
        period, basis: wizardForm.policyBasis.trim() || '待补充',
        objective: wizardForm.objective.trim() || '待填写',
        riskTheme: wizardForm.riskTheme.trim() || `${wizardForm.checkDomains.join('/')}风险`,
        checkDomain: wizardForm.checkDomains.join('/'), source: '手工创建',
        budget: wizardForm.budgetWorkdays?.trim() ? `${wizardForm.budgetWorkdays.trim()} 人天` : '待评估',
        avoidanceCheck: '已通过', blocker: asDraft ? '草稿待完善' : '待提交线上校审',
        next: asDraft ? '完善并提交校审' : '提交审批流', approvals: asDraft ? [] : buildApprovalChain(),
      }
      setAllPlans((items) => [newPlan, ...items])
      setSelectedPlanId(id)
    }
    setSubmitted(true)
    setLastSavedAsDraft(asDraft)
    const nextView = editingId ? 'detail' : 'list'
    window.setTimeout(() => { resetWizard(); setViewMode(nextView) }, 1500)
  }

  const plansForView = allPlans
  const selected = plansForView.find((plan) => plan.id === selectedPlanId) ?? plansForView[0]
  const isPlanApproved = (plan: (typeof planPool)[number]) => (plan.approvals?.length ?? 0) > 0 && plan.approvals.every((n) => n.status === '通过')
  const allPassed = isPlanApproved(selected)
  const [approvalOpen, setApprovalOpen] = useState(!allPassed)
  useEffect(() => {
    setApprovalOpen(!allPassed)
  }, [allPassed])

  const isApproved = isPlanApproved(selected)
  const isSplit = splitIds.includes(selected.id) || selected.status === '已派发'
  const isAssigned = assignedIds.includes(selected.id)
  const isDispatched = dispatchedIds.includes(selected.id)
  const hasTaskBook = taskBookIds.includes(selected.id)
  const currentStatus = isDispatched ? '已派发' : isSplit ? '待派发' : isApproved ? '已立项' : selected.status
  const isDraft = currentStatus === '草稿'
  const showApprovalChain = !isDraft && (selected.approvals?.length ?? 0) > 0
  const showActionCard = !isDraft && !isDispatched
  const isAssignedPlan = assignedPlans.includes(selected.id)

  const planDisplayStatus = (plan: (typeof planPool)[number]) => (
    dispatchedIds.includes(plan.id)
      ? '已派发'
      : splitIds.includes(plan.id)
        ? '待派发'
        : isPlanApproved(plan)
          ? '已立项'
          : plan.status
  )

  const filteredPlans = plansForView.filter((plan) => {
    const matchSource = sourceFilter === '全部来源' || plan.source === sourceFilter
    const keyword = searchKeyword.trim()
    const matchKeyword = !keyword || `${plan.id}${plan.name}${plan.unit}${plan.owner}${plan.source}`.includes(keyword)
    return matchSource && matchKeyword
  })

  const sortPlans = [...filteredPlans].sort((a, b) => {
    const statusOrder = ['待校审', '草稿', '已立项', '待派发', '已派发']
    const aIndex = statusOrder.indexOf(planDisplayStatus(a))
    const bIndex = statusOrder.indexOf(planDisplayStatus(b))
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
  })

  const toggleExportSelected = (planId: string) => {
    setSelectedExportIds((ids) => ids.includes(planId) ? ids.filter((id) => id !== planId) : [...ids, planId])
  }

  const toggleExportSelectAll = () => {
    setSelectedExportIds((ids) => ids.length === sortPlans.length ? [] : sortPlans.map((plan) => plan.id))
  }

  const startExportMode = () => {
    setSelectedExportIds([])
    setExportMode(true)
  }

  const cancelExportMode = () => {
    setSelectedExportIds([])
    setExportMode(false)
  }

  const confirmExport = () => {
    if (selectedExportIds.length === 0) return
    exportPlanList()
    setSelectedExportIds([])
    setExportMode(false)
  }

  const splitTasks = () => {
    if (splitting) return
    setSplitting(true)
    setSplitIndex(0)
    splitSteps.forEach((_, index) => {
      window.setTimeout(() => setSplitIndex(index), 520 * (index + 1))
    })
    window.setTimeout(() => {
      setSplitting(false)
      setSplitIds((ids) => Array.from(new Set([...ids, selected.id])))
      setAssignedIds((ids) => ids.filter((id) => id !== selected.id))
    }, 520 * (splitSteps.length + 1))
  }

  const assignPeople = () => {
    setAssignedIds((ids) => Array.from(new Set([...ids, selected.id])))
  }

  const dispatchTasks = () => {
    setDispatchedIds((ids) => Array.from(new Set([...ids, selected.id])))
    setAssignedPlans((ids) => Array.from(new Set([...ids, selected.id])))
  }

  const generateTaskBook = () => {
    setTaskBookIds((ids) => Array.from(new Set([...ids, selected.id])))
  }

  const [dispatchExpanded, setDispatchExpanded] = useState(false)
  const [assignedExpanded, setAssignedExpanded] = useState(true)

  const handleWizardImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
      if (rows.length < 2) throw new Error('文件无有效数据')
      const header = rows[0].map((h) => String(h ?? '').trim())
      const data = rows[1]
      const col = (name: string) => data[header.indexOf(name)] ?? ''
      const patch: Partial<CreatePlanForm> = {}
      if (header.includes('计划名称')) patch.name = String(col('计划名称') ?? '')
      if (header.includes('检查类型')) patch.type = String(col('检查类型') ?? '专项检查')
      if (header.includes('受检单位')) patch.unit = String(col('受检单位') ?? '')
      if (header.includes('企业层级')) patch.unitLevel = String(col('企业层级') ?? '二级企业')
      if (header.includes('负责人')) patch.teamLeader = String(col('负责人') ?? '')
      if (header.includes('计划周期')) {
        const period = String(col('计划周期') ?? '')
        const parts = period.split(/\s*至\s*/)
        if (parts[0]) patch.periodStart = parts[0]
        if (parts[1]) patch.periodEnd = parts[1]
      }
      if (header.includes('检查领域')) {
        const domain = String(col('检查领域') ?? '')
        if (domain) patch.checkDomains = domain.split(/[/,，]/).map((d) => d.trim()).filter(Boolean)
      }
      updateForm(patch)
    } catch {
      // silently fail, user can fill manually
    } finally {
      setImporting(false)
      if (wizardFileInputRef.current) wizardFileInputRef.current.value = ''
    }
  }

  const exportPlanList = () => {
    const exportTargets = sortPlans.filter((plan) => selectedExportIds.includes(plan.id))
    const rows = exportTargets.map((plan) => [
      plan.id,
      plan.name,
      plan.type,
      plan.unit,
      plan.unitLevel || '-',
      plan.owner,
      plan.period,
      plan.checkDomain || '-',
      plan.source,
      planDisplayStatus(plan),
    ])
    const csv = ['计划编号,计划名称,检查类型,受检单位,企业层级,负责人,计划周期,检查领域,来源,状态']
      .concat(rows.map((row) => row.map((cell) => `"${cell}"`).join(',')))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '内控检查计划列表.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPlan = () => {
    if (!selectedPlanId) return
    const plan = allPlans.find((p) => p.id === selectedPlanId)
    if (!plan) return
    const csv = [
      '字段,内容',
      `计划编号,${plan.id}`,
      `计划名称,${plan.name}`,
      `检查类型,${plan.type}`,
      `受检单位,${plan.unit}`,
      `企业层级,${plan.unitLevel || '-'}`,
      `负责人,${plan.owner}`,
      `计划周期,${plan.period}`,
      `检查领域,${plan.checkDomain || '-'}`,
      `来源,${plan.source}`,
    ].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${plan.id}-${plan.name}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const navigateToDetail = (planId: string) => {
    setSelectedPlanId(planId)
    setViewMode('detail')
  }

  const backToList = () => {
    if (viewMode === 'create' && formDirty) {
      if (!window.confirm('计划尚未提交，确认放弃创建？')) return
    }
    resetWizard()
    setViewMode('list')
  }

  if (viewMode === 'list') {
    return (
      <PageFrame
        title="计划与派发"
        subtitle="计划列表展示不同来源与状态；点击计划进入详情，执行校审、任务分解与派单。"
      >
        <Toolbar>
          <Search size={16} color="#607089" />
          <input className="icm-input" placeholder="搜索计划编号、名称、单位、负责人" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} />
          <select className="icm-select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option>全部来源</option>
            <option>年度计划</option>
            <option>风险预警</option>
            <option>审计协同</option>
            <option>上级交办</option>
            <option>巡视移送</option>
            <option>文件导入</option>
          </select>
          <Tag tone="blue">共 {filteredPlans.length} 条</Tag>
          {exportMode ? <Tag tone="green">已选 {selectedExportIds.length} 条</Tag> : null}
          <div className="icm-toolbar-spacer" />
          {exportMode ? (
            <>
              <Button type="default-soft" onClick={cancelExportMode}>取消</Button>
              <Button type="success-soft" icon={<Download size={15} />} disabled={selectedExportIds.length === 0} onClick={confirmExport}>确认导出({selectedExportIds.length})</Button>
            </>
          ) : (
            <Button type="info-soft" icon={<Download size={15} />} onClick={startExportMode}>导出</Button>
          )}
          <Button type="primary" icon={<FilePlus2 size={15} />} onClick={() => { resetWizard(); setViewMode('create') }}>新建计划</Button>
        </Toolbar>

        <Card title="计划列表" note={exportMode ? '勾选需要导出的计划，可全选或选取部分' : '点击任意行进入计划详情与派发操作'}>
          <DataTable
            columns={
              exportMode
                ? [
                    <input
                      type="checkbox"
                      checked={sortPlans.length > 0 && selectedExportIds.length === sortPlans.length}
                      onChange={toggleExportSelectAll}
                      aria-label="全选"
                    />,
                    '计划编号', '计划名称', '检查类型', '受检单位', '企业层级', '负责人', '计划周期', '来源', '状态', '操作',
                  ]
                : ['计划编号', '计划名称', '检查类型', '受检单位', '企业层级', '负责人', '计划周期', '来源', '状态', '操作']
            }
            rows={sortPlans.map((plan) => {
              const displayStatus = planDisplayStatus(plan)
              const baseCells = [
                plan.id,
                plan.name,
                plan.type,
                plan.unit,
                plan.unitLevel || '-',
                plan.owner,
                plan.period,
                plan.source,
                <span className={`icm-plan-status icm-plan-status-${statusTone(displayStatus)}`}><i />{displayStatus}</span>,
                <div className="icm-row-actions">
                  <button type="button" onClick={(e) => { e.stopPropagation(); navigateToDetail(plan.id) }}>查看详情</button>
                </div>,
              ]
              return exportMode
                ? [
                    <input
                      type="checkbox"
                      checked={selectedExportIds.includes(plan.id)}
                      onChange={() => toggleExportSelected(plan.id)}
                      aria-label={`选择 ${plan.name}`}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />,
                    ...baseCells,
                  ]
                : baseCells
            })}
            onRowClick={exportMode ? undefined : (i) => navigateToDetail(sortPlans[i].id)}
          />
        </Card>
      </PageFrame>
    )
  }
  if (viewMode === 'detail') {
    return (
      <PageFrame
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={backToList}>返回列表</Button>
          <span>计划详情</span>
        </span>
      }
      subtitle={`${selected.id} · ${selected.source}`}
      actions={
        <span className={`icm-plan-status icm-plan-status-${statusTone(currentStatus)}`}><i />{currentStatus}</span>
      }
    >
      <Card
        title="计划详情"
        note={`${selected.id} · 来源：${selected.source}`}
        action={isDraft ? (
          <Button type="default-soft" icon={<FileText size={15} />} onClick={() => startEditPlan(selected)}>编辑</Button>
        ) : null}
      >
        <div className="icm-grid cols-2">
          <DetailLine label="计划名称" value={selected.name} />
          <DetailLine label="检查类型" value={selected.type} />
          <DetailLine label="受检单位" value={selected.unit} />
          <DetailLine label="企业层级" value={selected.unitLevel || '-'} />
          <DetailLine label="检查领域" value={selected.checkDomain || '-'} />
          <DetailLine label="风险主题" value={selected.riskTheme} />
          <DetailLine label="检查依据" value={selected.basis} />
          <DetailLine label="检查目标" value={selected.objective} />
          <DetailLine label="计划周期" value={selected.period} />
          <DetailLine label="计划来源" value={selected.source} />
          <DetailLine label="负责人" value={selected.owner} />
          <DetailLine label="预算工作量" value={selected.budget || '-'} />
          <DetailLine label="当前状态" value={<Tag tone={statusTone(currentStatus)}>{currentStatus}</Tag>} />
          <DetailLine label="回避校验" value={selected.avoidanceCheck === '已通过' ? <Tag tone="green">已通过</Tag> : selected.avoidanceCheck === '校验中' ? <Tag tone="amber">校验中</Tag> : <Tag tone="gray">待校验</Tag>} />
          <DetailLine label="阻塞点" value={selected.blocker} />
          <DetailLine label="下一步" value={isDispatched ? '进入检查执行' : isSplit ? '任务派单 / 生成检查任务书' : isDraft ? '完善并提交校审' : isApproved ? '任务分解' : selected.next} />
          <DetailLine label="资料需求" value={isSplit ? '5 类，已纳入分解结果' : '5 类，待分解生成'} />
        </div>
      </Card>
      {showApprovalChain ? (
        <Card
          title="审批链路"
          note={approvalOpen ? '按审批节点顺序展示当前审批状态' : `${selected.approvals.filter((n) => n.status === '通过').length}/${selected.approvals.length} 节点已通过 · 已折叠`}
          action={
            <div className="icm-actions">
              {!isApproved ? <Tag tone="blue">校审中</Tag> : <Tag tone="green">已全部通过</Tag>}
              <button
                className={`icm-expand-btn ${approvalOpen ? 'active' : ''}`}
                type="button"
                onClick={() => setApprovalOpen((v) => !v)}
                aria-label={approvalOpen ? '折叠审批链路' : '展开审批链路'}
              >
                <ChevronDown size={15} />
              </button>
            </div>
          }
        >
          {approvalOpen ? (
          <div className="icm-review-chain">
            {selected.approvals.map((node: { node: string; owner: string; role: string; status: string; date: string; opinion: string }, index: number) => {
              const isLast = index === selected.approvals.length - 1
              const statusClass = node.status === '通过' ? 'done' : node.status === '待处理' || node.status === '未提交' ? 'pending' : 'active'
              return (
                <div className={`icm-review-node ${statusClass}`} key={node.node}>
                  {!isLast ? <div className="icm-review-node-line" /> : null}
                  <div className="icm-review-node-dot">
                    {node.status === '通过' ? '✓' : node.status === '进行中' ? '…' : String(index + 1)}
                  </div>
                  <div className="icm-review-node-body">
                    <div className="icm-review-node-head">
                      <strong>{node.node}</strong>
                      <Tag tone={node.status === '通过' ? 'green' : node.status === '进行中' ? 'blue' : node.status === '待处理' ? 'amber' : 'gray'}>{node.status}</Tag>
                    </div>
                    <div className="icm-review-node-meta">
                      <span>责任人：{node.owner}（{node.role}）</span>
                      <span>日期：{node.date}</span>
                    </div>
                    {node.opinion ? (
                      <div style={{ marginTop: 6, color: '#607089', fontSize: 12, lineHeight: 1.55 }}>{node.opinion}</div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
          ) : null}
        </Card>
      ) : null}

      {showActionCard && isApproved ? (
        <Card
          title="任务分解"
          note="校审通过后自动生成检查任务及资料清单"
          action={
            <Button type="primary" icon={<Send size={15} />} loading={splitting} onClick={splitTasks}>
              {isSplit ? '重新分解' : '任务分解'}
            </Button>
          }
        >
        {splitting ? (
          <StepList steps={splitSteps.map((step, index) => ({
            title: `${step}${index === splitIndex ? ' · 处理中' : index < splitIndex ? ' · 完成' : ''}`,
            text: index === splitIndex ? '处理中' : index < splitIndex ? '已完成' : '等待处理',
          }))} />
        ) : isSplit ? (
          <>
            <div className="icm-grid cols-2">
              <DetailLine label="检查任务" value="1 项" />
              <DetailLine label="资料采集任务" value="1 项" />
              <DetailLine label="穿行测试任务" value="1 项" />
              <DetailLine label="取证任务" value="1 项" />
              <DetailLine label="计划状态" value={<Tag tone={isDispatched ? 'green' : 'amber'}>{isDispatched ? '已派发' : '待派发'}</Tag>} />
              <DetailLine label="检查任务书" value={<Tag tone={hasTaskBook ? 'green' : 'gray'}>{hasTaskBook ? '已入库' : '待生成'}</Tag>} />
            </div>
            {!isAssigned ? (
              <>
                <SectionTitle>分解结果</SectionTitle>
                <DataTable
                  columns={['任务编号', '任务类型', '任务名称', '负责人', '输出']}
                  rows={tasks.map((task) => [
                    task.id,
                    task.type,
                    task.name,
                    task.owner,
                    task.outputs.join(' / '),
                  ])}
                />
                <div className="icm-actions" style={{ marginTop: 12 }}>
                  <div className="icm-toolbar-spacer" />
                  <Button type="primary" onClick={assignPeople}>人员分配</Button>
                </div>
              </>
            ) : (
              <>
                <SectionTitle>人员分配方案</SectionTitle>
                <DataTable
                  columns={['角色', '人员', '匹配依据', '工作负荷', '回避校验']}
                  rows={[
                    ['检查组长', '张衡', '采购与合同专项经验 6 次', '62%', <Tag tone="green">通过</Tag>],
                    ['合同核验', '李娜', '合同字段比对与取证', '70%', <Tag tone="green">通过</Tag>],
                    ['资金取数', '王锐', '资金流水和审批链核验', '78%', <Tag tone="green">通过</Tag>],
                    ['外部专家', '赵明', '招采合规专家库推荐', '42%', <Tag tone="green">已签保密</Tag>],
                  ]}
                />
                <div className="icm-actions" style={{ marginTop: 12 }}>
                  <Button type="success-soft" onClick={generateTaskBook}>生成检查任务书</Button>
                  <div className="icm-toolbar-spacer" />
                  <Button type="primary" onClick={dispatchTasks}>任务派单</Button>
                </div>
              </>
            )}
          </>
        ) : (
          <DataTable
            columns={['准备项', '状态', '说明']}
            rows={[
              ['计划详情', <Tag tone="green">已填写</Tag>, '检查对象 / 范围 / 依据 / 目标'],
              ['校审状态', <Tag tone="green">全部通过</Tag>, '已立项'],
              ['资料清单', <Tag tone="amber">待分解</Tag>, '待任务分解'],
            ]}
          />
        )}
        </Card>
      ) : null}

      {isDispatched && isAssignedPlan ? (
        <Card
          title="人员分配方案"
          note={assignedExpanded ? '已派发任务的人员分配详情' : '已折叠'}
          action={
            <button className={`icm-expand-btn ${assignedExpanded ? 'active' : ''}`} type="button" onClick={() => setAssignedExpanded((v) => !v)}>
              <ChevronDown size={16} />
            </button>
          }
        >
          {assignedExpanded ? (
            <DataTable
              columns={['角色', '人员', '匹配依据', '工作负荷', '回避校验']}
              rows={[
                ['检查组长', '张衡', '采购与合同专项经验 6 次', '62%', <Tag tone="green">通过</Tag>],
                ['合同核验', '李娜', '合同字段比对与取证', '70%', <Tag tone="green">通过</Tag>],
                ['资金取数', '王锐', '资金流水和审批链核验', '78%', <Tag tone="green">通过</Tag>],
                ['外部专家', '赵明', '招采合规专家库推荐', '42%', <Tag tone="green">已签保密</Tag>],
              ]}
            />
          ) : null}
        </Card>
      ) : null}

      </PageFrame>
    )
  }
  if (viewMode === 'create') {
    const form = wizardForm
    const checkedCount = [form.name.trim(), form.unit.trim(), form.checkDomains.length > 0, form.teamLeader.trim(), form.approver.trim(), form.periodStart && form.periodEnd].filter(Boolean).length
    const chainPreview = [
      { node: '计划草拟', owner: form.teamLeader || '当前用户', role: '检查组', status: '通过', opinion: '手工创建计划。' },
      ...(form.needParty ? [{ node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '待处理' as const, opinion: '重大检查事项须党委前置研究。' }] : []),
      ...(form.needBoard ? [{ node: '董事会审议', owner: '董事会办公室', role: '董事会办', status: '待处理' as const, opinion: '穿透监管测试类须经董事会审议。' }] : []),
      { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '待处理' as const, opinion: '待合规审查。' },
      { node: '内控部门审核', owner: form.approver || '待分配', role: '内控部负责人', status: '待处理' as const, opinion: '需线上确认检查范围和依据。' },
      { node: '分管领导审批', owner: '待分配', role: '分管领导', status: '待处理' as const, opinion: '待线上流转。' },
    ]

    const addKeyFocus = () => {
      const el = keyFocusInputRef.current
      if (!el) return
      const val = el.value.trim()
      if (val) { updateForm({ keyFocusAreas: [...form.keyFocusAreas, val] }); el.value = '' }
    }

      return (
      <PageFrame
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={backToList}>返回列表</Button>
            <span>{editingPlanId ? '编辑检查计划' : '新建检查计划'}</span>
          </span>
        }
        subtitle="依据国资厅监督〔2026〕15号文及101号、29号、2号、46号文要求，编制内控检查计划"
        actions={
          <>
            <Button type="info-soft" icon={<FileText size={15} />} onClick={() => handleSubmitPlan(true)}>保存草稿</Button>
            <Button type="info-soft" icon={<Download size={15} />} onClick={() => handleExportPlan()}>导出</Button>
            <Button type="default-soft" onClick={backToList}>取消</Button>
          </>
        }
      >
        <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 12, alignItems: 'start' }}>
          <div className="icm-reveal-panel" key={currentStep} style={{ minWidth: 0 }}>
            {currentStep === 'basic' ? (
              <Card title="基本信息" note="填写检查计划的核心识别信息">
                <div className="icm-subsection-head" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                  <div className="icm-card-title">计划标识</div>
                </div>
                <div className="icm-grid" style={{ gap: 14 }}>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13, gridColumn: '1 / -1' }}>
                    计划名称 <span style={{ color: '#b91c1c' }}>*</span>
                    <input className="icm-input" style={{ width: '100%' }} value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="例：2026年度采购围标风险专项检查计划" />
                    {validationErrors.name ? <span style={{ color: '#b91c1c', fontSize: 11 }}>{validationErrors.name}</span> : null}
                  </label>
                </div>
                <div className="icm-grid cols-3" style={{ marginTop: 14 }}>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    检查类型 <span style={{ color: '#b91c1c' }}>*</span>
                    <select className="icm-select" style={{ width: '100%' }} value={form.type} onChange={(e) => updateForm({ type: e.target.value, ...(e.target.value !== '穿透监管测试' ? { needBoard: false } : {}) })}>
                      <option>专项检查</option><option>专项抽查</option><option>穿透监管测试</option><option>临时检查</option>
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    计划来源
                    <div><Tag tone="blue">手工创建</Tag></div>
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    风险主题
                    <input className="icm-input" style={{ width: '100%' }} value={form.riskTheme} onChange={(e) => updateForm({ riskTheme: e.target.value })} placeholder="例：采购围标风险、供应商关联交易" />
                  </label>
                </div>
                <div className="icm-grid" style={{ gap: 14, marginTop: 14 }}>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    检查领域 <span style={{ color: '#b91c1c' }}>*</span> <span style={{ color: '#748299', fontSize: 11 }}>（可多选）</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['采购','合同','资金','投资','产权','财务','薪酬','金融','境外','工程项目','研发'].map((d) => {
                        const sel = form.checkDomains.includes(d)
                        return (
                          <button key={d} type="button" onClick={() => updateForm({ checkDomains: sel ? form.checkDomains.filter((x) => x !== d) : [...form.checkDomains, d] })}
                            style={{ padding: '6px 14px', borderRadius: 8, border: sel ? '2px solid #155bd4' : '1px solid #d7e2f0', background: sel ? '#eef5ff' : '#fff', color: sel ? '#155bd4' : '#334155', fontSize: 13, fontWeight: sel ? 800 : 500, cursor: 'pointer', transition: 'all .15s ease' }}>{d}</button>
                        )
                      })}
                    </div>
                    {(validationErrors as Record<string,string>).checkDomains ? <span style={{ color: '#b91c1c', fontSize: 11 }}>{(validationErrors as Record<string,string>).checkDomains}</span> : null}
                  </label>
                </div>
                <div className="icm-grid cols-2" style={{ marginTop: 14 }}>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    被检查单位 <span style={{ color: '#b91c1c' }}>*</span>
                    <input className="icm-input" style={{ width: '100%' }} value={form.unit} onChange={(e) => updateForm({ unit: e.target.value })} placeholder="例：华北装备制造集团西北分公司" />
                    {validationErrors.unit ? <span style={{ color: '#b91c1c', fontSize: 11 }}>{validationErrors.unit}</span> : null}
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    企业层级
                    <select className="icm-select" style={{ width: '100%' }} value={form.unitLevel} onChange={(e) => updateForm({ unitLevel: e.target.value })}>
                      <option>集团直管</option><option>二级企业</option><option>三级企业</option><option>四级以下企业</option>
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    计划周期
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="icm-input" type="date" value={form.periodStart} onChange={(e) => updateForm({ periodStart: e.target.value })} style={{ flex: 1 }} />
                      <span style={{ color: '#748299', fontSize: 12 }}>至</span>
                      <input className="icm-input" type="date" value={form.periodEnd} onChange={(e) => updateForm({ periodEnd: e.target.value })} style={{ flex: 1 }} />
                    </div>
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    预算工作量
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="icm-input" style={{ flex: 1 }} value={form.budgetWorkdays} onChange={(e) => updateForm({ budgetWorkdays: e.target.value })} placeholder="例：32" />
                      <span style={{ color: '#748299', fontSize: 13, whiteSpace: 'nowrap' }}>人/天</span>
                    </div>
                  </label>
                </div>
                <div className="icm-actions" style={{ justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '1px solid #edf2f8' }}>
                  <Button type="primary" onClick={() => { if (validateStep('basic')) setCurrentStep('scope') }}>下一步：检查依据与范围</Button>
                </div>
              </Card>
            ) : null}
            {currentStep === 'scope' ? (
              <Card title="检查依据与范围" note="明确检查的政策依据、目标和范围">
                <div className="icm-subsection-head" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                  <div className="icm-card-title">政策依据与目标</div>
                </div>
                <div className="icm-grid" style={{ gap: 14 }}>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    政策依据
                    <textarea className="icm-input" style={{ width: '100%', height: 110, resize: 'vertical', padding: '8px 10px' }} value={form.policyBasis} onChange={(e) => updateForm({ policyBasis: e.target.value })}
                      placeholder="例：&#10;· 国资厅监督〔2026〕15号文《关于进一步强化中央企业内部审计监督的意见》&#10;· 内控办〔2026〕3号《2026年度内控检查工作安排》&#10;· 集团采购管理办法第18条" />
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    检查目标
                    <textarea className="icm-input" style={{ width: '100%', height: 90, resize: 'vertical', padding: '8px 10px' }} value={form.objective} onChange={(e) => updateForm({ objective: e.target.value })}
                      placeholder="例：核验采购围标风险识别、报价异常检测、供应商关联关系排查的完整性和整改闭环有效性。" />
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    检查范围说明
                    <textarea className="icm-input" style={{ width: '100%', height: 90, resize: 'vertical', padding: '8px 10px' }} value={form.scopeDescription} onChange={(e) => updateForm({ scopeDescription: e.target.value })}
                      placeholder="时间范围：2026年1月—6月&#10;业务范围：工程物资采购、设备采购、服务类采购&#10;组织范围：采购管理部、招标中心、各需求部门&#10;系统范围：ERP采购模块、合同管理系统、资金支付系统" />
                  </label>
                </div>
                <div className="icm-subsection-head">
                  <div className="icm-card-title">检查重点与抽样</div>
                </div>
                <div className="icm-grid cols-2" style={{ gap: 14 }}>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    检查重点
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      {form.keyFocusAreas.map((item, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #c9dcff', borderRadius: 999, background: '#eaf2ff', color: '#155bd4', fontSize: 12, fontWeight: 700 }}>
                          {item}
                          <button type="button" onClick={() => updateForm({ keyFocusAreas: form.keyFocusAreas.filter((_, j) => j !== i) })}
                            style={{ border: 0, background: 'transparent', color: '#94a0b8', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>&times;</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input ref={keyFocusInputRef} className="icm-input" style={{ flex: 1 }} placeholder="输入检查重点后点击添加" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyFocus() } }} />
                      <Button type="info-soft" onClick={addKeyFocus}>添加</Button>
                    </div>
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    抽样规则
                    <select className="icm-select" style={{ width: '100%' }} value={form.samplingRule} onChange={(e) => updateForm({ samplingRule: e.target.value })}>
                      <option>全量检查</option><option>随机抽样</option><option>风险导向抽样</option><option>分层抽样</option>
                    </select>
                    <input className="icm-input" style={{ width: '100%', marginTop: 8 }} value={form.samplingDetail} onChange={(e) => updateForm({ samplingDetail: e.target.value })} placeholder="抽样说明（选填）：例：按合同金额分层，每层抽取前20%" />
                  </label>
                </div>
                <div className="icm-actions" style={{ justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid #edf2f8' }}>
                  <Button type="default-soft" onClick={() => setCurrentStep('basic')}>上一步：基本信息</Button>
                  <Button type="primary" onClick={() => { validateStep('scope'); setCurrentStep('resources') }}>下一步：资源配置与审批</Button>
                </div>
              </Card>
            ) : null}
            {currentStep === 'resources' ? (
              <Card title="资源配置与审批" note="检查组配置、外部专家和审批链设置">
                <div className="icm-subsection-head" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                  <div className="icm-card-title">检查组配置</div>
                </div>
                <div className="icm-grid cols-2" style={{ gap: 14 }}>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    检查组长 <span style={{ color: '#b91c1c' }}>*</span>
                    <input className="icm-input" style={{ width: '100%' }} value={form.teamLeader} onChange={(e) => updateForm({ teamLeader: e.target.value })} placeholder="例：张衡" />
                    {validationErrors.teamLeader ? <span style={{ color: '#b91c1c', fontSize: 11 }}>{validationErrors.teamLeader}</span> : null}
                  </label>
                  <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                    内控审批人 <span style={{ color: '#b91c1c' }}>*</span>
                    <input className="icm-input" style={{ width: '100%' }} value={form.approver} onChange={(e) => updateForm({ approver: e.target.value })} placeholder="例：郑刚" />
                    {validationErrors.approver ? <span style={{ color: '#b91c1c', fontSize: 11 }}>{validationErrors.approver}</span> : null}
                  </label>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#334155', fontSize: 13, fontWeight: 800 }}>检查组成员</span>
                    <Button type="info-soft" onClick={() => updateForm({ teamMembers: [...form.teamMembers, { name: '', role: '检查员' }] })}>添加成员</Button>
                  </div>
                  {form.teamMembers.length === 0 ? (
                    <div className="icm-empty-inline" style={{ fontSize: 12 }}>尚未添加检查组成员，请点击"添加成员"</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {form.teamMembers.map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input className="icm-input" style={{ flex: 1 }} value={m.name}
                            onChange={(e) => { const updated = [...form.teamMembers]; updated[i] = { ...updated[i], name: e.target.value }; updateForm({ teamMembers: updated }) }}
                            placeholder="成员姓名" />
                          <select className="icm-select" value={m.role}
                            onChange={(e) => { const updated = [...form.teamMembers]; updated[i] = { ...updated[i], role: e.target.value }; updateForm({ teamMembers: updated }) }}>
                            <option>检查员</option><option>合同核验</option><option>资金取数</option><option>系统核查</option><option>法务支持</option><option>数据分析</option>
                          </select>
                          <button type="button" onClick={() => updateForm({ teamMembers: form.teamMembers.filter((_, j) => j !== i) })}
                            style={{ border: '1px solid #d7e2f0', borderRadius: 6, background: '#fff', color: '#b91c1c', cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 13 }}>
                    <input type="checkbox" checked={form.needExternalExpert} onChange={(e) => updateForm({ needExternalExpert: e.target.checked })} />
                    需外部专家参与
                  </label>
                  {form.needExternalExpert ? (
                    <input className="icm-input" style={{ width: '100%', marginTop: 8 }} value={form.externalExpert} onChange={(e) => updateForm({ externalExpert: e.target.value })} placeholder="例：招采合规专家 赵明（专家库编号 EXP-2026-042）" />
                  ) : null}
                </div>

                <div className="icm-subsection-head">
                  <div className="icm-card-title">审批链配置（依据国资厅监督〔2026〕15号文）</div>
                </div>
                <div style={{ border: '1px solid #dbe5f1', borderRadius: 8, padding: 14, background: '#fbfdff' }}>
                  <div className="icm-review-chain">
                    {chainPreview.map((step, idx) => {
                      const isLast = idx === chainPreview.length - 1
                      const cls = step.status === '通过' ? 'done' : 'pending'
                      return (
                        <div className={`icm-review-node ${cls}`} key={step.node}>
                          {!isLast ? <div className="icm-review-node-line" /> : null}
                          <div className="icm-review-node-dot">{step.status === '通过' ? '✓' : idx + 1}</div>
                          <div className="icm-review-node-body">
                            <div className="icm-review-node-head">
                              <strong>{step.node}</strong>
                              <Tag tone={step.status === '通过' ? 'green' : 'gray'}>{step.status}</Tag>
                            </div>
                            <div className="icm-review-node-meta">
                              <span>{step.owner}（{step.role}）</span>
                            </div>
                            <div style={{ marginTop: 4, color: '#607089', fontSize: 12 }}>{step.opinion}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 13 }}>
                    <input type="checkbox" checked={form.needParty} onChange={(e) => updateForm({ needParty: e.target.checked })} />
                    党委（党组）前置研究（15号文第12条）
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 13, opacity: form.type === '穿透监管测试' ? 1 : 0.45 }}>
                    <input type="checkbox" checked={form.needBoard} disabled={form.type !== '穿透监管测试'} onChange={(e) => updateForm({ needBoard: e.target.checked })} />
                    董事会审议审批
                    {form.type !== '穿透监管测试' ? <span style={{ color: '#a16207', fontSize: 11 }}>（仅穿透监管测试可用）</span> : null}
                  </label>
                </div>
                <div className="icm-actions" style={{ justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid #edf2f8' }}>
                  <Button type="default-soft" onClick={() => setCurrentStep('scope')}>上一步：检查依据与范围</Button>
                  <Button type="primary" onClick={() => { validateStep('resources'); setCurrentStep('preview') }}>下一步：预览与提交</Button>
                </div>
              </Card>
            ) : null}
            {currentStep === 'preview' ? submitted ? (
              <div className="icm-reveal-panel" key="success">
                <Card title={lastSavedAsDraft ? '草稿已保存' : '创建成功'}>
                  <div style={{ textAlign: 'center', padding: 52 }}>
                    <CheckCircle2 size={56} color="#15803d" style={{ margin: '0 auto 18px', display: 'block' }} />
                    <h2 style={{ color: '#0b1f43', fontSize: 22, margin: '0 0 10px' }}>{lastSavedAsDraft ? '草稿已保存' : '计划已提交'}</h2>
                    <p style={{ color: '#607089', fontSize: 14, margin: 0 }}>
                      {lastSavedAsDraft ? '计划已保存为"草稿"，可在列表中随时编辑或提交校审' : '计划已提交校审，状态为"待校审"'}<br />
                      <span style={{ fontSize: 12, marginTop: 4, display: 'block' }}>即将返回{editingPlanId ? '计划详情' : '计划列表'}...</span>
                    </p>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="icm-reveal-panel" key="preview">
                <Card title="校验清单" note={`${checkedCount}/6 项必填项已完成`}>
                  <DataTable
                    columns={['检查项', '状态', '内容']}
                    rows={[
                      ['计划名称', form.name.trim() ? <Tag tone="green">已填写</Tag> : <Tag tone="red">未填写</Tag>, form.name.trim() || '-'],
                      ['被检查单位', form.unit.trim() ? <Tag tone="green">已填写</Tag> : <Tag tone="red">未填写</Tag>, form.unit.trim() || '-'],
                      ['检查领域', form.checkDomains.length ? <Tag tone="green">已选择 {form.checkDomains.length} 项</Tag> : <Tag tone="red">未选择</Tag>, form.checkDomains.join(' / ') || '-'],
                      ['检查组长', form.teamLeader.trim() ? <Tag tone="green">已填写</Tag> : <Tag tone="red">未填写</Tag>, form.teamLeader.trim() || '-'],
                      ['内控审批人', form.approver.trim() ? <Tag tone="green">已填写</Tag> : <Tag tone="red">未填写</Tag>, form.approver.trim() || '-'],
                      ['计划周期', form.periodStart && form.periodEnd ? <Tag tone="green">已设置</Tag> : <Tag tone="amber">待完善</Tag>, form.periodStart && form.periodEnd ? `${form.periodStart} 至 ${form.periodEnd}` : '待确定'],
                    ]}
                  />
                </Card>

                <Card title="计划预览" note="提交前请仔细核对以下信息">
                  <div className="icm-editor icm-editor-compact">
                    <h2>{form.name || '（未填写计划名称）'}</h2>
                    <h3>一、基本信息</h3>
                    <div className="icm-grid cols-3">
                      <DetailLine label="检查类型" value={form.type} />
                      <DetailLine label="检查领域" value={form.checkDomains.join(' / ') || '-'} />
                      <DetailLine label="风险主题" value={form.riskTheme || '-'} />
                      <DetailLine label="被检查单位" value={form.unit || '-'} />
                      <DetailLine label="企业层级" value={form.unitLevel} />
                      <DetailLine label="计划周期" value={form.periodStart && form.periodEnd ? `${form.periodStart} 至 ${form.periodEnd}` : '待确定'} />
                      <DetailLine label="计划来源" value={<Tag tone="blue">手工创建</Tag>} />
                      <DetailLine label="预算工作量" value={form.budgetWorkdays ? `${form.budgetWorkdays} 人天` : '待评估'} />
                    </div>
                    <h3>二、检查依据与范围</h3>
                    <p><strong>政策依据：</strong>{form.policyBasis || '待补充'}</p>
                    <p><strong>检查目标：</strong>{form.objective || '待填写'}</p>
                    <p><strong>范围说明：</strong>{form.scopeDescription || '待填写'}</p>
                    <p><strong>检查重点：</strong>{form.keyFocusAreas.length ? form.keyFocusAreas.join('、') : '待填写'}</p>
                    <p><strong>抽样规则：</strong>{form.samplingRule}{form.samplingDetail ? `（${form.samplingDetail}）` : ''}</p>
                    <h3>三、资源配置与审批链</h3>
                    <p><strong>检查组长：</strong>{form.teamLeader || '待填写'}</p>
                    <p><strong>检查组成员：</strong>{form.teamMembers.length ? form.teamMembers.map((m) => `${m.name}（${m.role}）`).join('、') : '待配置'}</p>
                    <p><strong>外部专家：</strong>{form.needExternalExpert ? (form.externalExpert || '待指定') : '不需要'}</p>
                    <p><strong>内控审批人：</strong>{form.approver || '待指定'}</p>
                    <p><strong>审批链：</strong>计划草拟 → {form.needParty ? '党委前置研究 → ' : ''}{form.needBoard ? '董事会审议 → ' : ''}合规审查 → 内控部门审核 → 分管领导审批</p>
                    <h3>四、提交说明</h3>
                    <p>提交后计划状态为<strong>"待校审"</strong>，需经审批链各节点依次处理后立项生效。检查人员连续三年不得检查同一单位同一领域（回避规则T1）。</p>
                  </div>
                </Card>

                <div className="icm-actions" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                  <Button type="default-soft" onClick={() => setCurrentStep('resources')}>上一步：资源配置与审批</Button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="info-soft" onClick={() => handleSubmitPlan(true)}>保存草稿</Button>
                    <Button type="success-soft" icon={<Send size={15} />} onClick={() => handleSubmitPlan(false)}
                      disabled={!form.name.trim() || !form.unit.trim() || form.checkDomains.length === 0 || !form.teamLeader.trim() || !form.approver.trim()}>
                      提交校审
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <Card title="计划概览" note="实时预览当前填写情况">
              <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, color: '#0b1f43', fontSize: 14, marginBottom: 4, wordBreak: 'break-all' }}>
                    {form.name || '（未命名计划）'}
                  </div>
                  <div style={{ color: '#607089', fontSize: 11 }}>
                    <Tag tone="blue">{form.type}</Tag>
                    <span style={{ marginLeft: 6, color: '#748299' }}>手工创建</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
                  {stepOrder.map((s, i) => {
                    const isDone = stepOrder.indexOf(currentStep) > i
                    const isCurrent = s === currentStep
                    return (
                      <button key={s} type="button" onClick={() => { if (!isDone && stepOrder.indexOf(s) !== stepOrder.indexOf(currentStep) + 1 && stepOrder.indexOf(currentStep) < i) return; if (stepOrder.indexOf(s) <= stepOrder.indexOf(currentStep)) { setCurrentStep(s); setValidationErrors({}) } }}
                        style={{ width: 28, height: 28, borderRadius: 999, border: 0, cursor: 'pointer',
                          background: isDone ? '#15803d' : isCurrent ? '#155bd4' : '#e7edf6',
                          color: isDone || isCurrent ? '#fff' : '#607089', fontSize: 11, fontWeight: 900, display: 'grid', placeItems: 'center' }}
                      >{isDone ? '✓' : i + 1}</button>
                    )
                  })}
                </div>

                <DetailLine label="检查领域" value={form.checkDomains.length ? form.checkDomains.join('、') : <span style={{ color: '#b91c1c' }}>待选择</span>} />
                <DetailLine label="受检单位" value={form.unit || <span style={{ color: '#94a0b8' }}>待填写</span>} />
                <DetailLine label="企业层级" value={form.unitLevel} />
                <DetailLine label="计划周期" value={form.periodStart && form.periodEnd ? `${form.periodStart} ~ ${form.periodEnd}` : '待确定'} />
                <DetailLine label="检查组长" value={form.teamLeader || <span style={{ color: '#94a0b8' }}>待指定</span>} />
                <DetailLine label="成员人数" value={`${form.teamMembers.length} 人`} />
                <DetailLine label="审批人" value={form.approver || <span style={{ color: '#94a0b8' }}>待指定</span>} />
                <DetailLine label="预算" value={form.budgetWorkdays ? `${form.budgetWorkdays} 人天` : '-'} />
                <DetailLine label="风险主题" value={form.riskTheme || '-'} />
                <DetailLine label="抽样规则" value={form.samplingRule} />
              </div>
            </Card>
          </div>
        </div>
      </PageFrame>
    )
  }
}

export function DataRulesStage() {
  const [selectedPackage, setSelectedPackage] = useState(dataCollect.resultPackages[0]?.id)
  const [tab, setTab] = useState<DataTab>('demand')
  const selected = dataCollect.resultPackages.find((item) => item.id === selectedPackage) ?? dataCollect.resultPackages[0]
  const mappings = [
    ['vendorName', 'supplier_name', '供应商名称'],
    ['contractAmount', 'contract_amount', '合同金额'],
    ['signDate', 'sign_date', '签署日期'],
    ['approvalNode', 'approval_node', '审批节点'],
  ]

  return (
    <PageFrame
      title="数据与规则"
      subtitle="左侧选择数据包，右侧确认需求、质量、字段映射和启用规则。"
      actions={<Button type="primary" icon={<CheckCircle2 size={15} />}>完成数据准备</Button>}
    >
      <WorkflowLayout
        side={
          <>
            <div className="icm-grid cols-2">
              <Kpi value="4" label="数据需求" note="本次检查" tone="blue" />
              <Kpi value="4" label="启用规则" note="围标规则包" tone="green" />
            </div>
            <Card title="数据包">
              <div className="icm-list">
                {dataCollect.resultPackages.map((pack) => (
                  <button
                    className={`icm-list-row ${pack.id === selected.id ? 'active' : ''}`}
                    key={pack.id}
                    onClick={() => setSelectedPackage(pack.id)}
                    type="button"
                  >
                    <div>
                      <div className="icm-list-title">{pack.name}</div>
                      <div className="icm-list-meta">{pack.id}<br />{pack.includes.join(' / ')}</div>
                    </div>
                    <Tag tone={statusTone(pack.status)}>{pack.status}</Tag>
                  </button>
                ))}
              </div>
            </Card>
            <Card title="最低质量项" note="先暴露阻塞点">
              <DetailLine label="附件完整性" value="82 / 待处理" />
              <DetailLine label="处理建议" value="补齐 2 份评分表扫描附件" />
            </Card>
          </>
        }
        main={
          <Card
            title="数据包详情"
            note={selected.id}
            action={
              <Segmented
                value={tab}
                onChange={setTab}
                options={[
                  { label: '数据需求', value: 'demand' },
                  { label: '质量校验', value: 'quality' },
                  { label: '规则准备', value: 'rules' },
                ]}
              />
            }
          >
            {tab === 'demand' ? (
              <DataTable
                columns={['需求项', '责任方', '采集方式', '状态', '期限']}
                rows={dataCollect.demands.map((item) => [item.name, item.owner, item.method, <Tag tone={statusTone(item.status)}>{item.status}</Tag>, item.due])}
              />
            ) : null}
            {tab === 'quality' ? (
              <>
                <DataTable
                  columns={['校验规则', '目标字段', '结果', '分数', '处理建议']}
                  rows={dataCollect.quality.map((item) => [item.rule, item.target, <Tag tone={statusTone(item.result)}>{item.result}</Tag>, `${item.score}`, item.fixHint])}
                />
                <SectionTitle>字段映射样例</SectionTitle>
                <DataTable columns={['源字段', '标准字段', '业务含义']} rows={mappings} />
              </>
            ) : null}
            {tab === 'rules' ? (
              <DataTable columns={['规则编号', '规则名称', '判定条件', '依据', '输出']} rows={rules.map((rule) => [rule.id, rule.name, rule.condition, rule.source, rule.output])} />
            ) : null}
          </Card>
        }
      />
    </PageFrame>
  )
}

export function SmartReviewStage() {
  const [selectedFindingId, setSelectedFindingId] = useState(findings[0]?.id)
  const [tab, setTab] = useState<ReviewTab>('rules')
  const selected = findings.find((finding) => finding.id === selectedFindingId) ?? findings[0]
  const linkedEvidence = evidences.filter((item) => selected.linkedEvidence.includes(item.id))

  return (
    <PageFrame
      title="智能审查"
      subtitle="左侧是审查任务和线索，右侧处理命中依据、穿行验证和人工复核。"
      actions={<Button type="primary" icon={<Play size={15} />}>运行审查任务</Button>}
    >
      <WorkflowLayout
        side={
          <>
            <Card title="审查任务" note="一期保留一个专项任务">
              <DetailLine label="任务" value="采购围标风险审查" />
              <DetailLine label="状态" value={<Tag tone="amber">人工复核中</Tag>} />
              <DetailLine label="命中线索" value={`${findings.length} 条`} />
            </Card>
            <Card title="疑似线索">
              <div className="icm-list">
                {findings.map((finding) => (
                  <button
                    className={`icm-list-row ${finding.id === selected.id ? 'active' : ''}`}
                    key={finding.id}
                    onClick={() => setSelectedFindingId(finding.id)}
                    type="button"
                  >
                    <div>
                      <div className="icm-list-title">{finding.title}</div>
                      <div className="icm-list-meta">{finding.id} · {finding.sample}</div>
                    </div>
                    <Tag tone={statusTone(finding.level)}>{finding.confidence}%</Tag>
                  </button>
                ))}
              </div>
            </Card>
            <Card title="执行单元" note="不再铺开复杂智能体面板">
              <DataTable columns={['单元', '状态']} rows={agents.map((agent) => [agent.domain, <Tag tone={statusTone(agent.status)}>{agent.status}</Tag>])} />
            </Card>
          </>
        }
        main={
          <Card
            title="线索详情"
            note={selected.id}
            action={
              <Segmented
                value={tab}
                onChange={setTab}
                options={[
                  { label: '规则命中', value: 'rules' },
                  { label: '穿行验证', value: 'walkthrough' },
                  { label: '人工复核', value: 'confirm' },
                ]}
              />
            }
          >
            {tab === 'rules' ? (
              <div className="icm-grid cols-2">
                <DetailLine label="疑似问题" value={selected.title} />
                <DetailLine label="风险等级" value={<Tag tone={statusTone(selected.level)}>{selected.level}</Tag>} />
                <DetailLine label="置信度" value={`${selected.confidence}%`} />
                <DetailLine label="命中规则" value={selected.ruleId} />
                <DetailLine label="命中样本" value={selected.sample} />
                <DetailLine label="当前状态" value={<Tag tone={statusTone(selected.status)}>{selected.status}</Tag>} />
              </div>
            ) : null}
            {tab === 'walkthrough' ? (
              <DataTable
                columns={['流程节点', '控制点', '测试结果', '证据', '生成对象']}
                rows={walkthrough.map((node) => [node.node, node.control, <Tag tone={statusTone(node.result)}>{node.result}</Tag>, node.evidence, node.generated.join(' / ') || '-'])}
              />
            ) : null}
            {tab === 'confirm' ? (
              <>
                <DetailLine label="复核人" value={selected.reviewer} />
                <DetailLine label="审查单元" value={selected.agent} />
                <SectionTitle>证据支撑</SectionTitle>
                <DataTable
                  columns={['证据编号', '证据名称', '类型', '状态']}
                  rows={linkedEvidence.map((item) => [item.id, item.title, item.type, <Tag tone={statusTone(item.status)}>{item.status}</Tag>])}
                />
                <div className="icm-actions" style={{ marginTop: 12 }}>
                  <Button type="success-soft">确认并转底稿</Button>
                  <Button type="warn-soft">退回补证</Button>
                </div>
              </>
            ) : null}
          </Card>
        }
      />
    </PageFrame>
  )
}

export function WorkpaperIssueStage() {
  const [selectedWorkpaperId, setSelectedWorkpaperId] = useState(workpapers[0]?.id)
  const [showEvidenceSheet, setShowEvidenceSheet] = useState(false)
  const selectedPaper = workpapers.find((item) => item.id === selectedWorkpaperId) ?? workpapers[0]
  const linkedEvidence = evidences.filter((item) => selectedPaper.evidenceIds.includes(item.id))
  const selectedFinding = findings.find((item) => item.linkedEvidence.some((id) => selectedPaper.evidenceIds.includes(id))) ?? findings[0]
  const selectedIssue = issues.find((issue) => issue.workpaperId === selectedPaper.id)
  const relatedRectification = rectifications.find((item) => item.id === selectedIssue?.rectificationId)
  const evidenceRequestNo = `EVS-${selectedPaper.id.replace('WP-', '2026-')}`
  const canGenerateIssue = selectedPaper.result === '阳性' && selectedPaper.status === '审定通过'
  const evidenceComplete = linkedEvidence.length > 0 && linkedEvidence.every((item) => item.status === '已归档')
  const sourceLabel = selectedFinding ? `智能审查结果 ${selectedFinding.id}` : '人工检查录入'
  const processMode = selectedPaper.status === '待补证'
    ? '补充取证后再提交复核'
    : selectedPaper.status === '复核中'
      ? '等待二/三级复核结论'
      : selectedPaper.result === '阴性'
        ? '终审通过后直接归档'
        : '终审通过后生成问题'

  return (
    <PageFrame
      title="底稿与问题"
      subtitle="以检查底稿为主对象管理取证、复核和问题生成；审查结果只作为辅助来源，不直接进入整改或报告。"
      actions={<Button type="primary" icon={<ClipboardList size={15} />} onClick={() => selectedPaper && setShowEvidenceSheet(true)}>查看内嵌取证单</Button>}
    >
      <WorkflowLayout
        side={
          <Card title="底稿列表">
            <div className="icm-list">
              {workpapers.map((paper) => (
                <button
                  className={`icm-list-row ${paper.id === selectedWorkpaperId ? 'active' : ''}`}
                  key={paper.id}
                  onClick={() => setSelectedWorkpaperId(paper.id)}
                  type="button"
                >
                  <div>
                    <div className="icm-list-title">{paper.title}</div>
                    <div className="icm-list-meta">
                      {paper.id} · 来源：{paper.evidenceIds.length ? '审查结果生成' : '人工抽样检查'}<br />
                      处理：{paper.status === '审定通过' ? paper.result === '阴性' ? '归档' : '生成问题' : paper.status}
                    </div>
                  </div>
                  <Tag tone={statusTone(paper.result)}>{paper.result}</Tag>
                </button>
              ))}
            </div>
          </Card>
        }
        main={
          <div className="icm-workflow-main">
            {!selectedPaper ? (
              <Card title="请选择底稿">
                <div className="icm-empty-inline">
                  请选择左侧底稿
                </div>
              </Card>
            ) : (
              <div className="icm-reveal-panel" key={selectedPaper.id}>
                <Card
                  title="底稿处理区"
                  note={`${selectedPaper.id} · ${sourceLabel}`}
                  action={<Button type="info-soft" size="sm" icon={<ClipboardList size={15} />} onClick={() => setShowEvidenceSheet(true)}>查看取证单</Button>}
                >
                  <div className="icm-grid cols-3">
                    <DetailLine label="底稿来源" value={sourceLabel} />
                    <DetailLine label="处理方式" value={processMode} />
                    <DetailLine label="当前状态" value={<Tag tone={statusTone(selectedPaper.status)}>{selectedPaper.status}</Tag>} />
                  </div>
                  <SectionTitle>底稿正文</SectionTitle>
                  <div className="icm-editor">
                    <h2>{selectedPaper.title}</h2>
                    <h3>一、检查程序</h3>
                    <p>依据检查标准库规则、任务资料清单和人工复核要求，对相关业务样本执行数据核验、附件调阅、审批链检查和必要访谈。</p>
                    <h3>二、取证事实</h3>
                    <p>{linkedEvidence.length ? linkedEvidence.map((item) => `${item.title}（${item.type}，${item.status}）`).join('；') : '当前底稿已形成阴性检查记录，未发现需补充的异常证据。'}</p>
                    <h3>三、复核结论</h3>
                    <p>{selectedPaper.conclusion}</p>
                  </div>
                  <SectionTitle>内嵌取证单</SectionTitle>
                  <DataTable
                    columns={['取证单号', '检查程序', '单位确认', '附件状态', '提交复核条件']}
                    rows={[[
                      evidenceRequestNo,
                      '数据核验 / 附件调阅 / 事实确认',
                      selectedPaper.result === '阳性' ? '需确认签字' : '归档留痕',
                      linkedEvidence.map((item) => item.id).join(' / ') || '阴性记录说明',
                      evidenceComplete || selectedPaper.result === '阴性' ? <Tag tone="green">满足</Tag> : <Tag tone="amber">待补证</Tag>,
                    ]]}
                  />
                </Card>

                {(selectedIssue || canGenerateIssue || selectedPaper.result === '阴性') ? (
                  <Card
                    title={selectedIssue ? '问题闭环' : selectedPaper.result === '阴性' ? '归档结果' : '生成问题'}
                    action={canGenerateIssue && !selectedIssue ? <Button type="primary">生成问题</Button> : null}
                  >
                    {selectedIssue ? (
                      <div className="icm-grid cols-2">
                        <DetailLine label="问题编号" value={selectedIssue.id} />
                        <DetailLine label="问题等级" value={<Tag tone={statusTone(selectedIssue.level)}>{selectedIssue.level}</Tag>} />
                        <DetailLine label="问题描述" value={selectedIssue.title} />
                        <DetailLine label="整改工单" value={relatedRectification ? `${relatedRectification.id} · ${relatedRectification.lane}` : '待派发'} />
                      </div>
                    ) : (
                      <div className="icm-empty-inline">
                        {selectedPaper.result === '阴性' ? '该底稿终审后直接归档，不生成问题。' : '该阳性底稿已终审通过，可从这里生成问题并进入整改。'}
                      </div>
                    )}
                    <SectionTitle>辅助追溯链路</SectionTitle>
                    <DataTable
                      columns={['环节', '对象', '当前状态', '关系']}
                      rows={[
                        ['审查结果', selectedFinding.id, <Tag tone={statusTone(selectedFinding.status)}>{selectedFinding.status}</Tag>, '只作为底稿来源'],
                        ['检查底稿', selectedPaper.id, <Tag tone={statusTone(selectedPaper.status)}>{selectedPaper.status}</Tag>, '主处理对象'],
                        ['取证单', evidenceRequestNo, <Tag tone={evidenceComplete ? 'green' : 'amber'}>{evidenceComplete ? '已归档' : '待完善'}</Tag>, '内嵌在底稿中'],
                        ['问题', selectedIssue?.id ?? '-', <Tag tone={selectedIssue ? statusTone(selectedIssue.status) : 'gray'}>{selectedIssue?.status ?? '未生成'}</Tag>, '由终审阳性底稿生成'],
                      ]}
                    />
                  </Card>
                ) : null}
              </div>
            )}
          </div>
        }
      />
      {showEvidenceSheet && selectedPaper ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal">
            <div className="icm-modal-head">
              <div>
                <div className="icm-modal-title">底稿内嵌取证单</div>
                <div className="icm-modal-sub">{evidenceRequestNo} · 绑定底稿 {selectedPaper.id}</div>
              </div>
              <button className="icm-modal-close" type="button" onClick={() => setShowEvidenceSheet(false)} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="icm-grid cols-2">
              <DetailLine label="取证事项" value={selectedPaper.title} />
              <DetailLine label="取证责任人" value={linkedEvidence.map((item) => item.owner).join(' / ') || selectedPaper.reviewer} />
              <DetailLine label="证据来源" value={linkedEvidence.map((item) => item.sourceSystem).join(' / ') || '待确认'} />
              <DetailLine label="归档状态" value={<Tag tone={evidenceComplete ? 'green' : 'amber'}>{evidenceComplete ? '全部归档' : '存在待复核'}</Tag>} />
              <DetailLine label="关联底稿" value={selectedPaper.id} />
              <DetailLine label="关联问题" value={selectedIssue?.id ?? '待生成'} />
            </div>
            <SectionTitle>关联证据</SectionTitle>
            <DataTable
              columns={['证据编号', '证据名称', '类型', '来源系统', '链路哈希', '关联底稿', '状态']}
              rows={(linkedEvidence.length ? linkedEvidence : [{
                id: '阴性说明',
                title: '抽样检查未发现异常，取证单记录检查过程和结论',
                type: '检查记录',
                sourceSystem: '检查人员录入',
                chainHash: '归档后生成',
                link: selectedPaper.id,
                status: '待归档',
              }]).map((item) => [item.id, item.title, item.type, item.sourceSystem, item.chainHash, item.link, <Tag tone={statusTone(item.status)}>{item.status}</Tag>])}
            />
            <div className="icm-actions" style={{ marginTop: 12 }}>
              <Button type="primary">归档取证单</Button>
              <Button type="warn-soft">退回补证</Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  )
}

export function RectifyReportStage() {
  const [selectedRectifyId, setSelectedRectifyId] = useState<string>()
  const [localRects, setLocalRects] = useState(rectifications)
  const [modal, setModal] = useState<ReportModal>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [listSearch, setListSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [flow, setFlow] = useState<ReportFlow>('editing')
  const [auditStep, setAuditStep] = useState(-1)
  const [ledgerModal, setLedgerModal] = useState(false)
  const [auditModal, setAuditModal] = useState(false)
  const [auditRunning, setAuditRunning] = useState(false)
  const [auditDone, setAuditDone] = useState(false)
  const [draftSummary, setDraftSummary] = useState('')
  const [draftFact, setDraftFact] = useState('')
  const [draftReferences, setDraftReferences] = useState('')
  const [draftReviewBasis, setDraftReviewBasis] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)

  const selected = localRects.find((item) => item.id === selectedRectifyId)

  // 整改中只查看整改信息；已整改后进入报告编制。
  const showWorkbench = selected && selected.lane === '整改中'
  const showReport = selected && selected.lane === '已整改'

  const filteredRectifications = useMemo(() => {
    let items = localRects
    if (listSearch.trim()) {
      const kw = listSearch.trim().toLowerCase()
      items = items.filter((r) => r.issue.toLowerCase().includes(kw) || r.id.toLowerCase().includes(kw) || r.owner.toLowerCase().includes(kw))
    }
    if (statusFilter !== '全部') {
      items = items.filter((r) => r.lane === statusFilter)
    }
    return items
  }, [localRects, listSearch, statusFilter])

  const updateRect = (id: string, patch: Partial<Rectification>) => {
    setLocalRects((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const enterDetail = (id: string) => {
    setSelectedRectifyId(id)
    setSelectedSourceIds([])
    setSelectedTemplate('')
    setFlow('editing')
    setAuditStep(-1)
    setListSearch('')
    setDraftSummary('')
    setDraftFact('')
    setDraftReferences('')
    setDraftReviewBasis('')
    setDraftSaved(false)
  }

  const backToList = () => {
    setSelectedRectifyId(undefined)
  }

  // ──── Report flow (only for 已整改) ────
  const srcIssue = useMemo(() => issues.find((issue) => issue.rectificationId === selected?.id), [selected])
  const srcWorkpaper = useMemo(() => workpapers.find((paper) => paper.id === srcIssue?.workpaperId), [srcIssue])
  const srcEvidence = useMemo(() => evidences.filter((item) => srcIssue?.evidenceIds?.includes(item.id)), [srcIssue])

  const srcItems = useMemo(() => {
    if (!selected || !srcIssue) return []
    const chainIds = new Set<string>()
    chainIds.add(selected.id); chainIds.add(srcIssue.id)
    if (srcWorkpaper) chainIds.add(srcWorkpaper.id)
    srcEvidence.forEach((e) => chainIds.add(e.id))
    return [
      ...workpapers.filter((w) => chainIds.has(w.id)).map((w) => ({ id: w.id, type: '底稿', title: w.title, owner: w.reviewer, status: w.status })),
      ...issues.filter((i) => chainIds.has(i.id)).map((i) => ({ id: i.id, type: '问题', title: i.title, owner: i.owner, status: i.status })),
      ...evidences.filter((e) => chainIds.has(e.id)).map((e) => ({ id: e.id, type: '取证', title: e.title, owner: e.owner, status: e.status })),
      { id: selected.id, type: '整改', title: selected.issue, owner: selected.owner, status: selected.lane },
      ...rules.filter((r) => r.domain === (srcIssue?.level === '重大' ? '采购' : '合同')).slice(0, 2).map((r) => ({ id: r.id, type: '规则', title: r.name, owner: r.domain, status: '已同步' })),
    ]
  }, [selected, srcIssue, srcWorkpaper, srcEvidence])

  const selectedSrcItems = useMemo(() => srcItems.filter((item) => selectedSourceIds.includes(item.id)), [srcItems, selectedSourceIds])
  const groupedSources = ['问题', '底稿', '取证', '整改', '规则'].map((type) => ({ type, items: srcItems.filter((item) => item.type === type) }))
  const canDraft = Boolean(selectedTemplate && selectedSourceIds.length)
  const draftReady = flow !== 'editing'
  const ledgerReady = flow === 'ledger' || flow === 'reviewing' || flow === 'approved' || flow === 'archived'
  const reviewNodes2 = ['编制确认', '组长复核', '内控审核', '报送确认']
  const flowTag = flow === 'editing' ? '待撰写' : flow === 'drafted' ? '已成稿' : flow === 'ledger' ? '待审核' : flow === 'reviewing' ? '审核中' : flow === 'approved' ? '待入库' : '已入库'

  const toggleSource = (id: string) => { setSelectedSourceIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]); setFlow('editing'); setAuditStep(-1); setDraftSaved(false) }
  const generateDraft = () => {
    if (!canDraft || !selected) return
    setDraftSummary(`本报告围绕"${selected.issue}"形成，责任部门为${selected.owner}，当前整改状态为${selected.lane}。`)
    setDraftFact(srcIssue ? `${srcIssue.title}，问题等级为${srcIssue.level}，整改期限为${srcIssue.deadline}。` : '当前整改事项未关联问题记录。')
    setDraftReferences(selectedSrcItems.map((item) => `${item.type}-${item.id}`).join('、') || '待补充报告素材。')
    setDraftReviewBasis('报告按整改事项逐项确认事实、佐证、责任部门、复核意见和报送状态。')
    setDraftSaved(false)
    setFlow('drafted')
    setAuditStep(-1)
  }
  const saveDraft = () => {
    if (!draftReady) return
    setDraftSaved(true)
  }
  const generateLedger = () => { if (!draftReady) return; setLedgerModal(true) }
  const confirmLedger = () => { setLedgerModal(false); setFlow('ledger'); setAuditStep(-1) }
  const submitAudit = () => { if (flow !== 'ledger') return; setAuditModal(true); setAuditRunning(false); setAuditDone(false); setAuditStep(-1) }
  const startAuditFlow = () => {
    setAuditRunning(true); setAuditStep(0)
    reviewNodes2.forEach((_, i) => { window.setTimeout(() => setAuditStep(i), 520 * (i + 1)) })
    window.setTimeout(() => { setAuditStep(reviewNodes2.length - 1); setAuditDone(true); setAuditRunning(false) }, 520 * (reviewNodes2.length + 1))
  }
  const confirmArchive = () => { setAuditModal(false); setFlow('approved') }
  const archiveReport = () => {
    if (flow !== 'approved' || !selected) return
    setFlow('archived')
    updateRect(selected.id, { lane: '已整改', verify: '成立', writeBack: '报告已归档，整改记录保持已整改。' })
  }
  // KPI from rectifications
  const closedCount = localRects.filter((r) => r.lane === '已整改').length
  const overdueCount = localRects.filter((r) => r.lane === '整改中').length
  const proofTotal = localRects.reduce((total, r) => total + r.proof, 0)
  const proofPassed = localRects.filter((r) => r.verify === '成立').length
  const rectificationMetrics = [
    { label: '整改完成率', value: `${Math.round((closedCount / Math.max(localRects.length, 1)) * 100)}%`, note: `${closedCount}/${localRects.length} 已整改`, tone: 'green' as Tone },
    { label: '超期整改', value: `${overdueCount}`, note: '按整改期限自动预警', tone: overdueCount ? 'red' as Tone : 'green' as Tone },
    { label: '佐证材料', value: `${proofTotal}`, note: `${proofPassed} 项通过复核`, tone: 'blue' as Tone },
    { label: '回访关注', value: '3/6/12', note: '整改后回访节点', tone: 'amber' as Tone },
  ]

  // ═══════════ LIST VIEW ═══════════
  if (!selected) {
    return (
      <PageFrame title="整改与报告" subtitle="整改中查看执行信息；已整改事项可编制报告、审核报送与入库。">
        <Toolbar>
          <div className="icm-modal-search" style={{ flex: 1, maxWidth: 360 }}>
            <Search size={15} />
            <input placeholder="检索整改事项、编号、责任部门…" value={listSearch} onChange={(e) => setListSearch(e.target.value)} />
          </div>
          <span className="icm-toolbar-spacer" />
          <span style={{ color: '#64748b', fontSize: 12 }}>共 {filteredRectifications.length} 条</span>
          <select className="icm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option>全部</option><option>整改中</option><option>已整改</option>
          </select>
        </Toolbar>
        <Card title="整改任务列表" note="整改中只查看执行信息 · 已整改后编制报告">
          <div className="icm-grid cols-4" style={{ marginBottom: 14 }}>
            {rectificationMetrics.map((item) => <Kpi key={item.label} value={item.value} label={item.label} note={item.note} tone={item.tone} />)}
          </div>
          <DataTable
            columns={['编号', '整改事项', '责任部门', '状态', '佐证', '操作']}
            rows={filteredRectifications.map((r) => [
              r.id, r.issue, r.owner,
              <Tag tone={statusTone(r.lane)}>{r.lane}</Tag>,
              `${r.proof} 份`,
              r.lane === '已整改'
                ? <button type="button" className="icm-link" onClick={(e) => { e.stopPropagation(); enterDetail(r.id) }}>编制报告</button>
                : <button type="button" className="icm-link" onClick={(e) => { e.stopPropagation(); enterDetail(r.id) }}>查看整改</button>,
            ])}
            onRowClick={(i) => enterDetail(filteredRectifications[i].id)}
          />
        </Card>
      </PageFrame>
    )
  }

  // ═══════════ RECTIFICATION WORKBENCH (整改中) ═══════════
  if (showWorkbench) {
    return (
      <PageFrame
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={backToList}>返回列表</Button>整改事项</span>}
        subtitle={`${selected.id} · ${selected.issue}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Info Card */}
          <Card title="整改事项信息" note={selected.id} action={<Tag tone={statusTone(selected.lane)}>{selected.lane}</Tag>}>
            <div className="icm-grid cols-3" style={{ gap: 6 }}>
              <DetailLine label="整改事项" value={selected.issue} />
              <DetailLine label="责任部门" value={selected.owner} />
              <DetailLine label="整改状态" value={<Tag tone={statusTone(selected.lane)}>{selected.lane}</Tag>} />
              <DetailLine label="问题编号" value={srcIssue?.id ?? '待关联'} />
              <DetailLine label="问题等级" value={srcIssue ? <Tag tone={statusTone(srcIssue.level)}>{srcIssue.level}</Tag> : '待关联'} />
              <DetailLine label="整改期限" value={srcIssue?.deadline ?? '-'} />
            </div>
            <div className="icm-subsection-head"><div className="icm-card-title">整改进度</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, height: 10, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: '60%', borderRadius: 999, background: '#155bd4' }} />
              </span>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#155bd4' }}>60%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#94a3b8' }}>
              <span>整改中</span><span>已整改</span>
            </div>
          </Card>

          {/* Source chain */}
          <Card title="来源追溯" note="关联的问题、底稿和取证记录">
            {srcIssue ? (
              <div className="icm-grid cols-2" style={{ gap: 6 }}>
                <DetailLine label="关联问题" value={`${srcIssue.id} · ${srcIssue.title}`} />
                <DetailLine label="问题等级" value={<Tag tone={statusTone(srcIssue.level)}>{srcIssue.level}</Tag>} />
                <DetailLine label="来源底稿" value={srcWorkpaper ? `${srcWorkpaper.id} · ${srcWorkpaper.title}` : '待关联'} />
                <DetailLine label="取证附件" value={srcEvidence.map((e) => e.id).join(' / ') || '待关联'} />
              </div>
            ) : <div className="icm-empty-inline">未关联问题记录</div>}
          </Card>

          {/* Proof / Evidence card */}
          <Card title="佐证材料" note={`已提交 ${selected.proof} 份 · 复核意见：${selected.verify}`}>
            {selected.proof > 0 ? (
              <DataTable
                columns={['序号', '佐证说明', '提交时间', '状态']}
                rows={Array.from({ length: selected.proof }, (_, i) => [
                  `${i + 1}`,
                  i === 0 ? '整改措施执行记录及审批文件' : i === 1 ? '相关凭证/合同/付款记录' : '补充说明材料',
                  `2026-07-0${i + 3}`,
                  <Tag tone={selected.verify === '成立' ? 'green' : 'amber'}>{i < selected.proof ? '已提交' : '待提交'}</Tag>,
                ])}
              />
            ) : <div className="icm-empty-inline">暂无佐证材料，责任部门整改中。</div>}
          </Card>

        </div>
      </PageFrame>
    )
  }

  // ═══════════ REPORT FLOW (已整改) ═══════════
  if (!showReport) {
    return (
      <PageFrame title="返回" subtitle=""><Button onClick={backToList}>返回列表</Button></PageFrame>
    )
  }

  return (
    <PageFrame
      title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={backToList}>返回列表</Button>报告详情</span>}
      subtitle={`${selected.id} · ${selected.issue}`}
    >
      <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1fr)', alignItems: 'start', gap: 8 }}>
        <div className="icm-workflow-main icm-report-board">
          <Card title="当前报告" note={selected.id} action={<Tag tone={flow === 'archived' ? 'green' : flow === 'reviewing' ? 'blue' : 'amber'}>{flowTag}</Tag>}>
            <div className="icm-report-current" style={{ padding: 0 }}>
              <div className="icm-grid cols-3" style={{ gap: 6, marginTop: 0 }}>
                <DetailLine label="整改事项" value={selected.issue} />
                <DetailLine label="责任部门" value={selected.owner} />
                <DetailLine label="整改状态" value={<Tag tone={statusTone(selected.lane)}>{selected.lane}</Tag>} />
                <DetailLine label="问题编号" value={srcIssue?.id ?? '待关联'} />
                <DetailLine label="问题等级" value={srcIssue ? <Tag tone={statusTone(srcIssue.level)}>{srcIssue.level}</Tag> : '待关联'} />
                <DetailLine label="整改进度" value={srcIssue ? `${srcIssue.progress}%` : '-'} />
              </div>

              <SectionTitle>关联问题信息</SectionTitle>
              {srcIssue ? (
                <div className="icm-grid cols-2" style={{ gap: 6 }}>
                  <DetailLine label="问题名称" value={srcIssue.title} />
                  <DetailLine label="整改期限" value={srcIssue.deadline} />
                  <DetailLine label="来源底稿" value={srcWorkpaper?.id ?? '待关联'} />
                  <DetailLine label="取证附件" value={srcEvidence.map((item) => item.id).join(' / ') || '待关联'} />
                </div>
              ) : (
                <div className="icm-empty-inline">当前整改事项未关联问题</div>
              )}

              {!draftReady ? (
                <>
                  <SectionTitle>报告配置</SectionTitle>
                  <div className="icm-grid cols-3" style={{ gap: 6 }}>
                    <DetailLine label="报告模板" value={selectedTemplate || '待选择'} />
                    <DetailLine label="已选素材" value={`${selectedSrcItems.length} 项`} />
                    <DetailLine label="报送台账" value={<Tag tone="gray">待生成</Tag>} />
                  </div>
                  {selectedSrcItems.length ? (
                    <DataTable
                      columns={['素材类型', '编号', '标题', '来源/责任', '状态']}
                      rows={selectedSrcItems.map((item) => [item.type, item.id, item.title, item.owner, <Tag tone={statusTone(item.status)}>{item.status}</Tag>])}
                    />
                  ) : (
                    <div className="icm-empty-inline">尚未选择报告素材。确认素材后会在这里展示引用明细。</div>
                  )}
                </>
              ) : null}

              {draftReady ? (
                <div className="icm-report-paper">
                  <h2>{selectedTemplate}</h2>
                  <h3>一、整改概况</h3>
                  <textarea
                    className="icm-input"
                    style={{ width: '100%', minHeight: 74, height: 'auto', padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                    value={draftSummary}
                    onChange={(event) => { setDraftSummary(event.target.value); setDraftSaved(false) }}
                  />
                  <h3>二、问题事实</h3>
                  <textarea
                    className="icm-input"
                    style={{ width: '100%', minHeight: 74, height: 'auto', padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                    value={draftFact}
                    onChange={(event) => { setDraftFact(event.target.value); setDraftSaved(false) }}
                  />
                  <h3>三、引用素材</h3>
                  <textarea
                    className="icm-input"
                    style={{ width: '100%', minHeight: 74, height: 'auto', padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                    value={draftReferences}
                    onChange={(event) => { setDraftReferences(event.target.value); setDraftSaved(false) }}
                  />
                  <h3>四、审核口径</h3>
                  <textarea
                    className="icm-input"
                    style={{ width: '100%', minHeight: 74, height: 'auto', padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                    value={draftReviewBasis}
                    onChange={(event) => { setDraftReviewBasis(event.target.value); setDraftSaved(false) }}
                  />
                  {draftSaved ? <div style={{ color: '#15803d', fontSize: 12, fontWeight: 800, marginTop: 6 }}>初稿已暂存</div> : null}
                </div>
              ) : null}

              {ledgerReady ? (
                <div className="icm-report-ledger">
                  <strong>报送台账：RPT-2026-{selected.id.replace('RC-', '')}</strong>
                  <span>{selectedTemplate} · {selected.owner} · 素材 {selectedSrcItems.length} 项 · 状态 {flowTag}</span>
                </div>
              ) : null}

              <div className="icm-report-action-bar" style={{ paddingTop: 8 }}>
                <Button type="info-soft" icon={<ClipboardList size={15} />} onClick={() => setModal('materials')}>选择报告素材</Button>
                <Button type="info-soft" icon={<FileText size={15} />} onClick={() => setModal('templates')}>选择报告模板</Button>
                {flow === 'editing' ? (
                  <Button type="primary" icon={<FileText size={15} />} disabled={!canDraft} onClick={generateDraft}>生成报告初稿</Button>
                ) : flow === 'drafted' ? (
                  <>
                    <Button type="default-soft" onClick={saveDraft}>暂存</Button>
                    <Button type="primary" icon={<ClipboardList size={15} />} onClick={generateLedger}>生成报送台账</Button>
                  </>
                ) : flow === 'ledger' ? (
                  <Button type="success-soft" icon={<Send size={15} />} onClick={submitAudit}>提交审核</Button>
                ) : flow === 'approved' ? (
                  <Button type="primary" icon={<CheckCircle2 size={15} />} onClick={archiveReport}>确认入库</Button>
                ) : flow === 'archived' ? (
                  <Tag tone="green">已入库</Tag>
                ) : (
                  <Tag tone="blue">审核中</Tag>
                )}
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* ---- Modals (same as before) ---- */}
      {ledgerModal ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal icm-modal-small">
            <div className="icm-modal-head">
              <div><div className="icm-modal-title">报送台账预览</div><div className="icm-modal-sub">RPT-2026-{selected.id.replace('RC-', '')} · 确认素材后生成报送台账</div></div>
              <button className="icm-modal-close" type="button" onClick={() => setLedgerModal(false)} aria-label="关闭"><X size={16} /></button>
            </div>
            <div className="icm-modal-body" style={{ padding: 14 }}>
              <div className="icm-grid cols-2">
                <DetailLine label="整改事项" value={selected.issue} />
                <DetailLine label="责任部门" value={selected.owner} />
                <DetailLine label="报告模板" value={selectedTemplate || '未选择'} />
                <DetailLine label="已选素材" value={`${selectedSrcItems.length} 项`} />
              </div>
              {selectedSrcItems.length ? (
                <DataTable columns={['素材类型', '编号', '标题', '来源/责任', '状态']} rows={selectedSrcItems.map((item) => [item.type, item.id, item.title, item.owner, <Tag tone={statusTone(item.status)}>{item.status}</Tag>])} />
              ) : <div className="icm-empty-inline">尚未选择报告素材。</div>}
            </div>
            <div className="icm-modal-foot">
              <span style={{ color: '#748299', fontSize: 12 }}>确认后将生成报送台账。</span>
              <div className="icm-actions"><Button type="default-soft" onClick={() => setLedgerModal(false)}>取消</Button><Button type="primary" onClick={confirmLedger}>确认生成</Button></div>
            </div>
          </div>
        </div>
      ) : null}

      {auditModal ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal icm-modal-small">
            <div className="icm-modal-head">
              <div><div className="icm-modal-title">审核报送</div><div className="icm-modal-sub">RPT-2026-{selected.id.replace('RC-', '')} · {selectedTemplate} · 素材 {selectedSrcItems.length} 项</div></div>
              <button className="icm-modal-close" type="button" onClick={() => !auditRunning ? setAuditModal(false) : undefined} aria-label="关闭"><X size={16} /></button>
            </div>
            <div className="icm-modal-body" style={{ padding: 14 }}>
              <div className="icm-list">
                {reviewNodes2.map((node, i) => {
                  const isCompleted = auditDone || (!auditRunning && i === 0) ? false : auditRunning ? i < auditStep : false
                  const isCurrent = auditRunning && i === auditStep
                  const nodeStatus = auditDone ? '已完成' : isCompleted ? '已完成' : isCurrent ? '处理中' : '待审核'
                  const nodeTone: Tone = auditDone ? 'green' : isCompleted ? 'green' : isCurrent ? 'blue' : 'gray'
                  return (
                    <div className={`icm-audit-row ${(auditDone || isCompleted) ? 'done' : isCurrent ? 'running' : ''}`} key={node}>
                      <div className="icm-audit-row-head"><div><strong>{node}</strong><span>{['编制人', '检查组长', '内控部门负责人', '报送管理员'][i]} · RPT-2026-{selected.id.replace('RC-', '')}</span></div><Tag tone={nodeTone}>{nodeStatus}</Tag></div>
                      <div className="icm-audit-progress"><b style={{ width: auditDone || isCompleted ? '100%' : isCurrent ? '50%' : '0%' }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="icm-modal-foot">
              <span style={{ color: '#748299', fontSize: 12 }}>{auditDone ? '全部审核已完成，可确认入库。' : auditRunning ? '审核进行中…' : '提交后将依次流转审核节点。'}</span>
              <div className="icm-actions">
                {!auditRunning && !auditDone ? <Button type="primary" onClick={startAuditFlow}>提交审核</Button> : auditDone ? <Button type="primary" icon={<CheckCircle2 size={15} />} onClick={confirmArchive}>确认入库</Button> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {modal === 'materials' ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal">
            <div className="icm-modal-head">
              <div><div className="icm-modal-title">选择报告素材</div><div className="icm-modal-sub">仅展示与当前整改事项关联的数据 · 已选 {selectedSrcItems.length} 项</div></div>
              <button className="icm-modal-close" type="button" onClick={() => setModal(null)} aria-label="关闭"><X size={16} /></button>
            </div>
            <div className="icm-reference-list">
              {groupedSources.map((group) => {
                if (!group.items.length) return null
                return (
                  <div className="icm-list" key={group.type}>
                    <div className="icm-list-row icm-material-group-row" style={{ cursor: 'default' }}>
                      <div><div className="icm-list-title">{group.type}素材</div><div className="icm-list-meta">可引用 {group.items.length} 项 · 已选 {group.items.filter((item) => selectedSourceIds.includes(item.id)).length} 项</div></div>
                    </div>
                    {group.items.map((item) => (
                      <button className={`icm-reference-row ${selectedSourceIds.includes(item.id) ? 'active' : ''}`} key={item.id} type="button" onClick={() => toggleSource(item.id)}>
                        <span className="icm-reference-check">{selectedSourceIds.includes(item.id) ? '✓' : ''}</span>
                        <span><strong>{item.title}</strong><em>{item.type} · {item.id} · {item.owner}</em></span>
                        <Tag tone={statusTone(item.status)}>{item.status}</Tag>
                      </button>
                    ))}
                  </div>
                )
              })}
              {groupedSources.every((g) => !g.items.length) ? <div className="icm-empty-inline">当前整改事项无关联素材，请先补充问题、底稿和证据关系。</div> : null}
            </div>
            <div className="icm-modal-foot">
              <span>已选择 {selectedSrcItems.length} 项素材</span>
              <Button type="primary" onClick={() => setModal(null)}>确认素材</Button>
            </div>
          </div>
        </div>
      ) : null}

      {modal === 'templates' ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal icm-modal-small">
            <div className="icm-modal-head">
              <div><div className="icm-modal-title">选择报告模板</div><div className="icm-modal-sub">{selectedTemplate || '未选择模板'}</div></div>
              <button className="icm-modal-close" type="button" onClick={() => setModal(null)} aria-label="关闭"><X size={16} /></button>
            </div>
            <div className="icm-reference-list">
              {reports.templates.map((template) => (
                <button className={`icm-reference-row ${selectedTemplate === template ? 'active' : ''}`} key={template} type="button" onClick={() => { setSelectedTemplate(template); setFlow('editing'); setAuditStep(-1) }}>
                  <span className="icm-reference-check">{selectedTemplate === template ? '✓' : ''}</span>
                  <span><strong>{template}</strong><em>目录、审核流、报送口径、归档分类</em></span>
                  <Tag tone={selectedTemplate === template ? 'blue' : 'gray'}>{selectedTemplate === template ? '已选' : '模板'}</Tag>
                </button>
              ))}
            </div>
            <div className="icm-modal-foot">
              <span>{selectedTemplate || '请选择模板'}</span>
              <Button type="primary" disabled={!selectedTemplate} onClick={() => setModal(null)}>确认模板</Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  )
}
