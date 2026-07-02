import { Textarea } from '@/components'
import { Card, DataTable, DetailLine, PageFrame, StepList, Tag, Button, type Tone } from '../components/IcmPageKit'
import { walkthrough, toneByStatus } from '../data'

export default function WalkthroughWorkbench() {
  const abnormalNodes = walkthrough.filter((item) => item.result === '异常')

  return (
    <PageFrame
      title="穿行测试工作台"
      subtitle="以采购到付款流程为对象，逐节点验证控制点设计与执行，形成样本测试结论。"
      actions={<><Button type="primary">生成测试结论</Button><Button type="warn-soft">转取证单</Button></>}
    >
      <div className="icm-grid" style={{ gridTemplateColumns: '24% minmax(0,1fr) 28%' }}>
        <Card title="采购到付款流程节点" note="需求、招标、供应商、合同、付款全链路">
          <StepList steps={walkthrough.map((item) => ({ title: item.node, text: `${item.type}控制 · ${item.result} · ${item.evidence}` }))} />
        </Card>

        <Card title="控制点样本测试" note="抽样记录、控制点、佐证资料和执行结论">
          <DataTable
            columns={['流程节点', '关键控制点', '控制类型', '样本资料', '测试结论']}
            rows={walkthrough.map((item) => [
              item.node,
              item.control,
              item.type,
              item.evidence,
              <Tag tone={toneByStatus(item.result) as Tone}>{item.result}</Tag>,
            ])}
          />
          <div style={{ marginTop: 12 }}>
            <DataTable
              columns={['样本编号', '合同/事项', '金额', '抽样原因']}
              rows={[
                ['S-HT-1182', '工程物资采购合同', '390 万', '金额接近公开招标线'],
                ['S-HT-1183', '同类物资补充合同', '395 万', '同供应商短期连续签订'],
                ['S-PAY-0620', '预付款审批单', '620 万', '付款比例高于合同约定'],
              ]}
            />
          </div>
        </Card>

        <Card title="测试结论" note="异常节点转取证，关注节点入底稿说明">
          <DetailLine label="异常节点" value={`${abnormalNodes.length} 个`} />
          <DetailLine label="控制评价" value={<Tag tone="amber">部分控制执行不足</Tag>} />
          <DetailLine label="输出联动" value="异常节点生成取证单草稿，关注节点进入底稿说明。" />
          <Textarea
            rows={6}
            defaultValue="结论摘要：采购包划分依据、合同金额一致性和付款比例控制存在执行偏差；建议补充招标方案审批表、合同正本和付款审批单原始记录。"
          />
          <Button type="primary" fullWidth>保存测试结论</Button>
        </Card>
      </div>
    </PageFrame>
  )
}
