# AGENTS.md

本文件是 Codex / AI 编码助手在本仓库内工作的强制规范。动手前先扫描相关目录和现有组件实现，优先沿用仓库已有模式，不要凭空新建一套风格。

## AI 项目知识读取

每次进行 coding、页面生成、样式调整、组件开发、重构或修复类任务前，必须先读取 `.ai/` 下的项目知识文件，再开始实现。

当前必须优先读取：

- `.ai/component-catalog.md`
- `.ai/skills/frontend-template-vibecoding.md`
- `.ai/skills/product-ui-designer.md`
- `.ai/skills/frontend-handoff-reviewer.md`

如果 `.ai/` 下新增文件，执行任务前先用 `find .ai -maxdepth 3 -type f | sort` 查看清单，并读取与当前任务相关的文件。设计类任务必须使用已安装的 Codex `frontend-design` skill；页面/组件生成类任务必须使用 `frontend-design` skill，并读取 `.ai/component-catalog.md` 和 `.ai/skills/frontend-template-vibecoding.md`。

## 项目概况

- 项目类型：Vite + React + TypeScript 前端模板
- 包管理：当前仓库已有 `package-lock.json`，默认使用 `npm`。
- 路径别名：`@/*` 指向 `src/*`。
- 主要入口：
  - 应用入口：`src/main.tsx`
  - 路由配置：`src/router/config.tsx`
  - 公共组件聚合导出：`src/components/index.ts`
  - 全局样式：`src/styles/index.css`
  - 主题变量：`src/styles/themes/default.css`、`src/styles/themes/conv-agent.css`

## 技术栈

以 `package.json` 为准，当前主要技术栈如下：

| 类别 | 技术/依赖 | 用途 |
| ---- | ---- | ---- |
| 构建工具 | `vite`、`@vitejs/plugin-react-swc` | 开发服务器、构建、React SWC 编译 |
| 前端框架 | `react`、`react-dom` | React 19 应用运行时 |
| 语言 | `typescript` | 类型系统与类型检查 |
| 路由 | `react-router-dom` | 页面路由与导航 |
| 样式 | `tailwindcss`、`@tailwindcss/vite`、`postcss`、`autoprefixer` | Tailwind CSS 4、CSS 变量主题、样式构建 |
| UI 底座 | `@heroui/react` | 底层 UI primitives；业务优先使用 `@/components` 封装 |
| 项目组件 | `src/components/*` | `Button`、`Input`、`Modal`、`Tabs`、`TreeSelect`、`AiFab` 等统一组件 |
| 图表 | `echarts`、`echarts-for-react`、`recharts` | 大屏、仪表盘、趋势图、分布图等数据可视化 |
| 状态管理 | `zustand` | 全局状态、用户态、UI 状态 |
| 网络请求 | `axios` | `src/api/index.js` 统一请求封装 |
| 动效 | `framer-motion` | 复杂交互或页面动效 |
| 图标 | `lucide-react` | 操作图标、状态图标、页面装饰图标 |
| 国际化 | `i18next`、`react-i18next`、`i18next-browser-languagedetector` | 多语言与语言检测 |
| 日期时间 | `dayjs` | 日期格式化和时间处理 |
| 表格/文件 | `xlsx` | Excel 读写 |
| 富文本/Markdown | `marked` | Markdown 渲染 |
| 拖拽排序 | `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities` | 拖拽和排序交互 |
| 工具库 | `copy-to-clipboard`、`uuid`、`pinyin-pro`、`jsencrypt` | 复制、ID、拼音、加密等工具能力 |
| 外部服务 SDK | `@supabase/supabase-js`、`firebase`、`@stripe/react-stripe-js` | Supabase、Firebase、Stripe 集成能力 |
| 工程质量 | `eslint`、`typescript-eslint`、`prettier`、`unplugin-auto-import` | Lint、格式化、自动导入类型 |

使用约束：

- UI 开发必须优先使用 `@/components`，不要直接使用 HeroUI 中已被封装的同名组件。
- 样式使用 Tailwind CSS 4 + CSS 变量，例如 `bg-(--surface)`、`text-(--foreground)`、`border-(--border)`。
- 图表优先使用 `echarts-for-react`；简单 React 原生图形或已有 Recharts 代码可继续沿用 `recharts`。
- 全局状态优先放 `src/stores/` 并使用 `zustand`；页面私有状态放页面 hook。
- API 请求统一走 `src/api/index.js` 的 Axios 封装，不要新建独立 Axios 实例。

## 产品设计规则

当用户、产品经理或需求描述中出现“设计一下”“生成设计方案”“页面风格”“视觉方案”“大屏方案”“UI 方案”等设计类请求时，必须遵守：

1. 先使用已安装的 Codex `frontend-design` skill，形成有辨识度的设计方向；不要直接按默认模板堆 UI。
2. 如果设计方案包含新的默认视觉方向、主色、语义色、背景、面板或主题基调，可按任务需要修改 `src/styles/themes/default.css` 或新增合适的主题 token。
3. 允许基于 `@/components` 通过 `className`、`inputGroupClassName` 等组件支持的样式入口做页面级二次视觉设计。
4. 二次样式优先使用 CSS 变量和 Tailwind 结构类；现有 token 不足时可以扩展主题 token。
5. 保持 `.theme-convagent` 独立，除非用户明确要求修改紫色主题。

`.ai/` 是本仓库给 AI 协作、vibecoding 和产品交接准备的项目知识库目录，不是 Codex 自动识别的特殊目录。Codex 是否读取其中内容，取决于 `AGENTS.md`、用户提示或相关脚本是否明确要求；因此关键规则必须写在 `AGENTS.md`。

## frontend-design Skill 使用方式

本机已安装全局 Codex skill：`frontend-design`，来源为 `anthropics/skills/skills/frontend-design`。如果新线程或重启后 skill 可用，遇到页面设计、页面生成、仪表盘、大屏、重要组件视觉升级任务时必须使用它。

用户可这样触发：

```text
使用 frontend-design skill，先确定设计风格，再结合本项目 @/components 生成页面。
```

Agent 执行顺序：

1. 触发并读取 `frontend-design` skill，先形成有辨识度的设计方向，避免模板化默认 UI。
2. 读取 `.ai/component-catalog.md` 和 `.ai/skills/frontend-template-vibecoding.md`，把设计落到项目组件体系。
3. 必要时先修改 `src/styles/themes/default.css` 的主题变量或新增合适 token，再写页面代码。
4. 实现时优先使用适合当前场景的项目组件；允许通过 `className`、`inputGroupClassName` 等组件支持的样式入口做二次视觉设计。
5. 二次样式使用 CSS 变量和 Tailwind 结构类，避免在 JSX 中散落不可维护的硬编码颜色。
6. 完成后按任务范围运行 `npm run vibecoding:check`、`npm run type-check`、`npm run lint`，并说明结果。

## 常用命令

```bash
npm run dev
npm run build
npm run test
npm run live
npm run preview
npm run type-check
npm run lint
npm run vibecoding:check
npm run format:check
```

交付前优先执行：

```bash
npm run vibecoding:check
npm run type-check
npm run lint
```

如只改文档，可说明未运行构建类命令。

## 当前目录结构

```text
src/
├── api/                 # Axios 封装与业务 API
├── assets/              # 静态资源
├── components/          # 公共组件库，统一从 @/components 引入
├── i18n/                # 国际化
├── pages/               # 页面模块
│   ├── home/
│   ├── login/
│   └── NotFound.tsx
├── router/              # React Router 配置
├── stores/              # zustand 状态
├── styles/              # 全局样式与主题变量
└── utils/               # 通用工具
```

仓库里可能存在 README 或历史 AI 规则提到尚未落地的业务目录。新增代码时以当前 `src/` 实际结构为准；新增页面放到 `src/pages/<模块名>/`，不要默认放到不存在或无关的业务目录。

## 文件拆分

禁止把所有代码写在一个文件里。每个功能按结构拆分，并在交付说明中告知用户主要文件：

- 新页面：`src/pages/<模块名>/index.tsx`，复杂页面同时创建 `components/`、`hooks/`、`types.ts`，需要常量时加 `constants.ts`。
- 页面超过 500 行：抽到 `hooks/useXxxPage.ts` 和局部组件。
- 弹窗、表格、筛选栏、工具栏：放进当前页面模块的 `components/`，一个组件一个文件。
- 类型：页面私有类型放页面目录 `types.ts`；跨模块共享类型放合适的共享位置。
- 常量：放 `constants.ts`，常量名使用 `UPPER_SNAKE_CASE`。
- API：放 `src/api/`，业务函数命名 `getXxx`、`postXxx`、`putXxx`、`delXxx`。

## 组件使用规范

必须优先从 `@/components` 导入公共组件，禁止直接使用 `@heroui/react` 的同名基础组件，也不要手写同类原生控件替代封装组件。

```tsx
import { Button, Input, Modal, Textarea } from '@/components'
```

| 组件 | 约定 |
| ---- | ---- |
| `Button` | 使用 `type`，不要用 HeroUI `variant`；使用 `onClick`，不要用 `onPress`；使用 `loading` / `disabled` |
| `Input` | `onChange` 参数是 `string`，不是 event；搜索框用 `search` |
| `Textarea` | `onChange` 参数是 `string` |
| `Modal` | 使用 `open` + `onClose` + `title` / `children` / `footer`；自定义标题区域注意给关闭按钮留出右侧空间 |
| `SearchableSelect`、`DatePicker`、`DateRangePicker`、`TreeSelect`、`SliderBar`、`Tabs`、`Pagination`、`Spin`、`AiFab`、`Tree` | 直接从 `@/components` 引入 |

例外：

- `toast` 可从 `@heroui/react` 使用。
- `Spinner` 可从 `@heroui/react` 使用。
- 文件上传可使用原生 `<input type="file">`。

组件 API 以各组件目录下的 `README.md` 和 `src/components/index.ts` 导出为准。新增组件需要同步聚合导出，并尽量补充简短 README 或 demo。

## 主题与颜色

项目使用 CSS 变量 + class 级联实现主题：

- 默认主题：`:root`，蓝色主色。
- 紫色主题：`.theme-convagent`，变量文件在 `src/styles/themes/conv-agent.css`。
- 全局样式入口：`src/styles/index.css`。

禁止在业务 UI 中硬编码颜色值或 Tailwind 灰阶色，优先使用 CSS 变量：

| 用途 | 变量 | 避免 |
| ---- | ---- | ---- |
| 主文字 | `--foreground` | `text-gray-900` |
| 次要文字 | `--text-secondary` | `text-gray-500` |
| 三级文字 | `--text-tertiary` | `text-gray-400` |
| 卡片/弹窗底色 | `--surface` | `bg-white` |
| 浅背景 | `--bg-soft` | `bg-gray-50` |
| hover 背景 | `--bg-hover` | 硬编码 rgba |
| 边框 | `--border` / `--border-light` | `border-gray-200` |
| 主题色 | `--accent` / `--accent-hover` / `--accent-soft` / `--accent-light` / `--accent-strong` / `--focus-ring` | 硬编码蓝紫色 |
| 语义色 | `--success` / `--danger` / `--warning` / `--info` | 随手写色值 |

推荐写法：

```tsx
<div className="bg-(--surface) text-(--foreground) border border-(--border)" />
<Button className="bg-(--accent) hover:bg-(--accent-hover)">保存</Button>
```

Portal 弹窗跨主题时，页面内公共 `Modal` 已通过 `ThemeClassContext` / `useThemeClass()` 处理；App 级全局弹窗需要在 preset 中传 `themeClass`。

## 路由规范

路由集中在 `src/router/config.tsx`：

- 页面组件使用 `lazy(() => import(...))`。
- `RouteObject` 的 `element` 必须写 JSX，例如 `{ path: '/login', element: <Login /> }`。
- 新页面要补充路由，并确认 `npm run lint` 中的本地路由规则通过。
- 页面目录默认导出当前路由入口组件，以匹配现有 lazy import 写法。

## API 调用

`src/api/index.js` 已封装 Axios 实例、拦截器、Token 刷新、错误 Toast 和取消请求。

- 业务 API 文件只从 `src/api/index.js` 或 `@/api` 引入 `get` / `post` / `put` / `del`。
- 请求路径不要重复加 `/api` 前缀，封装内已有 `baseURL: '/api'`。
- 成功响应已经返回 `response.data`，业务侧拿到的是后端 JSON 根对象，不是 Axios response。
- 异步 UI 操作使用 `try/catch/finally`，loading 必须在 `finally` 兜底恢复。
- 需要取消请求时使用 `AbortController` 或 `cancelAllRequests`，不要另建 Axios 实例。

## 状态与副作用

- 全局状态使用 `zustand`，放在 `src/stores/`。
- 页面内部状态优先放页面组件或页面 hook；共享后再提升到 store。
- 请求、表单提交、批量操作等副作用集中在 hook 或清晰命名的 handler 中。
- 复杂页面优先抽 `useXxxPage`，让 `index.tsx` 负责组装布局。

## 命名约定

| 类别 | 规则 | 示例 |
| ---- | ---- | ---- |
| 组件 | PascalCase，尽量带模块语义 | `TaskTable`、`LoginCard` |
| Props 接口 | 组件名 + `Props` | `TaskTableProps` |
| 事件处理 | `handle` + 动作 | `handleSave`、`handleDelete` |
| 回调 prop | `on` + 事件 | `onClose`、`onSaved` |
| 状态 setter | `set` + 变量名 | `setSaving`、`setForm` |
| Hook | `use` 开头 | `useLogin`、`useThemeClass` |
| API 函数 | 动词 + 资源 | `getUserInfo`、`postLogin` |
| 类型/接口 | PascalCase | `LoginForm` |
| 常量 | UPPER_SNAKE_CASE | `LOGIN_TABS` |
| 工具函数 | camelCase | `normalizeOptions` |

代码风格：

- 优先使用命名导出；路由页面入口可保留默认导出以匹配现有 lazy import。
- 接口使用 `interface`，联合类型使用 `type`。
- 类型导入使用 `import type`。
- 导出函数和关键接口可加简短 `/** */` 注释，避免无意义注释。

## Import 顺序

组间空行分隔：

```text
1. React
2. 第三方库
3. @/ 别名导入，按 api → components → pages → stores → utils 大致排序
4. 类型导入
5. 相对路径
```

示例：

```tsx
import { useMemo } from 'react'
import { toast } from '@heroui/react'

import { postLogin } from '@/api/AuthAPI'
import { Button, Input } from '@/components'
import { useUserStore } from '@/stores'

import type { LoginForm } from './types'
import { LOGIN_DEFAULT_FORM } from './constants'
```

## 样式与交互

- Tailwind CSS 4 写法可使用 `bg-(--surface)`、`text-(--foreground)`、`border-(--border)`。
- 不要把操作型后台页面做成营销落地页；优先信息密度、可扫描性、稳定布局。
- 按钮使用图标时优先用 `lucide-react`，不要手写已有图标。
- 固定格式控件要有稳定尺寸，避免 hover、loading、长文本导致布局跳动。
- 文本不能溢出按钮、表格单元格、卡片和弹窗；必要时使用换行、截断或响应式布局。

## i18n

仓库已有 `src/i18n/` 与 `react-i18next`。新增用户可见文案时，先查看现有页面做法；如果所在模块已有国际化结构，按现有 key 组织补充，不要混用多套方案。

## 质量检查

完成代码变更后，根据改动范围运行：

- `npm run vibecoding:check`：检查常见 AI 生成问题。
- `npm run type-check`：TypeScript 类型检查。
- `npm run lint`：ESLint，包括路由 JSX 规则。
- `npm run build` 或 `npm run test`：涉及构建、路由、主题、组件导出时建议运行。

若命令因环境、依赖或权限失败，在最终说明中写清楚失败命令和原因。

## Git 与工作区

- 不要回滚用户已有改动。
- 不要运行破坏性命令，例如 `git reset --hard`、`git checkout --`、未确认的批量删除。
- 修改前先查看相关文件，修改后用 `git diff` 或等价方式自查。
- 只改与任务相关的文件，避免格式化整个仓库造成无关噪音。
