import { ClipboardCheck, Database, FileText, RefreshCw, Radar } from 'lucide-react'

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
]

export const defaultRoute = '/plan-workbench'

export function getRouteMeta(pathname: string) {
  return icmRoutes.find((route) => route.path === pathname) || icmRoutes[0]
}

export const demoPath = icmRoutes.map((route) => route.path)
