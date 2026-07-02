export type Tone = 'red' | 'amber' | 'blue' | 'green' | 'cyan' | 'gray'

export type MockBoundary = {
  source: 'mock'
  note: string
  updatedAt: string
}

export type KpiItem = {
  value: string
  label: string
  note: string
  tone: Tone
}

export type TrendPoint = {
  month: string
  risk: number
  findings: number
  rectified: number
}

export type ChainStatus = {
  key: string
  label: string
  status: string
  owner: string
  percent: number
}

export type Overview = {
  taskId: string
  planName: string
  unit: string
  unitProfile: string
  scope: string
  owner: string
  mockBoundary: MockBoundary
  kpis: KpiItem[]
  trends: TrendPoint[]
  chain: ChainStatus[]
}

export type ApprovalNode = {
  node: string
  owner: string
  status: string
  date: string
  opinion: string
}

export type Plan = {
  id: string
  name: string
  type: string
  status: string
  unit: string
  owner: string
  period: string
  basis: string
  objective: string
  riskTheme: string
  approvals: ApprovalNode[]
}

export type Task = {
  id: string
  type: string
  name: string
  unit: string
  owner: string
  reviewer: string
  start: string
  end: string
  status: string
  progress: number
  outputs: string[]
  blockers: string[]
}

export type DispatchEntry = {
  item: string
  status: string
  owner: string
}

export type Dispatch = {
  team: string[]
  materials: string[]
  entries: DispatchEntry[]
  resourceCalendar: Array<{
    name: string
    role: string
    load: number
    conflict: string
  }>
}

export type StandardRule = {
  id: string
  domain: string
  name: string
  condition: string
  source: string
  output: string
  riskWeight: number
  sampleFields: string[]
  sourceType?: string
  linkedClauseId?: string
  syncStatus?: string
  applicableScenario?: string
}

export type KnowledgeBase = {
  clauses: Array<{
    id?: string
    title: string
    status: string
    domain: string
    summary: string
    citationId: string
    issuer?: string
    clauseNo?: string
    effectiveDate?: string
    version?: string
    structureStatus?: string
    syncTarget?: string[]
  }>
  cases: Array<{
    id?: string
    title: string
    level: string
    use: string
    tags: string[]
    sourceModule?: string
    riskType?: string
    issuePattern?: string
    result?: string
    generatedMethod?: string
  }>
  templates: Array<{
    id: string
    name: string
    type: string
    version: string
    domain: string
    bindClause: string
    reuse: string
  }>
  methods: Array<{
    id: string
    name: string
    scenario: string
    steps: string
    output: string
    bindTemplate: string
  }>
  references: Array<{
    id: string
    title: string
    type: string
    quote: string
    source?: string
    timeliness?: string
  }>
  controls: Array<{
    rule: string
    owner: string
    status: string
    action: string
  }>
  search: Array<{
    question: string
    answer: string
    citations: string[]
    mode: string
  }>
  syncTargets: Array<{
    module: string
    route: string
    content: string
    status: string
  }>
}

export type DataCollect = {
  demands: Array<{
    name: string
    owner: string
    rows: number
    status: string
    method: string
    due: string
  }>
  uploads: Array<{
    id: string
    fileName: string
    owner: string
    status: string
    linkedDemand: string
  }>
  quality: Array<{
    rule: string
    target: string
    result: string
    score: number
    fixHint: string
  }>
  packages: string[]
  resultPackages: Array<{
    id: string
    name: string
    includes: string[]
    status: string
  }>
}

export type Agent = {
  name: string
  domain: string
  status: string
  progress: number
  hits: number
  mockModel: string
  reviewMode: string
}

export type Finding = {
  id: string
  title: string
  level: string
  confidence: number
  sample: string
  status: string
  agent: string
  ruleId: string
  reviewer: string
  linkedEvidence: string[]
}

export type WalkthroughNode = {
  node: string
  control: string
  type: string
  result: string
  evidence: string
  passStandard: string
  failStandard: string
  generated: string[]
}

export type Evidence = {
  id: string
  type: string
  title: string
  owner: string
  status: string
  link: string
  capturedAt: string
  sourceSystem: string
  chainHash: string
}

export type Workpaper = {
  id: string
  title: string
  result: string
  reviewer: string
  status: string
  issue: string
  evidenceIds: string[]
  conclusion: string
}

export type Issue = {
  id: string
  title: string
  level: string
  owner: string
  deadline: string
  progress: number
  status: string
  workpaperId: string
  evidenceIds: string[]
  rectificationId: string
}

export type Rectification = {
  id: string
  issue: string
  lane: string
  owner: string
  proof: number
  verify: string
  writeBack: string
}

export type Reports = {
  templates: string[]
  citations: string[]
  outline: string[]
  basket: Array<{
    type: string
    id: string
    title: string
    owner: string
  }>
  drafts: Array<{
    id: string
    title: string
    status: string
    version: string
  }>
  exportMeta: {
    word: string
    pdf: string
    boundary: string
  }
}

export type Cockpit = {
  domains: Array<{ name: string; score: number }>
  metrics: KpiItem[]
  heat: Array<{ domain: string; unit: string; score: number; level: string }>
  alerts: Array<{ domain: string; level: string; text: string; owner: string; action: string }>
  trends: TrendPoint[]
}

export type IcmMockData = {
  overview: Overview
  plans: Plan[]
  tasks: Task[]
  dispatch: Dispatch
  rules: StandardRule[]
  knowledge: KnowledgeBase
  dataCollect: DataCollect
  agents: Agent[]
  findings: Finding[]
  walkthrough: WalkthroughNode[]
  evidences: Evidence[]
  workpapers: Workpaper[]
  issues: Issue[]
  rectifications: Rectification[]
  reports: Reports
  cockpit: Cockpit
}
