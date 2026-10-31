import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Store,
  Zap,
  Check,
  CloudSun,
  Menu,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import useAppStore from '../store/useStore'
import { clsx } from 'clsx'

// Reusable hook to close dropdown on outside click
function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClose])
}

// Weather condition → colour mapping
const weatherColour = (weather = '') => {
  if (weather.includes('Heatwave')) return 'text-orange-400'
  if (weather.includes('Rain'))     return 'text-blue-400'
  return 'text-green-400'
}

export default function TopHeader({ sidebarCollapsed, onMobileMenuToggle }) {
  const { user, logout } = useAuth()
  // ── Zustand global state ──────────────────────────────────────────────────
  const currentStore    = useAppStore((s) => s.currentStore)
  const stores          = useAppStore((s) => s.stores)
  const setCurrentStore = useAppStore((s) => s.setCurrentStore)
  const ai_decisions    = useAppStore((s) => s.ai_decisions)
  const navigate = useNavigate()

  const [storeOpen, setStoreOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const storeRef = useRef(null)
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  useClickOutside(storeRef, () => setStoreOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))
  useClickOutside(notifRef, () => setNotifOpen(false))

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  // Selected store object (full metadata)
  const activeStore = stores.find((s) => s.name === currentStore) ?? stores[0]

  // Notifications derived from pending AI decisions
  const notifications = [
    {
      id: 'n-rec001',
      title: 'Inventory Transfer Ready',
      desc: `${ai_decisions[0]?.quantity ?? 200} units SPF50 Sunscreen: Coimbatore → Chennai`,
      time: '2m ago',
      dot: 'bg-orange-400',
    },
    {
      id: 'n-rec002',
      title: 'Markdown Recommended',
      desc: 'Cola 12-pk expiry risk — 20% markdown advised in Coimbatore',
      time: '15m ago',
      dot: 'bg-yellow-400',
    },
    {
      id: 'n-rec003',
      title: 'Restock Alert — Palani',
      desc: 'Festival Sweets critically low ahead of Karthigai Deepam',
      time: '30m ago',
      dot: 'bg-red-400',
    },
  ]

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-5 glass-panel border-x-0 border-t-0 rounded-none sticky top-0 z-40">
      {/* Left: Hamburger (mobile) + Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Hamburger — only visible below md */}
        <button
          id="mobile-hamburger"
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className={clsx(
          'font-bold text-lg text-gradient-blue tracking-wide transition-all duration-300',
          sidebarCollapsed ? 'opacity-100' : 'hidden sm:block'
        )}>
          ARDI
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5">

        {/* ── Store Switcher (Zustand-wired) ── */}
        <div ref={storeRef} className="relative">
          <button
            id="header-store-switcher"
            onClick={() => { setStoreOpen((v) => !v); setProfileOpen(false); setNotifOpen(false) }}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-blue-500/40',
              'text-sm font-medium text-slate-300 hover:text-white',
              'transition-all duration-300 ease-in-out',
            )}
          >
            <Store className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="hidden sm:block max-w-[150px] truncate">{activeStore.name}</span>
            {/* Live weather badge */}
            <span className={clsx(
              'hidden lg:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700',
              weatherColour(activeStore.weather)
            )}>
              <CloudSun className="w-3 h-3" />
              {activeStore.weather}
            </span>
            <ChevronDown className={clsx('w-3.5 h-3.5 text-slate-500 transition-transform duration-200', storeOpen && 'rotate-180')} />
          </button>

          {storeOpen && (
            <div className="dropdown-menu w-72">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Select Store</p>
              </div>
              {stores.map((store) => (
                <button
                  key={store.id}
                  id={`store-option-${store.id}`}
                  onClick={() => { setCurrentStore(store.name); setStoreOpen(false) }}
                  className={clsx(
                    'dropdown-item w-full text-left gap-3',
                    currentStore === store.name && 'text-blue-400 bg-blue-500/10'
                  )}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{store.name}</p>
                    <p className={clsx('text-xs mt-0.5', weatherColour(store.weather))}>{store.weather}</p>
                  </div>
                  {currentStore === store.name && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Settings ── */}
        <button
          id="header-settings"
          className="icon-btn"
          title="Settings"
          onClick={() => { setProfileOpen(false); setNotifOpen(false) }}
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* ── Notifications ── */}
        <div ref={notifRef} className="relative">
          <button
            id="header-notifications"
            className="icon-btn"
            title="Notifications"
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); setStoreOpen(false) }}
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse" />
          </button>

          {notifOpen && (
            <div className="dropdown-menu w-80 right-0">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Notifications</p>
                <span className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">Mark all read</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="dropdown-item flex-col items-start gap-0.5 py-3 border-b border-slate-800/50 last:border-0">
                    <div className="flex items-center gap-2 w-full">
                      <span className={clsx('w-2 h-2 rounded-full shrink-0', n.dot)} />
                      <span className="text-sm font-medium text-white flex-1">{n.title}</span>
                      <span className="text-xs text-slate-600">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-4">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-800">
                <span className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">View all notifications →</span>
              </div>
            </div>
          )}
        </div>

        {/* ── User Profile ── */}
        <div ref={profileRef} className="relative ml-1">
          <button
            id="header-profile"
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); setStoreOpen(false) }}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-lg hover:bg-slate-800 transition-all duration-300 ease-in-out"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow">
              {user?.avatar || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">{user?.role || 'Member'}</p>
            </div>
            <ChevronDown className={clsx('w-3.5 h-3.5 text-slate-500 transition-transform duration-200', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="dropdown-menu w-52">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                {user?.isDemo && (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                    <Zap className="w-3 h-3" /> Demo Mode
                  </span>
                )}
              </div>
              <button
                id="profile-menu-profile"
                className="dropdown-item w-full"
              >
                <User className="w-4 h-4 text-slate-500" />
                My Profile
              </button>
              <button
                id="profile-menu-settings"
                className="dropdown-item w-full"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                Settings
              </button>
              <div className="border-t border-slate-800 mt-1 pt-1">
                <button
                  id="profile-menu-logout"
                  onClick={handleLogout}
                  className="dropdown-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
