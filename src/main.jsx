/*
  ==========================================
  main.jsx — The Entry Point of Your React App
  ==========================================
  
  This is the FIRST file React runs.
  It connects React to the HTML page and wraps
  everything in the Router so navigation works.
*/

import React from 'react'
import ReactDOM from 'react-dom/client'

// BrowserRouter enables URL-based navigation (react-router-dom)
// Without this, clicking links won't change pages
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'

// AuthProvider is our "global state" for who is logged in
// We wrap the whole app so every page can access login info
import { AuthProvider } from './context/AuthContext.jsx'

import './index.css'  // Global styles + Tailwind

/*
  ReactDOM.createRoot() creates the React "root" and connects it
  to the <div id="root"> in index.html.
  
  .render() draws the entire app inside that div.
  
  <React.StrictMode> is a development helper — it warns you
  about bad practices. It doesn't affect production.
*/
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
