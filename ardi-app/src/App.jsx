import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { StoreProvider } from './contexts/StoreContext'

import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AppShell from './components/AppShell'

import DecisionHub from './pages/app/DecisionHub'
import Warehouses from './pages/app/Warehouses'
import LogisticsMap from './pages/app/LogisticsMap'
import Promotions from './pages/app/Promotions'
import Competitors from './pages/app/Competitors'
import Analytics from './pages/app/Analytics'

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            {/* Root → redirect to signin */}
            <Route path="/" element={<Navigate to="/signin" replace />} />

            {/* Auth pages */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected app shell */}
            <Route path="/app" element={<AppShell />}>
              {/* Default /app → decision-hub */}
              <Route index element={<Navigate to="decision-hub" replace />} />
              <Route path="decision-hub" element={<DecisionHub />} />
              <Route path="warehouses" element={<Warehouses />} />
              <Route path="logistics-map" element={<LogisticsMap />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="competitors" element={<Competitors />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            {/* Catch-all → signin */}
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  )
}
