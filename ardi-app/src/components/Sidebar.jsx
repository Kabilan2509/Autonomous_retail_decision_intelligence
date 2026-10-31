import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Warehouse,
  Map,
  Tag,
  Swords,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { to: '/app/decision-hub', label: 'Decision Hub',       icon: LayoutDashboard },
  { to: '/app/warehouses',   label: 'Warehouses',         icon: Warehouse },
  { to: '/app/logistics-map',label: 'Logistics Map',      icon: Map },
  { to: '/app/promotions',   label: 'Promotions',         icon: Tag },
  { to: '/app/competitors',  label: 'Competitors & Events', icon: Swords },
  { to: '/app/analytics',    label: 'Analytics',          icon: BarChart3 },
]

// Shared nav list used by both desktop sidebar and mobile drawer
function NavList({ collapsed, onNavClick }) {
  return (
    <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
      {!collapsed && (
        <p className="px-4 text-[10px] font-semibold tracking-widest text-slate-600 uppercase mb-2">
          Navigation
        </p>
      )}
      <ul className="space-y-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              title={collapsed ? label : undefined}
              onClick={onNavClick}
              className={({ isActive }) =>
                clsx(
                  'nav-link',
                  isActive && 'active',
                  collapsed && 'justify-center px-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={clsx(
                      'shrink-0 transition-colors duration-200',
                      collapsed ? 'w-5 h-5' : 'w-4.5 h-4.5',
                      isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                    style={{ width: collapsed ? '1.25rem' : '1.1rem', height: collapsed ? '1.25rem' : '1.1rem' }}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                      {label}
                    </span>
                  )}
                  {/* Active indicator dot for collapsed */}
                  {collapsed && isActive && (
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-blue-400" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* ── Mobile Backdrop overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-out drawer ── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col',
          'bg-slate-900/95 backdrop-blur-md border-r border-slate-800',
          'transition-transform duration-300 ease-in-out',
          'md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Drawer header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">ARDI Platform</p>
              <p className="text-xs text-slate-500">Retail Intelligence</p>
            </div>
          </div>
          <button
            id="mobile-drawer-close"
            onClick={onMobileClose}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav list — close drawer on link click */}
        <NavList collapsed={false} onNavClick={onMobileClose} />
      </aside>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside
        className={clsx(
          'hidden md:flex flex-col h-full bg-slate-900/60 backdrop-blur-md border-r border-slate-800',
          'transition-all duration-300 ease-in-out relative shrink-0',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Sidebar header */}
        <div className={clsx(
          'h-16 flex items-center border-b border-slate-800 shrink-0 overflow-hidden',
          collapsed ? 'justify-center px-0' : 'px-4 gap-3',
        )}>
          {!collapsed && (
            <>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-white leading-tight whitespace-nowrap">ARDI Platform</p>
                <p className="text-xs text-slate-500 whitespace-nowrap">Retail Intelligence</p>
              </div>
            </>
          )}
          {collapsed && (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <NavList collapsed={collapsed} onNavClick={undefined} />

        {/* Collapse toggle */}
        <div className="shrink-0 border-t border-slate-800 p-2">
          <button
            id="sidebar-toggle"
            onClick={onToggle}
            className={clsx(
              'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg',
              'text-slate-500 hover:text-white hover:bg-slate-800',
              'transition-all duration-300 ease-in-out',
              collapsed && 'justify-center',
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
