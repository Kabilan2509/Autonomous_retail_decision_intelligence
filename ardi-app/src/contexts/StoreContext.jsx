import React, { createContext, useContext, useState } from 'react'

const StoreContext = createContext(null)

export const STORES = [
  { id: 'store1', label: 'Store 1 (Chennai)', short: 'Chennai', flag: '🏙️' },
  { id: 'store2', label: 'Store 2 (Coimbatore)', short: 'Coimbatore', flag: '🌆' },
  { id: 'store3', label: 'Store 3 (Palani)', short: 'Palani', flag: '🏔️' },
]

export function StoreProvider({ children }) {
  const [selectedStore, setSelectedStore] = useState(STORES[0])

  return (
    <StoreContext.Provider value={{ selectedStore, setSelectedStore, stores: STORES }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
