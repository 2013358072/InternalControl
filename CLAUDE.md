# CLAUDE.md

## 文件拆分

**禁止把所有代码写在一个文件里**。每个功能按结构拆分并告知用户：

- 新页面 → `src/pages/<模块名>/`（不要默认放 conv-agent），含 `index.tsx` + `components/` + `hooks/` + `types.ts`
- 页面超 500 行 → 抽 `hooks/useXxxPage.ts`
- 弹窗/表格/筛选栏 → `components/`，一个组件一个文件
- 类型 → `types.ts`，常量 → `constants.ts`

## 组件使用规范

**必须从 `@/components` 导入**，禁止用 `@heroui/react` 同名组件：

| 组件 | 例外/注意 |
|------|---------|
| `Button` | `type` 替代 HeroUI `variant`，`onClick` 替代 `onPress`，`loading` 替代 `isLoading`，`disabled` 替代 `isDisabled` |
| `Input` | **`onChange` 收 `string`，不是 event**；`search` 开启搜索模式 |
| `Textarea` | `onChange` 收 `string` |
| `Modal` | `open` + `onClose` + `title`/`children`/`footer` 三段式；`drawer` 右侧抽屉；自定义 title 加 `pr-8` 避开关闭按钮 |
| `SearchableSelect`、`DatePicker`、`DateRangePicker`、`TreeSelect`、`SliderBar`、`Tabs`、`Pagination`、`Spin`、`AiFab` | 直接用 |

**例外**（可用 HeroUI 或原生）：
- `toast` → `@heroui/react`
- `Spinner` → `@heroui/react`
- `<input type="file">` → 原生

## 主题 & 颜色

双主题：`:root` 蓝色默认 + `.theme-convagent` 紫色覆盖。变量文件在 `src/styles/themes/`。

Portal 弹窗跨主题：页面内 Modal 自动跟随（`useThemeClass()`），App 级全局弹窗需 preset 传 `themeClass`。

**禁止硬编码颜色值**，一律用 CSS 变量：

| 用途 | 变量 | 替代 |
|------|------|------|
| 主文字 | `--foreground` | `text-gray-900` |
| 次要/三级文字 | `--text-secondary` / `--text-tertiary` | `text-gray-500/400` |
| 卡片底色 | `--surface` | `bg-white` |
| 浅灰背景 | `--bg-soft` | `bg-gray-50` |
| 边框 | `--border` / `--border-light` | `border-gray-200` |
| 主题色 | `--accent` / `--accent-hover` / `--accent-soft` / `--accent-light` / `--accent-strong` / `--focus-ring` | — |
| 语义色 | `--success` / `--danger` / `--warning` / `--info` | — |

用法：`bg-(--surface)` `text-(--foreground)` `border-(--border)`

## 命名约定

| 类别 | 规则 | 示例 |
|------|------|------|
| 组件 | PascalCase，模块前缀 | `TaskTable`、`EditTaskModal` |
| Props 接口 | 组件名 + `Props` | `TaskTableProps` |
| 事件处理 | `handle` + 动作 | `handleSave`、`handleDelete` |
| 回调 prop | `on` + 事件 | `onClose`、`onSaved` |
| 状态 setter | `set` + 变量名 | `setSaving`、`setForm` |
| Hook | `use` 开头 | `useTaskPage`、`useThemeClass` |
| API 函数 | `get`/`post` + 资源 | `getOkrPmaTaskDetail` |
| 类型/接口 | PascalCase | `OkrPmaTaskRow` |
| 常量 | UPPER_SNAKE_CASE | `TASK_TYPES` |
| 工具函数 | camelCase | `normalizeTaskTypeRows` |

- 命名函数导出，不用 `export default`
- 接口用 `interface`，联合类型用 `type`
- 可选字段加 `?`，必填不加
- `import type` 单独写或 inline
- `/** */` 注释接口和导出函数

## Import 顺序

组间空行分隔：

```
1. React
2. 第三方（@heroui/react 等）
3. @/ 别名（api → components → pages → stores）
4. 类型导入
5. 相对路径
```

## API 调用

- 放 `src/api/`，命名 `getXxx` / `postXxx`
- 异步用 `try/catch/finally`，loading 在 `finally` 兜底

## 项目结构

```
src/
├── api/
├── components/          # @/components
├── pages/
│   ├── conv-agent/      # progress / task / action-items / overview / settings / risk / personnel
│   ├── dashboard/       # 控制台布局
│   ├── my-agents/       # 智能体列表 + 会话详情
│   ├── agent-store/     # 智能体商店
│   ├── account-info/    # 账户信息
│   └── login/
├── router/
├── stores/              # zustand
├── styles/themes/       # default.css + conv-agent.css
└── index.css
```
