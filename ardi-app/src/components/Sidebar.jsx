import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Boxes,
  Truck,
  DollarSign,
  Globe2,
  BrainCircuit,
  ArrowLeftRight,
  FlaskConical,
  LineChart,
} from 'lucide-react'
import { clsx } from 'clsx'

export const NAV_ITEMS = [
  { to: '/app/decision-hub',   label: 'AI Decision Center',  icon: BrainCircuit, badge: 'Active' },
  { to: '/app/overview',       label: 'Executive Overview',  icon: LayoutDashboard },
  { to: '/app/demand',         label: 'Demand Intelligence', icon: TrendingUp },
  { to: '/app/inventory',      label: 'Inventory Control',   icon: Boxes },
  { to: '/app/suppliers',      label: 'Supplier Risk',       icon: Truck },
  { to: '/app/pricing',        label: 'Pricing & Margin',    icon: DollarSign },
  { to: '/app/external',       label: 'News & Weather',      icon: Globe2 },
  { to: '/app/logistics-map',  label: 'Lateral Logistics',   icon: ArrowLeftRight },
  { to: '/app/simulation-lab', label: 'Simulation Lab',      icon: FlaskConical, badge: 'Scenarios' },
  { to: '/app/audit',          label: 'KPI & Baseline Audit',icon: LineChart },
]

function NavList({ collapsed, onNavClick }) {
  return (
    <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
      {!collapsed && (
        <p className="px-4 text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-2">
          Autonomous Retail Intelligence
        </p>
      )}
      <ul className="space-y-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <li key={to}>
            <NavLink
              to={to}
              title={collapsed ? label : undefined}
              onClick={onNavClick}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                  collapsed && 'justify-center px-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={clsx(
                      'shrink-0 transition-colors',
                      isActive ? 'text-blue-400' : 'text-slate-400'
                    )}
                    style={{ width: '1.15rem', height: '1.15rem' }}
                  />
                  {!collapsed && (
                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      {label}
                    </span>
                  )}
                  {!collapsed && badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {badge}
                    </span>
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
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col',
          'bg-slate-900 border-r border-slate-800',
          'transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-16' : 'md:w-64'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center font-bold text-white text-xs">
                AR
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white block">ARDI Platform</span>
                <span className="text-[10px] text-teal-400 font-mono">Retail Intelligence V3</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              AR
            </div>
          )}
        </div>

        <NavList collapsed={collapsed} onNavClick={onMobileClose} />

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500">
          {!collapsed && (
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-teal-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Live Engine
              </span>
              <span className="font-mono text-[10px]">HiGHS + Chronos</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
