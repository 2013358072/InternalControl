import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, ChevronRight, Search, UserRound } from 'lucide-react'

import { defaultRoute, getRouteMeta, icmRoutes } from './routeMeta'
import './AppShell.css'

export default function AppShell() {
  const location = useLocation()
  const meta = getRouteMeta(location.pathname === '/' ? defaultRoute : location.pathname)

  return (
    <div className="icm-app">
      <header className="icm-top">
        <div className="icm-brand">
          <div className="icm-brand-mark">IC</div>
          <div>
            <div className="icm-brand-title">央国企内控检查管理系统</div>
            <div className="icm-brand-sub">采购围标专项检查闭环原型</div>
          </div>
        </div>
        <div className="icm-search">
          <Search size={16} />
          搜索计划、数据包、线索、底稿、问题、整改
        </div>
        <div className="icm-top-actions">
          <span className="icm-role">
            <UserRound size={15} />
            检查组长
          </span>
          <span className="icm-badge">待办 6</span>
          <Bell size={17} />
        </div>
      </header>

      <nav className="icm-nav">
        {icmRoutes.map((route, index) => {
          const Icon = route.icon
          return (
            <NavLink
              className={({ isActive }) => `icm-stage-link ${isActive ? 'active' : ''}`}
              key={route.path}
              to={route.path}
            >
              <span className="icm-stage-index">{index + 1}</span>
              <Icon size={16} />
              {route.title}
            </NavLink>
          )
        })}
        <div className="icm-breadcrumb">
          <span>{meta.categoryName}</span>
          <ChevronRight size={14} />
          <strong>{meta.title}</strong>
        </div>
      </nav>

      <div className="icm-body">
        <main className="icm-main">
          <Outlet />
        </main>
      </div>

      <footer className="icm-foot">
        <span>当前项目：采购围标风险专项检查</span>
        <span>·</span>
        <span>受检单位：华北装备制造集团西北分公司</span>
        <span className="icm-foot-spacer" />
        <span className="icm-dot" />
        <span>闭环流程可演示</span>
      </footer>
    </div>
  )
}
