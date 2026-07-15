import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { ClipboardCheck, Clock3, FileCheck2, FileText, Inbox, Mail, Megaphone, Newspaper, Send, UserCheck } from 'lucide-react'

import { Button, Card, DataTable, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { cockpit, issues, overview, plans, rectifications, tasks } from '../data'

type HomeTab = 'all' | 'group' | 'todo' | 'notice'

const todoItems = [
  { type: '计划校审', title: '供应商关联交易风险专项检查', owner: '李娜', node: '内控部门审核', status: '待处理', route: '/plan-workbench' },
  { type: '材料补充', title: '供应商准入资料补充包', owner: '供应链管理部', node: '数据采集', status: '待补充', route: '/data-collect' },
  { type: '审查复核', title: '陪标供应商管理失控线索', owner: '李娜', node: '人工复核', status: '待复核', route: '/review-workbench' },
  { type: '报告审核', title: '供应商准入执行情况专项报告', owner: '赵敏', node: '主审复核', status: '审核不通过', route: '/report' },
]

const issueRanks = [
  { name: '采购与招投标管理', count: 21, trend: '+4' },
  { name: '资金支付与授权', count: 16, trend: '+2' },
  { name: '合同履约管理', count: 12, trend: '-1' },
  { name: '供应商准入评价', count: 9, trend: '+3' },
  { name: '整改佐证不完整', count: 7, trend: '0' },
  { name: '资产管理与盘点', count: 6, trend: '+1' },
  { name: '信息系统权限管理', count: 5, trend: '0' },
]

const news = [
  { title: '集团召开年度内控检查工作推进会', date: '2026-07-12', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80' },
  { title: '采购管理专项检查经验在系统内发布', date: '2026-07-10', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80' },
  { title: '内控监督部组织检查组业务培训', date: '2026-07-08', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80' },
]

const groupNews = [
  ['集团发布2026年下半年内控检查工作安排', '2026-07-12'],
  ['华北装备制造集团完成采购管理制度修订', '2026-07-11'],
  ['财务共享中心上线付款审批异常预警规则', '2026-07-09'],
  ['供应链管理部开展供应商准入专项自查', '2026-07-07'],
  ['内控监督部召开整改闭环专题会', '2026-07-05'],
]

const notices = [
  ['关于报送2026年二季度内控检查整改情况的通知', '2026-07-12'],
  ['关于开展采购围标风险专项检查的工作提示', '2026-07-10'],
  ['关于补充供应商准入资料的催办通知', '2026-07-08'],
  ['关于更新检查底稿模板及引用口径的公告', '2026-07-06'],
  ['内控检查管理系统例行维护公告', '2026-07-03'],
]

const statusTone = (status: string): Tone => {
  if (status.includes('不通过') || status.includes('逾期')) return 'red'
  if (status.includes('待') || status.includes('中')) return 'amber'
  if (status.includes('完成') || status.includes('通过') || status.includes('已')) return 'green'
  return 'blue'
}

function MoreButton() {
  return <button className="icm-home-more" type="button">查看更多</button>
}

function lineOption(labels: string[], planned: number[], actual: number[], plannedName = '计划目标', actualName = '实际完成') {
  return { tooltip: { trigger: 'axis' }, legend: { top: 0, right: 0, textStyle: { color: '#64748b', fontSize: 10 }, itemWidth: 10, itemHeight: 6 }, grid: { left: 28, right: 8, top: 30, bottom: 24, containLabel: true }, xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: '#dbe5f1' } }, axisLabel: { color: '#748299', fontSize: 10 } }, yAxis: { type: 'value', splitLine: { lineStyle: { color: '#edf2f8' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } }, series: [{ name: plannedName, type: 'line', smooth: true, data: planned, symbolSize: 5, lineStyle: { color: '#155bd4', width: 2 }, itemStyle: { color: '#155bd4' }, areaStyle: { color: 'rgba(21,91,212,.08)' } }, { name: actualName, type: 'line', smooth: true, data: actual, symbolSize: 5, lineStyle: { color: '#16a34a', width: 2 }, itemStyle: { color: '#16a34a' } }] }
}

function pieOption(value: number, label: string, color = '#155bd4') {
  return { title: { text: `${value}%`, subtext: label, left: 'center', top: '37%', textStyle: { color: '#0b1f43', fontSize: 26, fontWeight: 800 }, subtextStyle: { color: '#748299', fontSize: 11 } }, series: [{ type: 'pie', radius: ['62%', '78%'], center: ['50%', '53%'], label: { show: false }, data: [{ value, itemStyle: { color } }, { value: 100 - value, itemStyle: { color: '#e8eef7' } }] }] }
}

export default function Workplace() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<HomeTab>('all')
  const [slide, setSlide] = useState(0)
  const finishedRects = rectifications.filter((item) => item.lane === '已整改').length
  const rectRate = Math.round((finishedRects / Math.max(rectifications.length, 1)) * 100)
  const stats = [
    { label: '待处理', value: todoItems.filter((item) => item.status.includes('待') || item.status.includes('不通过')).length, note: '需当前用户处理', icon: Clock3, tone: 'amber' as Tone },
    { label: '我发起的', value: plans.length, note: '检查计划与专项抽查', icon: Send, tone: 'blue' as Tone },
    { label: '我处理的', value: tasks.filter((task) => task.status === '进行中').length, note: '执行中任务', icon: FileCheck2, tone: 'cyan' as Tone },
    { label: '我收到的', value: issues.length, note: '问题与整改事项', icon: Inbox, tone: 'green' as Tone },
  ]
  const shownNews = tab === 'group' ? groupNews : news.map((item) => [item.title, item.date])

  return (
    <PageFrame
      title="首页"
      subtitle="内控检查工作入口，集中查看资讯、待办、执行情况和整改进度。"
      actions={<><Button type="primary" onClick={() => navigate('/plan-workbench')}>新建检查计划</Button><Button type="primary-soft" onClick={() => navigate('/review-workbench')}>进入智能审查</Button></>}
    >
      <div className="icm-home-stat-grid">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div className={`icm-home-stat tone-${item.tone}`} key={item.label}>
              <span className="icm-home-stat-icon"><Icon size={24} /></span>
              <div><strong>{item.value}</strong><b>{item.label}</b><em>{item.note}</em></div>
            </div>
          )
        })}
      </div>

      <div className="icm-home-main-grid">
        <Card title="政企官网资讯" note="集团动态、业务资讯与流程待办">
          <div className="icm-home-tabs" role="tablist">
            {([
              ['all', '全部资讯'], ['group', '集团动态'], ['todo', '待办事项'], ['notice', '公告'],
            ] as const).map(([key, label]) => (
              <button className={tab === key ? 'active' : ''} type="button" key={key} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>

          {tab === 'todo' ? (
            <div className="icm-home-scroll">
              <DataTable
                columns={['事项类型', '摘要', '发起/责任', '当前节点', '状态', '操作']}
                rows={todoItems.map((item) => [
                  item.type, item.title, item.owner, item.node,
                  <Tag tone={statusTone(item.status)}>{item.status}</Tag>,
                  <button className="icm-link" type="button" onClick={() => navigate(item.route)}>处理</button>,
                ])}
              />
            </div>
          ) : tab === 'notice' ? (
            <div className="icm-home-scroll icm-home-text-list">
              {notices.map(([title, date]) => <div className="icm-home-text-row" key={title}><span><Megaphone size={15} />{title}</span><time>{date}</time></div>)}
              <MoreButton />
            </div>
          ) : (
            <div className="icm-home-news-layout">
              <div className="icm-home-carousel">
                <img src={news[slide].image} alt={news[slide].title} />
                <div className="icm-home-carousel-caption">{news[slide].title}</div>
                <div className="icm-home-carousel-dots">
                  {news.map((item, index) => <button aria-label={`第${index + 1}条资讯`} className={slide === index ? 'active' : ''} key={item.title} type="button" onClick={() => setSlide(index)} />)}
                </div>
              </div>
              <div className="icm-home-news-list">
                {shownNews.map(([title, date]) => <div className="icm-home-text-row" key={title}><span><Newspaper size={15} />{title}</span><time>{date}</time></div>)}
                <MoreButton />
              </div>
            </div>
          )}
        </Card>

        <Card title="问题排行" note="按内控领域汇总本期问题">
          <div className="icm-home-scroll icm-home-rank-list">
            {issueRanks.map((item, index) => (
              <div className="icm-list-row" key={item.name}>
                <div><div className="icm-list-title"><i className="icm-home-rank-no">{index + 1}</i>{item.name}</div><div className="icm-list-meta">问题数量 {item.count} · 较上期 {item.trend}</div></div>
                <Tag tone={index < 2 ? 'red' : index < 4 ? 'amber' : 'blue'}>{item.count}</Tag>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="icm-grid cols-4" style={{ marginTop: 12 }}>
        <Card title="月度执行情况" note="计划目标与实际完成"><ReactECharts style={{ height: 168 }} option={lineOption(['2月', '3月', '4月', '5月', '6月', '7月'], [18, 24, 31, 38, 46, 54], [15, 21, 26, 31, 39, 44])} /></Card>
        <Card title="全年执行情况" note="2026年内控检查执行趋势"><ReactECharts style={{ height: 168 }} option={lineOption(overview.trends.map((item) => item.month.slice(5)), overview.trends.map((item) => item.findings), overview.trends.map((item) => item.rectified), '问题发现', '完成整改')} /></Card>
        <Card title="计划执行完成率" note={`${tasks.length} 个任务包`}><ReactECharts style={{ height: 168 }} option={pieOption(58, '执行完成率')} /></Card>
        <Card title="问题整改情况" note={`${finishedRects}/${rectifications.length} 已整改`}><ReactECharts style={{ height: 168 }} option={pieOption(rectRate, '整改闭环率', '#16a34a')} /></Card>
      </div>

      <Toolbar>
        <ClipboardCheck size={15} /><span style={{ color: '#607089', fontSize: 12 }}>快捷入口</span>
        <Button type="default-soft" icon={<Send size={15} />} onClick={() => navigate('/plan-workbench')}>计划与派发</Button>
        <Button type="default-soft" icon={<Inbox size={15} />} onClick={() => navigate('/data-collect')}>材料采集</Button>
        <Button type="default-soft" icon={<UserCheck size={15} />} onClick={() => navigate('/audit-center')}>审核中心</Button>
        <Button type="default-soft" icon={<FileText size={15} />} onClick={() => navigate('/report')}>报告中心</Button>
        <span className="icm-toolbar-spacer" /><Tag tone="blue">{cockpit.alerts.length} 条实时预警</Tag>
      </Toolbar>
    </PageFrame>
  )
}