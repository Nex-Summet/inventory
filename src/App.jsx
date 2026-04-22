import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import React from 'react'

import LoginPage from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ManagerDashboard from './pages/ManagerDashboard'

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager"
        element={
          <ProtectedRoute requiredRole="manager">
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}