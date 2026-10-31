import React, { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TopHeader from './TopHeader'
import Sidebar from './Sidebar'

export default function AppShell() {
  const { user } = useAuth()
  const [collapsed, setCollapsed]       = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)

  // Guard: redirect to signin if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <TopHeader
        sidebarCollapsed={collapsed}
        onMobileMenuToggle={() => setMobileOpen((v) => !v)}
      />

      {/* Body: sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-slate-950/50 to-slate-900/50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
