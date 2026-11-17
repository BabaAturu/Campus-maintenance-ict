import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import StaffDashboardPage from './pages/StaffDashboardPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import './App.css'

function App() {
  return (
    <ThemeProvider>
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard/staff" element={<ProtectedRoute role="STAFF"><StaffDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="ICT_ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/ict-admin" element={<ProtectedRoute role="ICT_ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/team-lead" element={<ProtectedRoute role="ICT_TECHNICIAN_TEAM_LEAD"><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/technician" element={<ProtectedRoute role="ICT_TECHNICIAN"><DashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
