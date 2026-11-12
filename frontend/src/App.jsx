import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import StaffDashboardPage from './pages/StaffDashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard/staff" element={<ProtectedRoute role="STAFF"><StaffDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/ict-admin" element={<ProtectedRoute role="ICT_ADMIN"><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/team-lead" element={<ProtectedRoute role="ICT_TECHNICIAN_TEAM_LEAD"><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/technician" element={<ProtectedRoute role="ICT_TECHNICIAN"><DashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
