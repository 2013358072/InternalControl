import { Input, Tabs } from '@/components'
import { Card, DataTable, DetailLine, PageFrame, Tag, Toolbar, Button, type Tone } from '../components/IcmPageKit'
import { overview, plans, tasks, toneByStatus } from '../data'

export default function TaskCenter() {
  const activeTask = tasks[0]

  return (
    <PageFrame
      title="检查任务中心"
      subtitle="集中呈现计划/任务树、甘特排程、任务列表、详情信息和审批节点。"
      actions={<><Button type="primary">新建计划</Button><Button type="primary-soft">新建任务</Button></>}
    >
      <Toolbar>
        <Input search className="min-w-[260px]" placeholder="筛选任务状态 / 单位 / 时间" />
        <select className="icm-select"><option>全部状态</option><option>进行中</option><option>待复核</option></select>
        <Tag tone="blue">{overview.taskId}</Tag>
      </Toolbar>

      <div className="icm-grid" style={{ gridTemplateColumns: '24% minmax(0,1fr) 28%' }}>
        <Card title="计划 / 任务树" note="计划下钻到任务包">
          {plans.map((plan) => (
            <div key={plan.id}>
              <div className="icm-list-title">{plan.name}</div>
              <div className="icm-list-meta">{plan.id} · {plan.unit}</div>
              {tasks.map((task) => (
                <div className="icm-step" key={task.id}>
                  <div className="icm-step-no">{task.id.slice(-1)}</div>
                  <div>
                    <div className="icm-list-title">{task.name}</div>
                    <div className="icm-list-meta">{task.type} · {task.owner}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Card>

        <Card title="甘特 / 列表" note="视图切换保留同一任务数据">
          <Tabs
            size="sm"
            defaultActiveKey="gantt"
            items={[
              {
                key: 'gantt',
                label: '甘特',
                children: (
                  <div>
                    {tasks.map((task, index) => (
                      <div className="bar-row" key={task.id} style={{ gridTemplateColumns: '150px minmax(0,1fr) 48px' }}>
                        <span>{task.name}</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${Math.max(24, task.progress - index * 8)}%` }} />
                        </div>
                        <b>{task.progress}%</b>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'list',
                label: '列表',
                children: (
                  <DataTable
                    columns={['任务', '单位', '负责人', '起止', '状态', '进度']}
                    rows={tasks.map((task) => [
                      task.name,
                      task.unit,
                      task.owner,
                      `${task.start} ~ ${task.end}`,
                      <Tag tone={toneByStatus(task.status) as Tone}>{task.status}</Tag>,
                      `${task.progress}%`,
                    ])}
                  />
                ),
              },
            ]}
          />
        </Card>

        <Card title="任务详情与审批节点" note="选中任务：采购与合同专项检查">
          <DetailLine label="当前任务" value={activeTask.name} />
          <DetailLine label="受检单位" value={activeTask.unit} />
          <DetailLine label="检查范围" value={overview.scope} />
          <DetailLine label="负责人" value={activeTask.owner} />
          <DetailLine label="党委前置" value={<Tag tone="green">通过</Tag>} />
          <DetailLine label="派发节点" value={<Tag tone="green">已派发</Tag>} />
          <DetailLine label="复核节点" value={<Tag tone="amber">等待材料补充</Tag>} />
          <DetailLine label="关闭校验" value="底稿、证据、问题和整改回写后方可关闭。" />
        </Card>
      </div>
    </PageFrame>
  )
}
