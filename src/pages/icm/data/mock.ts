import type {
  Agent,
  Cockpit,
  DataCollect,
  Dispatch,
  Evidence,
  Finding,
  IcmMockData,
  Issue,
  KnowledgeBase,
  Overview,
  Plan,
  Rectification,
  Reports,
  StandardRule,
  Task,
  Tone,
  WalkthroughNode,
  Workpaper,
} from './types'

export const mockBoundary = {
  source: 'mock' as const,
  note: '演示数据仅用于采购围标风险样例，不连接真实接口、真实审批、真实权限或真实报送系统。',
  updatedAt: '2026-06-30 09:30',
}

export const overview: Overview = {
  taskId: 'T-CG-2026-018',
  planName: '采购围标风险专项内控检查计划',
  unit: '华北装备制造集团西北分公司',
  unitProfile: '央国企二级单位风格样例，名称与组织均为 Mock。',
  scope: '2026 年 1-5 月工程物资采购、招标评审、合同签订、验收付款事项',
  owner: '集团内控监督部',
  mockBoundary,
  kpis: [
    { value: '3', label: '重大/重要风险线索', note: '均已关联底稿与取证单', tone: 'red' },
    { value: '1,180 万', label: '涉及合同金额', note: '三份合同短期连续签订', tone: 'amber' },
    { value: '92%', label: '最高规则置信度', note: '拆分采购规则命中', tone: 'blue' },
    { value: '67%', label: '整改闭环率', note: '1 项销号，2 项推进', tone: 'green' },
  ],
  trends: [
    { month: '2026-01', risk: 42, findings: 2, rectified: 0 },
    { month: '2026-02', risk: 48, findings: 3, rectified: 1 },
    { month: '2026-03', risk: 55, findings: 5, rectified: 2 },
    { month: '2026-04', risk: 73, findings: 8, rectified: 3 },
    { month: '2026-05', risk: 86, findings: 11, rectified: 5 },
    { month: '2026-06', risk: 78, findings: 9, rectified: 6 },
  ],
  chain: [
    { key: 'plan', label: '计划审批', status: '审批通过', owner: '集团内控监督部', percent: 100 },
    { key: 'dispatch', label: '任务派发', status: '已进场', owner: '检查组', percent: 100 },
    { key: 'collect', label: '数据采集', status: '待补充', owner: '采购部/财务部', percent: 86 },
    { key: 'review', label: '智能审查', status: '人工复核中', owner: '检查组', percent: 72 },
    { key: 'rectify', label: '整改闭环', status: '整改中', owner: '责任部门', percent: 67 },
    { key: 'report', label: '报告输出', status: '草稿中', owner: '主审', percent: 58 },
  ],
}

export const plans: Plan[] = [
  {
    id: 'PL-2026-001',
    name: overview.planName,
    type: '专项计划',
    status: '审批通过',
    unit: overview.unit,
    owner: '郑刚',
    period: '2026-06-20 至 2026-07-31',
    basis: '年度内控检查安排、采购管理办法、招投标合规指引、供应商管理细则',
    objective: '验证采购围标风险识别、取证、整改和报告闭环是否可演示。',
    riskTheme: '采购围标风险',
    approvals: [
      { node: '党委前置研究校验', owner: '党委办公室', status: '通过', date: '2026-06-20', opinion: '已完成重大专项检查前置研究。' },
      { node: '经理层审批', owner: '总经理办公会', status: '通过', date: '2026-06-22', opinion: '同意按专项检查立项。' },
      { node: '董事会审批字段', owner: '董事会办公室', status: '预留', date: '-', opinion: '一期仅展示，不作为阻断条件。' },
    ],
  },
]

export const tasks: Task[] = [
  {
    id: 'TK-001',
    type: '检查任务',
    name: '采购与合同专项检查',
    unit: overview.unit,
    owner: '张衡',
    reviewer: '郑刚',
    start: '2026-06-24',
    end: '2026-07-18',
    status: '进行中',
    progress: 62,
    outputs: ['疑似问题', '检查底稿', '问题台账'],
    blockers: ['评分表附件待补齐'],
  },
  {
    id: 'TK-002',
    type: '穿行测试任务',
    name: '采购到付款穿行测试',
    unit: overview.unit,
    owner: '李娜',
    reviewer: '张衡',
    start: '2026-06-26',
    end: '2026-07-10',
    status: '进行中',
    progress: 70,
    outputs: ['穿行测试记录', '取证单', '阳性底稿'],
    blockers: ['供应商准入资料待补充'],
  },
  {
    id: 'TK-003',
    type: '取证任务',
    name: '招标文件与付款流水取证',
    unit: overview.unit,
    owner: '王锐',
    reviewer: '李娜',
    start: '2026-06-27',
    end: '2026-07-08',
    status: '待复核',
    progress: 85,
    outputs: ['取证单', '证据链', '报告引用'],
    blockers: [],
  },
]

export const dispatch: Dispatch = {
  team: ['张衡 / 检查组长', '李娜 / 合同核验', '王锐 / 资金取数', '赵明 / 外部专家'],
  materials: ['采购合同台账', '招标文件与评分表', '供应商准入资料', '付款审批单', '验收入库记录'],
  entries: [
    { item: '进场通知书', status: '已送达', owner: '综合管理部' },
    { item: '首次会议', status: '已确认', owner: '张衡' },
    { item: '资料需求清单', status: '已下发', owner: '李娜' },
    { item: '临时数据权限', status: 'Mock 开通', owner: '系统管理员' },
  ],
  resourceCalendar: [
    { name: '张衡', role: '采购 / 合同 / 组长', load: 62, conflict: '无冲突' },
    { name: '李娜', role: '合同 / 取证', load: 70, conflict: '无冲突' },
    { name: '王锐', role: '资金 / 系统取数', load: 78, conflict: '付款流水导出窗口待确认' },
    { name: '赵明', role: '招采合规专家', load: 42, conflict: '外部专家保密协议已确认' },
  ],
}

export const rules: StandardRule[] = [
  {
    id: 'STD-CG-001',
    domain: '采购',
    name: '采购招标异常检查标准',
    condition: '同项目短周期多合同、金额接近阈值、供应商报价或文件特征异常时触发复核',
    source: '集团采购管理办法第 18 条',
    output: '检查标准库 / 智能审查 / 底稿 / 报告中心',
    riskWeight: 92,
    sampleFields: ['project_code', 'supplier_name', 'contract_amount', 'sign_date'],
    sourceType: '知识库同步',
    linkedClauseId: 'LAW-CG-018',
    syncStatus: '已同步',
    applicableScenario: '采购围标、拆分采购、陪标线索复核',
  },
  {
    id: 'STD-SUP-002',
    domain: '供应商',
    name: '供应商关联关系检查标准',
    condition: '报名供应商存在联系人、地址、账户、历史投标项目或文件元数据重合',
    source: '供应商管理细则第 9 条',
    output: '智能审查 / 取证单 / 问题台账',
    riskWeight: 86,
    sampleFields: ['supplier_id', 'legal_person', 'contact_phone', 'address'],
    sourceType: '知识库同步',
    linkedClauseId: 'LAW-SUP-009',
    syncStatus: '已同步',
    applicableScenario: '供应商准入、围标陪标、关联交易提示',
  },
  {
    id: 'STD-PAY-003',
    domain: '资金',
    name: '合同付款异常检查标准',
    condition: '实际预付比例高于合同约定、审批链缺失或验收前付款金额异常',
    source: '资金支付制度第 8 条',
    output: '智能审查 / 问题台账 / 整改闭环',
    riskWeight: 88,
    sampleFields: ['contract_ratio', 'paid_ratio', 'approval_node', 'payment_date'],
    sourceType: '知识库同步',
    linkedClauseId: 'LAW-PAY-008',
    syncStatus: '已同步',
    applicableScenario: '中标后付款、合同履约、资金支付授权',
  },
  {
    id: 'STD-METHOD-004',
    domain: '方法',
    name: '检查方法引用来源标注标准',
    condition: '底稿、报告、AI 问答引用法规或案例时必须标注来源、版本和时效状态',
    source: '知识库强制规则：检索结果标注来源时效',
    output: '底稿 / 报告中心 / 智能检索问答',
    riskWeight: 80,
    sampleFields: ['citation_id', 'version', 'status', 'source_module'],
    sourceType: '知识库强制规则',
    linkedClauseId: 'CTRL-KB-003',
    syncStatus: '待确认',
    applicableScenario: '知识引用、报告撰写、底稿取证',
  },
]

export const knowledge: KnowledgeBase = {
  clauses: [
    { id: 'LAW-CG-018', title: '集团采购管理办法第 18 条', status: '有效', domain: '采购', citationId: 'CL-001', issuer: '集团采购管理部', clauseNo: '第 18 条', effectiveDate: '2026-01-01', version: 'V2026.01', structureStatus: '已结构化', summary: '不得拆分项目规避公开招标或比选程序。', syncTarget: ['检查标准库', '智能审查引擎', '报告中心'] },
    { id: 'LAW-BID-012', title: '招投标合规指引第 12 条', status: '有效', domain: '采购', citationId: 'CL-002', issuer: '集团招采中心', clauseNo: '第 12 条', effectiveDate: '2026-03-15', version: 'V2026.03', structureStatus: '已结构化', summary: '投标人之间不得串通投标，不得陪标围标。', syncTarget: ['检查标准库', '智能审查引擎', '检查底稿'] },
    { id: 'LAW-SUP-009', title: '供应商管理细则第 9 条', status: '有效', domain: '供应商', citationId: 'CL-003', issuer: '供应链管理部', clauseNo: '第 9 条', effectiveDate: '2026-02-20', version: 'V2026.02', structureStatus: '已结构化', summary: '供应商准入、评价、暂停合作应保持独立、可追溯。', syncTarget: ['智能审查引擎', '检查底稿', '整改闭环'] },
    { id: 'LAW-PAY-008', title: '资金支付制度第 8 条', status: '即将失效', domain: '资金', citationId: 'CL-004', issuer: '财务资金部', clauseNo: '第 8 条', effectiveDate: '2025-09-01', version: 'V2025.09', structureStatus: '待复核', summary: '付款应按合同约定比例和授权额度履行审批。', syncTarget: ['检查标准库', '报告中心'] },
  ],
  cases: [
    { id: 'CASE-CG-001', title: '某二级企业拆分合同规避招标案例', level: '重大', sourceModule: '检查底稿', riskType: '拆分采购', issuePattern: '同项目三份合同短期连续签订，单笔金额接近招标阈值。', result: '形成问题台账并督办采购规则修订。', generatedMethod: '短周期合同聚合比对', use: '用于同类风险判定口径。', tags: ['拆分采购', '招标线', '合同连续签订'] },
    { id: 'CASE-SUP-002', title: '供应商联系人重复导致陪标风险案例', level: '重要', sourceModule: '取证单台账', riskType: '陪标围标', issuePattern: '两家供应商联系人、报价格式和文件元数据存在异常相似。', result: '补充取证并纳入供应商准入复核。', generatedMethod: '相似案例匹配模型配置', use: '用于供应商关联核验提示。', tags: ['联系人重复', '报价相似', '文件元数据'] },
    { id: 'CASE-PAY-003', title: '付款比例超约定触发整改案例', level: '重要', sourceModule: '整改闭环', riskType: '资金支付', issuePattern: '实际预付比例高于合同约定，审批链说明不足。', result: '整改完成后回写资金支付制度修订建议。', generatedMethod: '付款比例阈值检查方法', use: '用于付款节点控制测试。', tags: ['预付款', '审批链', '验收前付款'] },
    { id: 'CASE-INV-004', title: '投资项目偏离主责主业案例', level: '重大', sourceModule: '问题台账', riskType: '投资管理', issuePattern: '投资标的与集团主责主业匹配度不足，立项论证未充分说明产业协同。', result: '暂停后续出资，补充投资决策论证并重新履行审批。', generatedMethod: '投资方向合规性核验', use: '用于投资方向偏离、无关多元化投资识别。', tags: ['主责主业', '投资立项', '决策审批'] },
    { id: 'CASE-CON-005', title: '合同补充协议审批链缺失案例', level: '重要', sourceModule: '检查底稿', riskType: '合同管理', issuePattern: '补充协议改变付款节点和履约范围，但未见完整授权审批记录。', result: '补齐审批依据，修订补充协议管理台账和授权边界。', generatedMethod: '合同审批链完整性检查', use: '用于合同变更、补充协议、授权审批检查。', tags: ['补充协议', '审批链', '授权边界'] },
    { id: 'CASE-FIN-006', title: '财务暂估长期挂账案例', level: '一般', sourceModule: '整改闭环', riskType: '财务核算', issuePattern: '部分采购暂估超过规定清理周期，未及时取得发票或办理冲销。', result: '建立月度清理清单，超期事项纳入财务共享中心督办。', generatedMethod: '账龄分层与长期挂账核验', use: '用于财务信息质量、暂估应付、长期挂账检查。', tags: ['暂估应付', '账龄分析', '财务质量'] },
  ],
  templates: [
    { id: 'TPL-PLAN-001', name: '采购专项检查方案模板', type: '检查方案', version: 'V2026.04', domain: '采购', bindClause: 'LAW-CG-018', reuse: '计划编制审批' },
    { id: 'TPL-WALK-002', name: '采购到付款穿行测试记录模板', type: '穿行测试', version: 'V2026.05', domain: '采购/资金', bindClause: 'LAW-PAY-008', reuse: '穿行测试工作台' },
    { id: 'TPL-EV-003', name: '取证单模板', type: '取证', version: 'V2026.03', domain: '通用', bindClause: 'CTRL-KB-003', reuse: '取证单台账' },
    { id: 'TPL-RPT-004', name: '专项报告模板', type: '报告', version: 'V2026.06', domain: '通用', bindClause: 'LAW-BID-012', reuse: '报告中心' },
  ],
  methods: [
    { id: 'MTH-CG-001', name: '短周期合同聚合比对', scenario: '拆分采购、规避招标', steps: '按项目、供应商、签订日期、金额阈值聚合比对。', output: '疑似问题线索 / 底稿草稿', bindTemplate: 'TPL-PLAN-001' },
    { id: 'MTH-SUP-002', name: '供应商相似关系核验', scenario: '陪标围标、关联供应商', steps: '比对联系人、地址、账户、文件元数据和历史投标项目。', output: '取证单 / 人工复核清单', bindTemplate: 'TPL-EV-003' },
    { id: 'MTH-RAG-003', name: '法规案例混合检索', scenario: '报告撰写、底稿依据引用', steps: '关键词检索与向量召回合并，返回法规版本和案例来源。', output: '引用清单 / AI 问答答案', bindTemplate: 'TPL-RPT-004' },
  ],
  references: [
    { id: 'REF-001', type: '制度', title: '采购招标异常识别口径', quote: '短周期、同供应商、金额接近阈值时应补充采购包划分说明。', source: 'LAW-CG-018', timeliness: '有效' },
    { id: 'REF-002', type: '案例', title: '报价相似度人工复核提示', quote: '报价相似仅作为线索，需结合文件元数据、联系人和评审记录综合判断。', source: 'CASE-SUP-002', timeliness: '已沉淀' },
  ],
  controls: [
    { rule: '新规 3 日内完成录入', owner: '法规维护岗', status: '预警', action: '资金支付制度修订稿剩余 1 日到期' },
    { rule: '检查结束 15 日内沉淀案例', owner: '检查组长', status: '待处理', action: '采购围标专项检查需沉淀 2 条案例' },
    { rule: '检索结果标注来源时效', owner: '知识管理员', status: '通过', action: '报告引用已带来源、版本、时效' },
  ],
  search: [
    { question: '采购围标风险报告应该引用哪些依据？', answer: '建议引用集团采购管理办法第 18 条、招投标合规指引第 12 条，并补充供应商联系人重复案例。', citations: ['LAW-CG-018', 'LAW-BID-012', 'CASE-SUP-002'], mode: '关键词 + 向量混合检索' },
    { question: '如何判断付款比例异常？', answer: '先比对合同约定预付比例与实际付款比例，再核查审批链和验收节点。', citations: ['LAW-PAY-008', 'CASE-PAY-003'], mode: 'RAG 自然语言问答' },
  ],
  syncTargets: [
    { module: '检查标准库', route: '/standard-library', content: '同步法规条款、检查标准、方法口径', status: '已同步 4 项' },
    { module: '智能审查引擎', route: '/review-workbench', content: 'RAG 向量知识库、规则依据、案例标签', status: '待确认 1 项' },
    { module: '检查底稿', route: '/workpaper', content: '取证法规调用、检查方法、引用来源', status: '已同步 3 项' },
    { module: '整改闭环', route: '/rectify', content: '推送同类整改案例、整改建议、制度修订提示', status: '已同步 2 项' },
    { module: '报告中心', route: '/report', content: '引用法规、处罚案例、整改案例和模板', status: '已同步 4 项' },
  ],
}

export const dataCollect: DataCollect = {
  demands: [
    { name: '采购合同台账', owner: '采购部', rows: 86, status: '已采集', method: 'Mock 批量导入', due: '2026-06-26' },
    { name: '招标文件与评分表', owner: '招采中心', rows: 14, status: '已采集', method: '资料上传', due: '2026-06-27' },
    { name: '供应商准入资料', owner: '供应链管理部', rows: 32, status: '待补充', method: '手工补录', due: '2026-07-02' },
    { name: '付款审批流水', owner: '财务部', rows: 23, status: '已采集', method: 'Mock 取数', due: '2026-06-28' },
  ],
  uploads: [
    { id: 'UP-001', fileName: '2026工程物资采购合同台账.xlsx', owner: '采购部', status: '已入库', linkedDemand: '采购合同台账' },
    { id: 'UP-002', fileName: '招标评分表扫描件.zip', owner: '招采中心', status: '已入库', linkedDemand: '招标文件与评分表' },
    { id: 'UP-003', fileName: '供应商准入资料补充包.zip', owner: '供应链管理部', status: '待补充', linkedDemand: '供应商准入资料' },
  ],
  quality: [
    { rule: '合同编号完整性', target: 'contract_no', result: '通过', score: 98, fixHint: '无需处理' },
    { rule: '供应商名称一致性', target: 'supplier_name', result: '通过', score: 95, fixHint: '无需处理' },
    { rule: '评分表附件完整性', target: 'score_file', result: '待处理', score: 82, fixHint: '补齐 2 份扫描附件' },
    { rule: '付款审批链完整性', target: 'approval_node', result: '关注', score: 88, fixHint: '核对 3 笔审批节点说明' },
  ],
  packages: ['采购合同结果包', '招标评分结果包', '资金付款结果包'],
  resultPackages: [
    { id: 'PKG-CG-001', name: '采购合同结果包', status: '可审查', includes: ['合同台账', '合同正本', '采购申请'] },
    { id: 'PKG-BID-002', name: '招标评分结果包', status: '待补充', includes: ['投标文件', '评分表', '评审纪要'] },
    { id: 'PKG-PAY-003', name: '资金付款结果包', status: '可审查', includes: ['付款申请', '审批流水', '银行回单'] },
  ],
}

export const agents: Agent[] = [
  { name: '采购审查智能体', domain: '采购', status: '已完成', progress: 100, hits: 2, mockModel: 'Mock-Ruleset-CG', reviewMode: '规则命中后人工确认' },
  { name: '合同审查智能体', domain: '合同', status: '已完成', progress: 100, hits: 3, mockModel: 'Mock-Ruleset-HT', reviewMode: '合同字段比对' },
  { name: '资金审查智能体', domain: '资金', status: '运行中', progress: 72, hits: 1, mockModel: 'Mock-Ruleset-PAY', reviewMode: '付款比例复核' },
  { name: '供应商关联核验智能体', domain: '供应商', status: '待复核', progress: 86, hits: 2, mockModel: 'Mock-Ruleset-SUP', reviewMode: '关联线索提示' },
]

export const findings: Finding[] = [
  {
    id: 'SUS-01',
    title: '三份合同疑似拆分规避公开招标',
    level: '重大',
    confidence: 92,
    sample: 'HT-1182/1183/1184 合计 1,180 万，单笔均低于 400 万招标线。',
    status: '人工复核确认',
    agent: '采购审查智能体',
    ruleId: 'R-BID-001',
    reviewer: '张衡',
    linkedEvidence: ['EV-0312', 'EV-0316'],
  },
  {
    id: 'SUS-02',
    title: '两家陪标供应商报价与联系人异常相似',
    level: '重要',
    confidence: 84,
    sample: '投标报价差异 0.8%，联系人手机号归属同一经办人。',
    status: '需补充取证',
    agent: '供应商关联核验智能体',
    ruleId: 'R-BID-002',
    reviewer: '李娜',
    linkedEvidence: ['EV-0321'],
  },
  {
    id: 'SUS-03',
    title: '中标后预付款比例超合同约定',
    level: '重大',
    confidence: 88,
    sample: '合同约定预付 30%，实际付款 50%，金额 620 万。',
    status: '人工复核确认',
    agent: '资金审查智能体',
    ruleId: 'R-PAY-003',
    reviewer: '王锐',
    linkedEvidence: ['EV-0318'],
  },
]

export const walkthrough: WalkthroughNode[] = [
  { node: '采购需求提出', control: '需求审批完整', type: '预防', result: '通过', evidence: '采购申请单', passStandard: '申请、预算、审批人齐全', failStandard: '缺预算依据或越权审批', generated: [] },
  { node: '招标方案审批', control: '采购包划分依据充分', type: '预防', result: '异常', evidence: '招标方案审批表', passStandard: '采购包划分说明清晰', failStandard: '同类项目短期拆分且无说明', generated: ['WP-0451', 'EV-0312'] },
  { node: '供应商报名', control: '供应商独立性核验', type: '侦测', result: '关注', evidence: '供应商准入资料', passStandard: '联系人、地址、账户无异常重合', failStandard: '多项关键信息重合', generated: ['EV-0321'] },
  { node: '评标定标', control: '评分异常波动复核', type: '侦测', result: '关注', evidence: '评分表', passStandard: '评分差异有独立依据', failStandard: '评分表高度雷同或说明缺失', generated: ['WP-0458'] },
  { node: '合同签订', control: '合同金额与招标结果一致', type: '预防', result: '异常', evidence: '合同正本', passStandard: '合同金额、范围、供应商与中标结果一致', failStandard: '合同范围拆分或金额偏离', generated: ['WP-0451'] },
  { node: '付款审批', control: '付款比例符合合同约定', type: '预防', result: '异常', evidence: '付款审批单', passStandard: '付款比例、节点、验收资料一致', failStandard: '超比例付款或审批链缺失', generated: ['WP-0455', 'EV-0318'] },
]

export const evidences: Evidence[] = [
  { id: 'EV-0312', type: '调阅', title: '采购合同台账及招标文件', owner: '李娜', status: '已归档', link: 'WP-0451', capturedAt: '2026-06-27 10:20', sourceSystem: 'Mock 资料库', chainHash: 'MOCK-EV-0312-A8F2' },
  { id: 'EV-0316', type: '截图', title: '采购包划分审批页面截图', owner: '李娜', status: '已归档', link: 'WP-0451', capturedAt: '2026-06-27 11:05', sourceSystem: 'Mock 招采系统', chainHash: 'MOCK-EV-0316-B7C1' },
  { id: 'EV-0318', type: '系统取数', title: '大额付款流水及审批单', owner: '王锐', status: '已归档', link: 'WP-0455', capturedAt: '2026-06-28 09:45', sourceSystem: 'Mock 资金系统', chainHash: 'MOCK-EV-0318-D4E9' },
  { id: 'EV-0321', type: '访谈', title: '供应商联系人重复情况访谈', owner: '张衡', status: '待复核', link: 'WP-0456', capturedAt: '2026-06-29 15:30', sourceSystem: 'Mock 访谈记录', chainHash: 'MOCK-EV-0321-C2AA' },
]

export const workpapers: Workpaper[] = [
  { id: 'WP-0451', title: '合同金额拆分规避招标核查', result: '阳性', reviewer: '张衡', status: '审定通过', issue: 'ISS-077', evidenceIds: ['EV-0312', 'EV-0316'], conclusion: '短期连续签订、供应商一致且金额接近阈值，需登记重大问题。' },
  { id: 'WP-0455', title: '预付款比例异常核查', result: '阳性', reviewer: '张衡', status: '复核中', issue: 'ISS-081', evidenceIds: ['EV-0318'], conclusion: '付款比例高于合同约定，需补充审批依据并整改。' },
  { id: 'WP-0456', title: '供应商联系人重复核查', result: '阳性', reviewer: '李娜', status: '待补证', issue: 'ISS-079', evidenceIds: ['EV-0321'], conclusion: '供应商独立性存在疑点，需补充工商及联系人说明。' },
  { id: 'WP-0460', title: '供应商准入资料完整性核查', result: '阴性', reviewer: '李娜', status: '审定通过', issue: '-', evidenceIds: [], conclusion: '已抽样资料未发现准入审批缺失。' },
]

export const issues: Issue[] = [
  { id: 'ISS-077', title: '拆分合同规避公开招标', level: '重大', owner: '采购部', deadline: '2026-07-10', progress: 55, status: '整改中', workpaperId: 'WP-0451', evidenceIds: ['EV-0312', 'EV-0316'], rectificationId: 'RC-077' },
  { id: 'ISS-079', title: '陪标供应商管理失控', level: '重要', owner: '供应链管理部', deadline: '2026-07-18', progress: 30, status: '待整改', workpaperId: 'WP-0456', evidenceIds: ['EV-0321'], rectificationId: 'RC-079' },
  { id: 'ISS-081', title: '预付款比例控制不严', level: '重大', owner: '财务部', deadline: '2026-07-12', progress: 80, status: '待复核', workpaperId: 'WP-0455', evidenceIds: ['EV-0318'], rectificationId: 'RC-081' },
  { id: 'ISS-090', title: '验收记录补录不及时', level: '一般', owner: '仓储管理部', deadline: '2026-06-28', progress: 100, status: '已销号', workpaperId: 'WP-0462', evidenceIds: [], rectificationId: 'RC-090' },
]

export const rectifications: Rectification[] = [
  { id: 'RC-077', issue: '拆分合同规避公开招标', lane: '整改中', owner: '采购部', proof: 1, verify: '存疑', writeBack: '整改进度已回写任务 TK-001，暂不允许关闭。' },
  { id: 'RC-079', issue: '陪标供应商管理失控', lane: '待整改', owner: '供应链管理部', proof: 0, verify: '待核验', writeBack: '待提交佐证后回写。' },
  { id: 'RC-081', issue: '预付款比例控制不严', lane: '待复核', owner: '财务部', proof: 3, verify: '成立', writeBack: '复核通过后回写任务 TK-003。' },
  { id: 'RC-090', issue: '验收记录补录', lane: '已销号', owner: '仓储管理部', proof: 2, verify: '成立', writeBack: '已销号并回写关闭。' },
]

export const reports: Reports = {
  templates: ['专项检查报告', '整改情况报告', '管理建议书'],
  citations: ['WP-0451 合同金额拆分规避招标核查', 'EV-0312 采购合同台账取证单', 'ISS-077 拆分合同规避公开招标问题', '集团采购管理办法第 18 条', 'RC-077 整改阶段佐证'],
  outline: ['检查背景与范围', '主要风险发现', '证据链与复核结论', '问题定级与责任建议', '整改要求与后续监督安排'],
  basket: [
    { type: '底稿', id: 'WP-0451', title: '合同金额拆分规避招标核查', owner: '张衡' },
    { type: '证据', id: 'EV-0312', title: '采购合同台账及招标文件', owner: '李娜' },
    { type: '问题', id: 'ISS-077', title: '拆分合同规避公开招标', owner: '采购部' },
    { type: '整改', id: 'RC-077', title: '拆分合同规避公开招标整改', owner: '采购部' },
  ],
  drafts: [
    { id: 'RPT-001', title: '采购围标风险专项检查报告', status: '草稿中', version: 'V0.8' },
    { id: 'RPT-002', title: '整改情况阶段报告', status: '待复核', version: 'V0.3' },
  ],
  exportMeta: {
    word: '浏览器侧生成 .doc，Mock 下载。',
    pdf: '浏览器打印能力另存为 PDF，Mock 导出。',
    boundary: mockBoundary.note,
  },
}

export const cockpit: Cockpit = {
  domains: [
    { name: '采购', score: 88 },
    { name: '合同', score: 76 },
    { name: '资金', score: 72 },
    { name: '工程', score: 58 },
    { name: '投资', score: 46 },
    { name: '财务', score: 42 },
  ],
  metrics: [
    { value: '128', label: '采购项目监测', note: '覆盖 12 个 Mock 单位', tone: 'cyan' },
    { value: '21', label: '采购围标风险线索', note: '红色 3 条 / 橙色 8 条', tone: 'red' },
    { value: '86%', label: '证据链完整度', note: '较上月 +9%', tone: 'green' },
    { value: '71%', label: '整改闭环率', note: '预计 7 月达 82%', tone: 'amber' },
  ],
  heat: [
    { domain: '采购', unit: '总部采购中心', score: 92, level: '红色' },
    { domain: '供应商', unit: '西北分公司', score: 86, level: '红色' },
    { domain: '合同', unit: '华北制造基地', score: 76, level: '橙色' },
    { domain: '资金', unit: '财务共享中心', score: 72, level: '橙色' },
    { domain: '验收', unit: '仓储管理部', score: 58, level: '黄色' },
  ],
  alerts: [
    { domain: '采购', level: '重大', text: '三份合同短期连续签订，金额接近公开招标线。', owner: '采购部', action: '纳入专项督办' },
    { domain: '供应商', level: '重要', text: '两家供应商联系人和投标文件元数据高度相似。', owner: '供应链管理部', action: '补充关联核验' },
    { domain: '资金', level: '重大', text: '中标后预付款比例高于合同约定。', owner: '财务部', action: '复核付款审批' },
  ],
  trends: overview.trends,
}

export const icmMockData: IcmMockData = {
  overview,
  plans,
  tasks,
  dispatch,
  rules,
  knowledge,
  dataCollect,
  agents,
  findings,
  walkthrough,
  evidences,
  workpapers,
  issues,
  rectifications,
  reports,
  cockpit,
}

export function toneByStatus(value: string): Tone {
  if (value.includes('重大') || value.includes('异常') || value.includes('阳性') || value.includes('存疑') || value.includes('红色')) return 'red'
  if (value.includes('重要') || value.includes('关注') || value.includes('待') || value.includes('运行中') || value.includes('橙色') || value.includes('黄色') || value.includes('整改')) return 'amber'
  if (value.includes('通过') || value.includes('完成') || value.includes('归档') || value.includes('确认') || value.includes('成立') || value.includes('销号') || value.includes('关闭')) return 'green'
  return 'blue'
}
