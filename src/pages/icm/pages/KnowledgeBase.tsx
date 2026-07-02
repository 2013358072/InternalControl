import { useState, type ReactNode } from 'react'
import { ClipboardList, DatabaseZap, FileInput, ShieldAlert } from 'lucide-react'

import { Input } from '@/components'
import { Button, Card, DataTable, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { knowledge, toneByStatus } from '../data'

type AssetKey = 'case' | 'template' | 'method'

const assets: Array<{ key: AssetKey; title: string; text: string; icon: ReactNode }> = [
  { key: 'case', title: '检查案例库', text: '底稿/问题回流，一键生成案例，配置相似案例匹配', icon: <ShieldAlert size={16} /> },
  { key: 'template', title: '制度模板库', text: '制度模板上传、版本管理、下载复用', icon: <FileInput size={16} /> },
  { key: 'method', title: '检查方法库', text: '检查程序、适用场景、输出物和模板绑定', icon: <ClipboardList size={16} /> },
]

export default function KnowledgeBase() {
  const [active, setActive] = useState<AssetKey>('case')
  const [query, setQuery] = useState('')

  const filteredCases = knowledge.cases.filter((item) => `${item.title}${item.riskType}${item.issuePattern}${item.tags.join('')}`.includes(query.trim()))
  const filteredTemplates = knowledge.templates.filter((item) => `${item.name}${item.type}${item.domain}${item.reuse}`.includes(query.trim()))
  const filteredMethods = knowledge.methods.filter((item) => `${item.name}${item.scenario}${item.output}`.includes(query.trim()))

  const renderMain = () => {
    if (active === 'case') {
      return (
        <Card title="检查案例库" note="各业务模块回流底稿和问题，一键沉淀同类案例" action={<Button type="info-soft" size="sm">生成案例</Button>}>
          <DataTable
            columns={['案例', '风险类型', '问题表现', '结果', '方法']}
            rows={filteredCases.map((item) => [
              <div>
                <div className="icm-list-title">{item.title}</div>
                <div className="icm-list-meta">{item.sourceModule} · {item.tags.join(' / ')}</div>
              </div>,
              <Tag tone={toneByStatus(item.level) as Tone}>{item.riskType}</Tag>,
              item.issuePattern,
              item.result,
              item.generatedMethod,
            ])}
          />
        </Card>
      )
    }

    if (active === 'template') {
      return (
        <Card title="制度模板库" note="模板上传、版本管理、下载复用" action={<Button type="info-soft" size="sm">上传模板</Button>}>
          <DataTable
            columns={['模板', '类型', '版本', '领域', '绑定依据', '复用模块']}
            rows={filteredTemplates.map((item) => [item.name, item.type, item.version, item.domain, item.bindClause, item.reuse])}
          />
        </Card>
      )
    }

    if (active === 'method') {
      return (
        <Card title="检查方法库" note="检查方法与模板、法规、案例组合使用" action={<Button type="info-soft" size="sm">新增方法</Button>}>
          <DataTable
            columns={['方法', '适用场景', '步骤', '输出', '绑定模板']}
            rows={filteredMethods.map((item) => [item.name, item.scenario, item.steps, item.output, item.bindTemplate])}
          />
        </Card>
      )
    }

    return null
  }

  return (
    <PageFrame
      title="知识库管理"
      subtitle="一期聚焦案例、制度模板和检查方法维护；法规库维护暂不纳入一期后台。"
      actions={<Button type="primary" icon={<DatabaseZap size={16} />}>录入知识</Button>}
    >
      <Toolbar>
        <Input search className="min-w-[320px]" value={query} onChange={setQuery} placeholder="检索案例、模板、检查方法" />
        <Tag tone="blue">知识库后台管理首页</Tag>
      </Toolbar>

      <div className="icm-grid" style={{ gridTemplateColumns: '260px minmax(0,1fr)' }}>
        <aside className="icm-admin-nav">
          <div className="icm-admin-nav-title">知识库后台管理首页</div>
          <div className="icm-admin-nav-sub">选择资产类型后在中间维护数据</div>
          <div className="icm-admin-nav-list">
            {assets.map((item) => (
              <button className={active === item.key ? 'active' : ''} key={item.key} onClick={() => setActive(item.key)}>
                {item.icon}
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="icm-grid">
          {renderMain()}
        </div>
      </div>
    </PageFrame>
  )
}
