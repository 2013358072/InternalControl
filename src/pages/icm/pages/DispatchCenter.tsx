import { Input, Textarea } from '@/components'
import { Card, DataTable, DetailLine, PageFrame, StepList, Tag, Toolbar, Button, type Tone } from '../components/IcmPageKit'
import { dispatch, overview, tasks, toneByStatus } from '../data'

const resourceRows = dispatch.team.map((item, index) => [
  item,
  index === 0 ? '检查组长 / 采购合同' : index === 1 ? '合同核验 / 穿行测试' : index === 2 ? '资金取数 / 数据校验' : '招采合规 / 外部专家',
  `${62 + index * 8}%`,
  index === 3 ? '保密协议已确认' : '无回避冲突',
])

export default function DispatchCenter() {
  return (
    <PageFrame
      title="任务派发进场"
      subtitle="从任务拆分进入派发排程，完成检查组资源协调、资料清单下发和进场管理。"
      actions={<><Button type="primary">确认派发</Button><Button type="warn-soft">生成进场通知</Button></>}
    >
      <Toolbar>
        <Input search className="min-w-[260px]" placeholder="搜索任务 / 检查组 / 资料" />
        <Button type="primary-soft">推荐检查组</Button>
        <Button type="info-soft">同步数据需求</Button>
        <Tag tone="green">党委前置通过</Tag>
      </Toolbar>

      <div className="icm-grid" style={{ gridTemplateColumns: '27% minmax(0,1fr) 30%' }}>
        <Card title="左：任务拆分" note="按计划拆出检查、穿行测试、取证任务">
          <div className="icm-list">
            {tasks.map((task) => (
              <div className="icm-list-row" key={task.id}>
                <div>
                  <div className="icm-list-title">{task.name}</div>
                  <div className="icm-list-meta">{task.id} · {task.type}<br />{task.start} ~ {task.end}</div>
                </div>
                <Tag tone={toneByStatus(task.status) as Tone}>{task.status}</Tag>
              </div>
            ))}
          </div>
          <DetailLine label="关联计划" value={overview.planName} />
        </Card>

        <Card title="中：派发与资源协调" note="人员能力、工作量、回避提示、资料需求">
          <DataTable columns={['成员', '角色/标签', '负荷', '回避提示']} rows={resourceRows} />
          <div style={{ marginTop: 12 }}>
            <DataTable
              columns={['资料需求', '责任部门', '派发动作']}
              rows={dispatch.materials.map((item, index) => [
                item,
                ['采购部', '招采中心', '供应链管理部', '财务部', '仓储管理部'][index],
                <Tag tone={index === 2 ? 'amber' : 'green'}>{index === 2 ? '需补充字段' : '已纳入清单'}</Tag>,
              ])}
            />
          </div>
        </Card>

        <Card title="右：进场管理" note="通知、会议、权限、资料闭环">
          <StepList steps={dispatch.entries.map((entry) => ({ title: `${entry.item} · ${entry.status}`, text: entry.owner }))} />
          <Textarea
            rows={4}
            defaultValue="进场说明：检查组将围绕采购到付款链条开展资料调阅、访谈和系统取数，受检单位需在 2 个工作日内确认资料联系人。"
          />
          <DetailLine label="进场状态" value={<Tag tone="green">已确认</Tag>} />
        </Card>
      </div>
    </PageFrame>
  )
}
