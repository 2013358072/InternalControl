import { Activity, ClipboardCheck, Database, FileBarChart2, FileText, Radar, RefreshCw } from 'lucide-react'

import type { IcmRouteMeta, ModuleCategory } from './types'

export const categoryNames: Record<ModuleCategory, string> = {
  plan: '计划',
  data: '数据',
  review: '审查',
  workpaper: '底稿',
  rectify: '整改',
}

export const icmRoutes: IcmRouteMeta[] = [
  {
    path: '/plan-workbench',
    title: '计划与派发',
    pageId: 'stage_plan_dispatch',
    category: 'plan',
    categoryName: categoryNames.plan,
    description: '专项计划、任务分解、人员分配和资料清单。',
    icon: ClipboardCheck,
    layout: '计划列表 -> 计划详情 -> 任务与资料清单',
  },
  {
    path: '/data-collect',
    title: '知识库管理',
    pageId: 'stage_data_rules',
    category: 'data',
    categoryName: categoryNames.data,
    description: '法规库、案例库、模板方法库、智能检索问答和知识同步。',
    icon: Database,
    layout: '知识资产导航 -> 管理工作区 -> 同步去向',
  },
  {
    path: '/review-workbench',
    title: '智能审查',
    pageId: 'stage_smart_review',
    category: 'review',
    categoryName: categoryNames.review,
    description: '规则命中、穿行验证和人工复核。',
    icon: Radar,
    layout: '审查任务列表 -> 审查详情 -> 线索复核',
  },
  {
    path: '/workpaper',
    title: '底稿与问题',
    pageId: 'stage_workpaper_issue',
    category: 'workpaper',
    categoryName: categoryNames.workpaper,
    description: '线索转底稿、证据链、复核和问题生成。',
    icon: FileText,
    layout: '底稿列表 -> 底稿详情 -> 问题转化',
  },
  {
    path: '/rectify',
    title: '整改与报告',
    pageId: 'stage_rectify_report',
    category: 'rectify',
    categoryName: categoryNames.rectify,
    description: '整改派单、佐证复核、销号和报告引用。',
    icon: RefreshCw,
    layout: '整改列表 -> 整改详情 -> 报告预览',
  },
  {
    path: '/report',
    title: '报告中心',
    pageId: 'stage_report_center',
    category: 'rectify',
    categoryName: categoryNames.rectify,
    description: '报告任务检索、智能撰写、审核发布和归档调阅。',
    icon: FileBarChart2,
    layout: '报告任务列表 -> 报告详情 -> 审核发布',
  },
  {
    path: '/cockpit',
    title: '看板',
    pageId: 'stage_cockpit',
    category: 'plan',
    categoryName: categoryNames.plan,
    description: '计划、审查、底稿、问题、整改全链路态势总览。',
    icon: Activity,
    layout: '全链路态势大屏',
  },
]

export const defaultRoute = '/plan-workbench'

export function getRouteMeta(pathname: string) {
  return icmRoutes.find((route) => route.path === pathname) || icmRoutes[0]
}

export const demoPath = icmRoutes.map((route) => route.path)
