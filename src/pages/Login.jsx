import { useState } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShoppingBag, ArrowRight, User, Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
export default function LoginPage() {
  const navigate = useNavigate()
const { setUser } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔥 Demo Fill
  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@clothstock.com')
      setPassword('admin123')
    } else {
      setEmail('manager@clothstock.com')
      setPassword('manager123')
    }
  }

  // 🔐 Handle Submit (API Connected)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // SIGNUP (demo only)
      if (mode === 'signup') {
        await new Promise(r => setTimeout(r, 500))
        setMode('login')
        setEmail('')
        setPassword('')
        setName('')
        setLoading(false)
        return
      }

      // 🔥 LOGIN API CALL
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // important for session
          body: JSON.stringify({ email, password }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Login failed')
        setLoading(false)
        return
      }
setUser(data) 
      // ✅ Redirect
      if (data.role === 'admin') {
        navigate('/admin')
      } else if (data.role === 'manager') {
        navigate('/manager')
      } else {
        setError('Invalid role')
      }

    } catch (err) {
      console.log(err)
      setError('Server error')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-900/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ClothStock</h1>
          <p className="text-gray-400 text-sm">Inventory System</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">

          {/* Toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 text-sm rounded-lg ${
                  mode === m
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-500 w-4" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 pl-10 rounded bg-black/30 text-white"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500 w-4" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pl-10 rounded bg-black/30 text-white"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500 w-4" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 pr-10 rounded bg-black/30 text-white"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 py-3 rounded text-white flex justify-center items-center gap-2"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Signup'}
              {!loading && <ArrowRight size={16}/>}
            </button>
          </form>

          {/* Demo Buttons */}
          {mode === 'login' && (
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                onClick={() => fillDemo('admin')}
                className="bg-purple-800 text-white py-2 rounded"
              >
                Admin Login
              </button>
              <button
                onClick={() => fillDemo('manager')}
                className="bg-violet-800 text-white py-2 rounded"
              >
                Manager Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}