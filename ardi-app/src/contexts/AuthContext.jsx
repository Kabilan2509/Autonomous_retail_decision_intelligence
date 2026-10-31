import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ardi_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = (email, password) => {
    // Simulate authentication — replace with real API call
    const userData = {
      id: '1',
      email,
      name: email.split('@')[0],
      role: 'Manager',
      avatar: email.charAt(0).toUpperCase(),
      isDemo: false,
    }
    setUser(userData)
    localStorage.setItem('ardi_user', JSON.stringify(userData))
    return { success: true }
  }

  const loginAsDemo = () => {
    const demoUser = {
      id: 'demo',
      email: 'demo@ardi.ai',
      name: 'Demo User',
      role: 'Analyst',
      avatar: 'D',
      isDemo: true,
    }
    setUser(demoUser)
    localStorage.setItem('ardi_user', JSON.stringify(demoUser))
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ardi_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
