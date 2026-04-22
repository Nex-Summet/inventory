/*
  ==========================================
  App.jsx — The Router / Navigation Hub
  ==========================================
  
  CONCEPT: React Router
  ---------------------
  React Router lets you show different components
  based on the URL in the browser.
  
  /login         → shows LoginPage
  /admin         → shows AdminDashboard (only if admin)
  /manager       → shows ManagerDashboard (only if manager)
  
  ProtectedRoute is a wrapper that checks if you're 
  logged in before showing a page. If not → redirect to /login.
*/

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import React from 'react'

// Page imports — each is a separate component file
import LoginPage from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ManagerDashboard from './pages/ManagerDashboard'

/*
  ProtectedRoute Component
  ------------------------
  This acts as a "guard" in front of pages.
  
  Props:
    - children: the page to show if allowed
    - requiredRole: 'admin' or 'manager'
  
  Logic:
    1. If not logged in → go to /login
    2. If logged in but wrong role → go to /login
    3. If all good → show the page (children)
*/
function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()

  // Not logged in at all
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but wrong role (e.g., manager tries to visit /admin)
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  // All good — show the actual page
  return children
}

/*
  App Component
  -------------
  This is the main component. It sets up all the routes.
  
  <Routes> is the container for all route definitions.
  <Route path="..." element={...}> maps a URL to a component.
  <Navigate> automatically redirects to another URL.
*/
export default function App() {
  return (
    <Routes>
      {/* Default route: redirect "/" to "/login" */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login page — no protection needed, anyone can visit */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin dashboard — only accessible if user.role === 'admin' */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Manager dashboard — only accessible if user.role === 'manager' */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute requiredRole="manager">
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all: any unknown URL goes to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
