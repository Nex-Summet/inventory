/*
  ==========================================
  LoginPage.jsx — Login & Signup Page
  ==========================================
  
  CONCEPT: Controlled Forms in React
  -----------------------------------
  In React, form inputs are "controlled" — meaning React state
  holds the current value of every input field.
  
  When user types → onChange fires → setState updates → 
  React re-renders with new value → input shows new value.
  
  This is different from regular HTML where the DOM holds the value.
  React keeps everything in its own "memory" (state).
  
  This page has TWO modes:
    - Login mode: email + password
    - Signup mode: name + email + password (for display only, not persisted)
*/

import { useState } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ShoppingBag, ArrowRight, User, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  // useNavigate gives us a function to programmatically go to another URL
  const navigate = useNavigate()
  
  // useAuth gives us the login function from our global context
  const { login } = useAuth()

  // ---- State Variables ----
  // Each piece of UI state is managed separately

  // 'login' or 'signup' — controls which form is shown
  const [mode, setMode] = useState('login')

  // Form field values — updated as user types
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Toggle password visibility (the eye icon)
  const [showPass, setShowPass] = useState(false)

  // Error message to show if login fails
  const [error, setError] = useState('')

  // Loading state — disables button while "processing"
  const [loading, setLoading] = useState(false)

  /*
    handleSubmit — called when form is submitted
    
    1. Prevents default browser refresh (e.role=submit normally refreshes page)
    2. Validates fields
    3. Calls login() from context
    4. Redirects based on role
  */
  const handleSubmit = async (e) => {
    e.preventDefault()   // Stop browser from refreshing the page
    setError('')          // Clear any old error
    setLoading(true)      // Show loading state

    // Small delay to simulate network call (remove in real app)
    await new Promise(r => setTimeout(r, 600))

    if (mode === 'signup') {
      // In a real app: POST to /api/auth/register
      // For now, just show a success message and switch to login
      setLoading(false)
      setMode('login')
      setEmail('')
      setPassword('')
      setName('')
      return
    }

    // Call login from AuthContext
    const result = login(email, password)

    if (result.success) {
      // Navigate based on role
      if (result.role === 'admin')   navigate('/admin')
      if (result.role === 'manager') navigate('/manager')
    } else {
      setError(result.message)  // Show error message
    }

    setLoading(false)
  }

  // Quick-fill demo credentials
  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@clothstock.com')
      setPassword('admin123')
    } else {
      setEmail('manager@clothstock.com')
      setPassword('manager123')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] flex items-center justify-center p-4 relative overflow-hidden">

      {/* ---- Background Decorations ---- */}
      {/* These are purely visual — blurred circles that create a "glow" effect */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-pink-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* ---- Main Card ---- */}
      <div className="w-full max-w-md relative z-10">

        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-800 rounded-2xl mb-4 shadow-2xl shadow-purple-900/50">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ClothStock</h1>
          <p className="text-gray-400 mt-1 text-sm">Inventory Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Mode Toggle: Login / Sign Up */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-8">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 capitalize
                  ${mode === m
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ---- Form ---- */}
          {/*
            onSubmit={handleSubmit} — calls our function when form is submitted
            This works whether user clicks the button OR presses Enter
          */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name field — only shown in signup mode */}
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  /*
                    onChange — every time user types a character,
                    this fires and updates the 'name' state.
                    e.target.value is the current text in the input.
                  */
                  onChange={e => setName(e.target.value)}
                  className="input-field pl-12"
                  required
                />
              </div>
            )}

            {/* Email field */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field pl-12"
                required
              />
            </div>

            {/* Password field with show/hide toggle */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              {/*
                type changes based on showPass state:
                "password" → shows dots
                "text"     → shows actual password
              */}
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pl-12 pr-12"
                required
              />
              {/* Eye icon button to toggle password visibility */}
              <button
                type="button"   // Important: type="button" prevents form submission
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error message — only rendered if error state is not empty */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}  // Disabled while loading to prevent double-clicks
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  {/* Spinning loader */}
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ---- Demo Credentials (for internship presentation) ---- */}
          {mode === 'login' && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-500 text-xs text-center mb-3">Quick demo login</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fillDemo('admin')}
                  className="bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/40 text-purple-300 text-xs font-medium py-2.5 rounded-xl transition-all duration-200"
                >
                  Admin Login
                </button>
                <button
                  onClick={() => fillDemo('manager')}
                  className="bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/40 text-violet-300 text-xs font-medium py-2.5 rounded-xl transition-all duration-200"
                >
                  Manager Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Project 4 — Internship 2024
        </p>
      </div>
    </div>
  )
}
