import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, ClipboardList, FileCheck2, Send, ShieldCheck, TriangleAlert, UsersRound } from 'lucide-react'

import { Input, Tabs } from '@/components'
import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { overview, plans, toneByStatus } from '../data'
import { useTaskDispatchStore } from '../store/taskDispatchStore'

type TaskStatus = '全部状态' | '待启动' | '进行中' | '待复核' | '已完成' | '已归档'
type TaskType = '全部类型' | '检查任务' | '取证任务'

const lifecycle = ['待启动', '进行中', '待复核', '已完成', '已归档']

export default function TaskCenter() {
  const navigate = useNavigate()
  const taskItems = useTaskDispatchStore((state) => state.tasks)
  const addTask = useTaskDispatchStore((state) => state.addTask)
  const [selectedTaskId, setSelectedTaskId] = useState('TK-001')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<TaskStatus>('全部状态')
  const [taskType, setTaskType] = useState<TaskType>('全部类型')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskType, setNewTaskType] = useState<TaskType>('检查任务')

  const selectedTask = taskItems.find((item) => item.id === selectedTaskId) ?? taskItems[0]
  const filteredTasks = useMemo(() => taskItems.filter((item) => {
    const matchesKeyword = !keyword.trim() || `${item.id}${item.name}${item.unit}${item.owner}`.includes(keyword.trim())
    const matchesStatus = status === '全部状态' || item.status === status
    const matchesType = taskType === '全部类型' || item.type === taskType
    return matchesKeyword && matchesStatus && matchesType
  }), [keyword, status, taskItems, taskType])

  const runningCount = taskItems.filter((item) => item.status === '进行中').length
  const reviewCount = taskItems.filter((item) => item.status === '待复核').length
  const blockerCount = taskItems.filter((item) => item.blockers.length > 0).length
  const averageProgress = Math.round(taskItems.reduce((total, item) => total + item.progress, 0) / Math.max(taskItems.length, 1))
  const plan = plans[0]

  const createTask = () => {
    const name = newTaskName.trim()
    if (!name) return
    const item = {
      id: `TK-${String(taskItems.length + 1).padStart(3, '0')}`,
      type: newTaskType === '全部类型' ? '检查任务' : newTaskType,
      name,
      unit: overview.unit,
      owner: '待分配',
      reviewer: '待指定',
      start: '待排期',
      end: '待排期',
      status: '待启动',
      progress: 0,
      outputs: ['检查任务书'],
      blockers: [],
    }
    addTask(item)
    setSelectedTaskId(item.id)
    setNewTaskName('')
    setNewTaskType('检查任务')
    setShowCreateTask(false)
  }

  if (!selectedTask || !plan) return null

  return (
    <PageFrame
      title="检查任务中心"
      subtitle="统一管理检查计划、任务分解、资源协调、进场安排和任务关闭校验。"
      actions={<><Button type="primary" icon={<ClipboardList size={15} />} onClick={() => navigate('/plan-workbench?view=fill')}>新建计划</Button><Button type="primary-soft" icon={<CalendarClock size={15} />} onClick={() => setShowCreateTask(true)}>新建任务</Button></>}
    >
      <Toolbar>
        <Input search className="min-w-[260px]" value={keyword} onChange={setKeyword} placeholder="搜索任务编号、任务名称、受检单位或负责人" />
        <select className="icm-select" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}><option>全部状态</option><option>待启动</option><option>进行中</option><option>待复核</option><option>已完成</option><option>已归档</option></select>
        <select className="icm-select" value={taskType} onChange={(event) => setTaskType(event.target.value as TaskType)}><option>全部类型</option><option>检查任务</option><option>取证任务</option></select>
        <span className="icm-toolbar-spacer" />
        <Tag tone="blue">计划：{plan.id}</Tag>
      </Toolbar>

      <div className="icm-grid cols-4" style={{ marginBottom: 12 }}>
        <Kpi value={taskItems.length.toString()} label="检查任务" note="当前计划下任务总数" tone="blue" />
        <Kpi value={runningCount.toString()} label="执行中" note="已进入检查阶段" tone="green" />
        <Kpi value={reviewCount.toString()} label="待复核" note="需复核人处理" tone="amber" />
        <Kpi value={`${averageProgress}%`} label="总体进度" note={`${blockerCount} 项存在推进阻塞`} tone={blockerCount ? 'amber' : 'green'} />
      </div>

      {showCreateTask ? <Card title="新建检查任务" note="任务创建后需完成检查小组、任务书和资料需求配置。穿行测试在任务执行中按检查要点发起。" action={<button className="icm-link" type="button" onClick={() => setShowCreateTask(false)}>取消</button>}><div className="icm-task-create"><Input value={newTaskName} onChange={setNewTaskName} placeholder="输入任务名称" /><select className="icm-select" value={newTaskType} onChange={(event) => setNewTaskType(event.target.value as TaskType)}><option>检查任务</option><option>取证任务</option></select><Button type="primary" onClick={createTask}>创建任务</Button></div></Card> : null}

      <div className="icm-task-center-layout">
        <Card title="计划与任务" note="按计划下钻查看任务状态。">
          <div className="icm-task-plan-node"><div className="icm-task-plan-head"><span className="icm-task-plan-icon"><ClipboardList size={16} /></span><div><strong>{plan.name}</strong><span>{plan.id} · {plan.type}</span></div><Tag tone={toneByStatus(plan.status) as Tone}>{plan.status}</Tag></div><div className="icm-task-plan-children">{filteredTasks.map((item) => <button className={`icm-task-node ${item.id === selectedTask.id ? 'active' : ''}`} key={item.id} type="button" onClick={() => setSelectedTaskId(item.id)}><span className="icm-task-node-dot" /><span><strong>{item.name}</strong><em>{item.type} · {item.owner}</em></span><Tag tone={toneByStatus(item.status) as Tone}>{item.status}</Tag></button>)}{!filteredTasks.length ? <div className="icm-empty-inline">未找到符合条件的任务</div> : null}</div></div>
        </Card>

        <Card title="任务执行与进度" note="总览与进度排程共用当前计划任务；派发和进场请在任务派发进场页面办理。">
          <Tabs size="sm" defaultActiveKey="overview" items={[
            { key: 'overview', label: '任务总览', children: <DataTable columns={['任务', '负责人', '起止时间', '状态', '进度', '阻塞事项']} rows={filteredTasks.map((item) => [<button className="icm-link" type="button" onClick={() => setSelectedTaskId(item.id)}>{item.name}</button>, item.owner, `${item.start} 至 ${item.end}`, <Tag tone={toneByStatus(item.status) as Tone}>{item.status}</Tag>, `${item.progress}%`, item.blockers.length ? <span className="icm-text-warn">{item.blockers.join('；')}</span> : '无'])} /> },
            { key: 'gantt', label: '进度排程', children: <div className="icm-task-gantt">{filteredTasks.map((item, index) => <div className="icm-task-gantt-row" key={item.id}><button type="button" onClick={() => setSelectedTaskId(item.id)}>{item.name}</button><div className="icm-task-gantt-track"><span style={{ width: `${Math.max(8, item.progress - index * 4)}%` }} /></div><b>{item.progress}%</b></div>)}</div> },
          ]} />
        </Card>

        <div className="icm-task-detail-column">
          <Card title="任务详情" note={selectedTask.id} action={<Tag tone={toneByStatus(selectedTask.status) as Tone}>{selectedTask.status}</Tag>}>
            <DetailLine label="任务类型" value={selectedTask.type} />
            <DetailLine label="受检单位" value={selectedTask.unit} />
            <DetailLine label="检查期间" value={`${selectedTask.start} 至 ${selectedTask.end}`} />
            <DetailLine label="检查负责人" value={selectedTask.owner} />
            <DetailLine label="复核人" value={selectedTask.reviewer} />
            <DetailLine label="预期输出" value={selectedTask.outputs.join(' / ')} />
            <div className="icm-task-lifecycle">{lifecycle.map((item) => <span className={lifecycle.indexOf(item) <= lifecycle.indexOf(selectedTask.status) ? 'done' : ''} key={item}>{item}</span>)}</div>
            <div className="icm-actions" style={{ marginTop: 12 }}><Button type="primary" icon={<Send size={14} />} onClick={() => navigate(`/dispatch-center?task=${selectedTask.id}`)}>任务派发</Button><Button type="primary-soft" icon={<FileCheck2 size={14} />} onClick={() => navigate('/review-workbench?view=execute')}>进入审查</Button><Button type="default-soft" onClick={() => navigate('/walkthrough-workbench')}>发起穿行测试</Button></div>
          </Card>
          <Card title="资源与合规校验" note="任务派发前、关闭前的控制要求。">
            <div className="icm-task-check-list"><div><span className="icm-task-check-icon pass"><ShieldCheck size={15} /></span><p><strong>回避校验</strong><em>检查人员近 3 年未检查同一单位同一领域。</em></p><Tag tone="green">通过</Tag></div><div><span className="icm-task-check-icon pass"><UsersRound size={15} /></span><p><strong>检查小组</strong><em>计划发布后 2 个工作日内已完成组建。</em></p><Tag tone="green">已组建</Tag></div><div><span className={`icm-task-check-icon ${selectedTask.blockers.length ? 'warn' : 'pass'}`}>{selectedTask.blockers.length ? <TriangleAlert size={15} /> : <ShieldCheck size={15} />}</span><p><strong>任务阻塞</strong><em>{selectedTask.blockers.length ? selectedTask.blockers.join('；') : '无阻塞事项。'}</em></p><Tag tone={selectedTask.blockers.length ? 'amber' : 'green'}>{selectedTask.blockers.length ? '需跟踪' : '正常'}</Tag></div></div>
            <div className="icm-task-close-rule">关闭校验：底稿、取证、问题转化及整改状态回写完成后，方可提交任务归档。</div>
          </Card>
        </div>
      </div>
    </PageFrame>
  )
}
