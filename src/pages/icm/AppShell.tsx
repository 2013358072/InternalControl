import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, ChevronLeft, ChevronRight, UserRound } from 'lucide-react'

import { defaultRoute, getRouteMeta, icmRoutes } from './routeMeta'
import './AppShell.css'

export default function AppShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const meta = getRouteMeta(location.pathname === '/' ? defaultRoute : location.pathname)

  return (
    <div className={'icm-app ' + (collapsed ? 'side-collapsed' : '')}>
      <header className="icm-top">
        <div className="icm-brand">
          <div className="icm-brand-mark">IC</div>
          <div>
            <div className="icm-brand-title">内控检查管理系统</div>
          </div>
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

      <div className="icm-body">
        <aside className="icm-side-nav">
          <button
            className="icm-side-collapse-btn"
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? '展开菜单' : '折叠菜单'}
            title={collapsed ? '展开菜单' : '折叠菜单'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <div className="icm-side-section">
            {icmRoutes.map((route) => {
              const Icon = route.icon
              return (
                <NavLink
                  className={({ isActive }) => `icm-side-link ${isActive ? 'active' : ''}`}
                  key={route.path}
                  to={route.path}
                >
                  <Icon size={17} />
                  <span>{route.title}</span>
                </NavLink>
              )
            })}
          </div>
          <div className="icm-side-current">
            <span>{meta.categoryName}</span>
            <ChevronRight size={14} />
            <strong>{meta.title}</strong>
          </div>
        </aside>
        <main className={location.pathname === '/cockpit' ? 'icm-main-no-scroll' : 'icm-main'}>
          <Outlet />
        </main>
      </div>

      <footer className="icm-foot">
        <span>当前系统：内控检查管理系统</span>
        <span>·</span>
        <span>覆盖计划、采集、审查、底稿、整改与报告</span>
        <span className="icm-foot-spacer" />
        <span className="icm-dot" />
        <span>流程运行中</span>
      </footer>
    </div>
  )
}
