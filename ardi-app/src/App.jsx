import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { StoreProvider } from './contexts/StoreContext'

import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AppShell from './components/AppShell'

// 10 ARDI Intelligence Pages
import DecisionHub from './pages/app/DecisionHub'
import ExecutiveOverview from './pages/app/ExecutiveOverview'
import DemandIntelligence from './pages/app/DemandIntelligence'
import InventoryControl from './pages/app/InventoryControl'
import SupplierRisk from './pages/app/SupplierRisk'
import PricingMargin from './pages/app/PricingMargin'
import ExternalSignals from './pages/app/ExternalSignals'
import LateralLogistics from './pages/app/LateralLogistics'
import SimulationLab from './pages/app/SimulationLab'
import AuditCenter from './pages/app/AuditCenter'

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            {/* Root → redirect to decision hub for immediate hackathon demonstration */}
            <Route path="/" element={<Navigate to="/app/decision-hub" replace />} />

            {/* Auth pages */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected app shell */}
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate to="decision-hub" replace />} />
              <Route path="decision-hub" element={<DecisionHub />} />
              <Route path="overview" element={<ExecutiveOverview />} />
              <Route path="demand" element={<DemandIntelligence />} />
              <Route path="inventory" element={<InventoryControl />} />
              <Route path="suppliers" element={<SupplierRisk />} />
              <Route path="pricing" element={<PricingMargin />} />
              <Route path="external" element={<ExternalSignals />} />
              <Route path="logistics-map" element={<LateralLogistics />} />
              <Route path="simulation-lab" element={<SimulationLab />} />
              <Route path="audit" element={<AuditCenter />} />

              {/* Legacy backward compatibility aliases */}
              <Route path="warehouses" element={<Navigate to="/app/inventory" replace />} />
              <Route path="promotions" element={<Navigate to="/app/pricing" replace />} />
              <Route path="competitors" element={<Navigate to="/app/external" replace />} />
              <Route path="analytics" element={<Navigate to="/app/audit" replace />} />
            </Route>

            {/* Catch-all → decision hub */}
            <Route path="*" element={<Navigate to="/app/decision-hub" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  )
}
