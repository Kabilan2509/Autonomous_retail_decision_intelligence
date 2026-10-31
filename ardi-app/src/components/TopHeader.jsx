import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  User,
  MapPin,
  Store,
  Zap,
  Check,
  CloudSun,
  Menu,
  Building2,
  LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import useAppStore from '../store/useStore'
import { clsx } from 'clsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useClickOutside(ref, onClose) {
  const handler = useCallback(
    (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() },
    [ref, onClose],
  )
  useEffect(() => {
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [handler])
}

const weatherColour = (weather = '') => {
  if (weather.includes('Heatwave')) return 'text-orange-400'
  if (weather.includes('Rain'))     return 'text-blue-400'
  return 'text-green-400'
}

// City accent colours
const CITY_ACCENT = {
  chennai:    { ring: 'ring-orange-500/50', dot: 'bg-orange-400', text: 'text-orange-400' },
  bangalore:  { ring: 'ring-blue-500/50',   dot: 'bg-blue-400',   text: 'text-blue-400'  },
  coimbatore: { ring: 'ring-emerald-500/50',dot: 'bg-emerald-400',text: 'text-emerald-400'},
}

// ─── Reusable dropdown shell ──────────────────────────────────────────────────

function DropdownButton({ id, open, onClick, children, className }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
        'bg-slate-800/60 hover:bg-slate-700/60',
        'border border-slate-700/60 hover:border-slate-600',
        'text-sm font-medium text-slate-300 hover:text-white',
        'transition-all duration-200 ease-in-out',
        open && 'bg-slate-700/60 border-slate-600',
        className,
      )}
    >
      {children}
      <ChevronDown
        className={clsx(
          'w-3 h-3 text-slate-500 transition-transform duration-200 shrink-0',
          open && 'rotate-180',
        )}
      />
    </button>
  )
}

// ─── City Selector Dropdown ───────────────────────────────────────────────────

function CitySelector({ cities, activeCity, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false))

  const city    = cities.find((c) => c.id === activeCity) ?? cities[0]
  const accent  = CITY_ACCENT[activeCity] ?? CITY_ACCENT.chennai

  return (
    <div ref={ref} className="relative">
      <DropdownButton
        id="header-city-selector"
        open={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MapPin className={clsx('w-3.5 h-3.5 shrink-0', accent.text)} />
        <span className="hidden sm:block font-semibold">{city.name}</span>
        {/* Weather pill — visible lg+ */}
        <span
          className={clsx(
            'hidden lg:inline-flex items-center gap-1 text-[10px] font-medium',
            'px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80',
            weatherColour(city.weather),
          )}
        >
          <CloudSun className="w-2.5 h-2.5" />
          {city.weather}
        </span>
      </DropdownButton>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 min-w-[220px]
                      glass-panel shadow-xl shadow-black/50 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
            <MapPin className="w-3 h-3 text-slate-500" />
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Select City
            </p>
          </div>

          {cities.map((c) => {
            const acc     = CITY_ACCENT[c.id] ?? CITY_ACCENT.chennai
            const isActive = c.id === activeCity
            return (
              <button
                key={c.id}
                id={`city-option-${c.id}`}
                onClick={() => { onSelect(c.id); setOpen(false) }}
                className={clsx(
                  'dropdown-item w-full text-left gap-3 py-3',
                  isActive && 'bg-blue-500/10',
                )}
              >
                {/* Colour dot */}
                <span className={clsx('w-2 h-2 rounded-full shrink-0', acc.dot)} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={clsx('text-sm font-semibold', isActive ? 'text-white' : 'text-slate-300')}>
                      {c.name}
                    </p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                      {c.store_count} stores
                    </span>
                  </div>
                  <p className={clsx('text-[10px] mt-0.5', weatherColour(c.weather))}>
                    {c.weather}
                  </p>
                  {c.weather_alert && (
                    <p className="text-[9px] text-orange-400/80 mt-0.5 truncate">{c.weather_alert}</p>
                  )}
                </div>

                {isActive && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Store Selector Dropdown ──────────────────────────────────────────────────

function StoreSelector({ cityStores, activeStore, activeCity, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false))

  const isAll     = activeStore === 'all'
  const current   = isAll ? null : cityStores.find((s) => s.id === activeStore)
  const label     = isAll ? 'All Stores' : (current?.area ?? 'Store')
  const accent    = CITY_ACCENT[activeCity] ?? CITY_ACCENT.chennai

  return (
    <div ref={ref} className="relative">
      <DropdownButton
        id="header-store-selector"
        open={open}
        onClick={() => setOpen((v) => !v)}
      >
        {isAll
          ? <LayoutGrid className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          : <Store className={clsx('w-3.5 h-3.5 shrink-0', accent.text)} />
        }
        <span className="hidden sm:block max-w-[130px] truncate">
          {label}
        </span>
        {/* Store count or store number badge */}
        {!isAll && current && (
          <span className="hidden md:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-500 font-mono">
            #{cityStores.indexOf(current) + 1}
          </span>
        )}
      </DropdownButton>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 w-64
                      glass-panel shadow-xl shadow-black/50 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
            <Store className="w-3 h-3 text-slate-500" />
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Select Store
            </p>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
              {cityStores.length} total
            </span>
          </div>

          {/* "City Overview" option — always first */}
          <button
            id="store-option-all"
            onClick={() => { onSelect('all'); setOpen(false) }}
            className={clsx(
              'dropdown-item w-full text-left gap-3 py-2.5 border-b border-slate-800/60',
              isAll && 'bg-blue-500/10',
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <div className="flex-1">
              <p className={clsx('text-sm font-semibold', isAll ? 'text-white' : 'text-slate-300')}>
                City Overview
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">All Stores · Aggregated view</p>
            </div>
            {isAll && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
          </button>

          {/* Individual stores — scrollable */}
          <div className="max-h-60 overflow-y-auto">
            {cityStores.map((store, idx) => {
              const isActive = activeStore === store.id
              // Revenue formatted
              const rev = `₹${(store.daily_revenue / 1000).toFixed(0)}k/day`
              return (
                <button
                  key={store.id}
                  id={`store-option-${store.id}`}
                  onClick={() => { onSelect(store.id); setOpen(false) }}
                  className={clsx(
                    'dropdown-item w-full text-left gap-3 py-2.5',
                    isActive && 'bg-blue-500/10',
                  )}
                >
                  {/* Store number badge */}
                  <span
                    className={clsx(
                      'flex items-center justify-center w-5 h-5 rounded-md text-[9px] font-bold shrink-0',
                      isActive
                        ? `${accent.text} bg-blue-500/15 border border-blue-500/30`
                        : 'text-slate-600 bg-slate-800 border border-slate-700',
                    )}
                  >
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-xs font-semibold truncate', isActive ? 'text-white' : 'text-slate-300')}>
                      {store.area}
                    </p>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">{rev}</p>
                  </div>

                  {isActive && <Check className="w-3 h-3 text-blue-400 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Separator ────────────────────────────────────────────────────────────────

function NavSeparator() {
  return (
    <div className="hidden sm:flex items-center">
      <ChevronDown
        className="w-3.5 h-3.5 text-slate-700 -rotate-90"
        strokeWidth={1.5}
      />
    </div>
  )
}

// ─── Main TopHeader ───────────────────────────────────────────────────────────

export default function TopHeader({ sidebarCollapsed, onMobileMenuToggle }) {
  const { user, logout } = useAuth()

  // ── Zustand state ────────────────────────────────────────────────────────────
  const cities        = useAppStore((s) => s.cities)
  const stores        = useAppStore((s) => s.stores)
  const activeCity    = useAppStore((s) => s.activeCity)
  const activeStore   = useAppStore((s) => s.activeStore)
  const ai_decisions  = useAppStore((s) => s.ai_decisions)
  const setActiveCity = useAppStore((s) => s.setActiveCity)
  const setActiveStore= useAppStore((s) => s.setActiveStore)

  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const profileRef = useRef(null)
  const notifRef   = useRef(null)

  useClickOutside(profileRef, () => setProfileOpen(false))
  useClickOutside(notifRef,   () => setNotifOpen(false))

  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/signin') }

  // Stores that belong to the currently selected city
  const cityStores = stores.filter((s) => s.city_id === activeCity)

  // City metadata
  const activeCity_  = cities.find((c) => c.id === activeCity) ?? cities[0]

  // Breadcrumb display: "Chennai › Koramangala" or "Bangalore › All Stores"
  const isAllStores  = activeStore === 'all'
  const currentStore = isAllStores
    ? null
    : cityStores.find((s) => s.id === activeStore)

  // Notifications derived from pending AI decisions
  const pendingCount = ai_decisions.filter((d) => d.status === 'PENDING').length
  const notifications = [
    {
      id: 'n-rec001',
      title: 'Intra-City Transfer Ready',
      desc: 'SPF50 Sunscreen: Chennai Store 2 → Store 7 (Tambaram)',
      time: '2m ago',
      dot: 'bg-orange-400',
    },
    {
      id: 'n-rec002',
      title: 'Warehouse Replenishment',
      desc: 'Potato Chips: Bangalore Warehouse → Store 5 (Jayanagar)',
      time: '10m ago',
      dot: 'bg-blue-400',
    },
    {
      id: 'n-rec003',
      title: 'Markdown Recommended',
      desc: 'Cola 12-pk expiry risk — Coimbatore Store 2 (Gandhipuram)',
      time: '35m ago',
      dot: 'bg-yellow-400',
    },
  ]

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-5 glass-panel border-x-0 border-t-0 rounded-none sticky top-0 z-40">

      {/* ── Left: Hamburger (mobile) + Logo ── */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Hamburger — only visible below md */}
        <button
          id="mobile-hamburger"
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className={clsx(
          'font-bold text-lg text-gradient-blue tracking-wide transition-all duration-300',
          sidebarCollapsed ? 'opacity-100' : 'hidden sm:block',
        )}>
          ARDI
        </span>
      </div>

      {/* ── Centre: Cascading Location + Store navigation ── */}
      <div className="flex items-center gap-1.5 mx-4 flex-1 justify-center">

        {/* Breadcrumb container */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900/60 border border-slate-800">

          {/* City Selector */}
          <CitySelector
            cities={cities}
            activeCity={activeCity}
            onSelect={(cityId) => setActiveCity(cityId)}
          />

          {/* Breadcrumb separator */}
          <NavSeparator />

          {/* Store Selector — dynamically populated from cityStores */}
          <StoreSelector
            cityStores={cityStores}
            activeStore={activeStore}
            activeCity={activeCity}
            onSelect={(storeId) => setActiveStore(storeId)}
          />
        </div>

        {/* Context breadcrumb pill — visible md+ */}
        {!isAllStores && currentStore && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                          bg-blue-500/10 border border-blue-500/25 animate-fade-in">
            <Building2 className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-semibold text-blue-400 truncate max-w-[140px]">
              {currentStore.address}
            </span>
          </div>
        )}
      </div>

      {/* ── Right: Settings, Notifications, Profile ── */}
      <div className="flex items-center gap-1.5 shrink-0">

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
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
          >
            <Bell className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="dropdown-menu w-80 right-0">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Notifications</p>
                <span className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                  Mark all read
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="dropdown-item flex-col items-start gap-0.5 py-3 border-b border-slate-800/50 last:border-0"
                  >
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
                <span className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                  View all notifications →
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── User Profile ── */}
        <div ref={profileRef} className="relative ml-1">
          <button
            id="header-profile"
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
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
                {/* Active context display inside profile */}
                <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <span className={clsx('w-1.5 h-1.5 rounded-full', CITY_ACCENT[activeCity]?.dot ?? 'bg-blue-400')} />
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {activeCity_.name}
                    {!isAllStores && currentStore && ` › ${currentStore.area}`}
                  </span>
                </div>
                {user?.isDemo && (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                    <Zap className="w-3 h-3" /> Demo Mode
                  </span>
                )}
              </div>
              <button id="profile-menu-profile" className="dropdown-item w-full">
                <User className="w-4 h-4 text-slate-500" />
                My Profile
              </button>
              <button id="profile-menu-settings" className="dropdown-item w-full">
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
