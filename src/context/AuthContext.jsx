/*
  ==========================================
  AuthContext.jsx — Global Login State
  ==========================================
  
  CONCEPT: React Context
  ----------------------
  Normally, to share data between components you have to
  "pass it down" as props through every level. This is called
  "prop drilling" and gets messy fast.
  
  Context is like a global variable that any component can
  read directly, without prop drilling.
  
  Here we store: who is logged in, and their role (admin/manager)
  
  FLOW:
    1. User logs in on LoginPage
    2. login() function saves user to state
    3. Every component can call useAuth() to get the user info
    4. logout() clears the user → redirects to login
*/

import { createContext, useContext, useState } from 'react'
import React from 'react'

// Step 1: Create the context "container"
const AuthContext = createContext(null)

// Step 2: Fake "database" of users
// In a real app this would come from your Node.js + PostgreSQL backend
const USERS = [
  { id: 1, name: 'Vivek knanka', email: 'admin@clothstock.com',   password: 'admin123',   role: 'admin'   },
  { id: 2, name: 'Sumeet kannoji', email: 'manager@clothstock.com', password: 'manager123', role: 'manager' },
]

// Step 3: AuthProvider wraps the whole app and provides the context value
// Think of it as a "store" that broadcasts state to all children
export function AuthProvider({ children }) {
  // useState holds the current logged-in user (null = not logged in)
  const [user, setUser] = useState(null)

  // login() checks credentials and sets the user if valid
  // Returns { success, message } so the login page can show errors
  const login = (email, password) => {
    const found = USERS.find(
      u => u.email === email && u.password === password
    )
    if (found) {
      setUser(found)
      return { success: true, role: found.role }
    }
    return { success: false, message: 'Invalid email or password' }
  }

  // logout() clears the user from state → app will redirect to /login
  const logout = () => setUser(null)

  // The "value" object is what every component gets when they call useAuth()
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Step 4: Custom hook — makes it easy to use the context anywhere
// Instead of writing useContext(AuthContext) every time, just write useAuth()
export function useAuth() {
  return useContext(AuthContext)
}