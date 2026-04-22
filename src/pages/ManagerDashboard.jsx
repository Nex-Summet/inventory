/*
  ==========================================
  ManagerDashboard.jsx — Manager Panel
  ==========================================
  
  FEATURES:
    1. View product list (read-only — cannot add/delete)
    2. Update stock — IN (add stock) or OUT (sell/remove stock)
    3. Stock validation: cannot go below 0 (your functional requirement!)
    4. Generate invoice for a stock-out operation
    5. Transaction history log
    6. Logout
  
  CONCEPTS COVERED:
    - Multiple pieces of related state
    - Form with conditional logic (validate before update)
    - Invoice generation using browser's print API
    - Array immutability (never mutate state directly)
*/

import { useState } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { INITIAL_PRODUCTS, getStockStatus } from '../data'
import {
  LogOut, ArrowDownCircle, ArrowUpCircle, FileText,
  ShoppingBag, TrendingUp, TrendingDown, Package,
  ChevronDown, Printer, X, CheckCircle, AlertCircle
} from 'lucide-react'

// ---- StockBadge (same as in Admin, could be moved to a shared component) ----
function StockBadge({ stock }) {
  const { label, color } = getStockStatus(stock)
  const styles = {
    red:   'bg-red-900/40 text-red-300 border-red-700/40',
    amber: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
    green: 'bg-green-900/40 text-green-300 border-green-700/40',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[color]}`}>
      {label}
    </span>
  )
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Products state — manager can only update stock, not add/delete
  const [products, setProducts] = useState(INITIAL_PRODUCTS)

  // Active tab: 'products', 'update', 'history'
  const [activeTab, setActiveTab] = useState('products')

  /*
    Stock Update Form State
    -----------------------
    selectedProduct: which product is being updated
    operation: 'IN' (restock) or 'OUT' (sell/issue)
    quantity: how many units
    note: optional note (e.g. customer name)
    error: validation error message
  */
  const [selectedProduct, setSelectedProduct] = useState('')
  const [operation,       setOperation]       = useState('OUT')
  const [quantity,        setQuantity]        = useState('')
  const [note,            setNote]            = useState('')
  const [updateError,     setUpdateError]     = useState('')
  const [successMsg,      setSuccessMsg]      = useState('')

  /*
    Transaction History — array of past stock movements
    Each transaction records what happened for audit trail
  */
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      productName: 'Premium Cotton Shirt',
      sku: 'SHT-001',
      operation: 'IN',
      quantity: 20,
      note: 'Restocked from supplier',
      time: '10:30 AM',
      date: 'Today',
    }
  ])

  // Invoice state — null means not showing, object = show invoice
  const [invoice, setInvoice] = useState(null)

  // ---- HANDLERS ----

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  /*
    handleStockUpdate — the core manager action
    
    Validation:
    1. Product must be selected
    2. Quantity must be a positive number
    3. For OUT operations: stock cannot go below 0
       (This is your "Prevent negative stock" functional requirement!)
    
    If valid:
    - Update the product's stock in the products array
    - Add a transaction to history
    - Optionally generate an invoice (for OUT operations)
  */
  const handleStockUpdate = (e) => {
    e.preventDefault()
    setUpdateError('')
    setSuccessMsg('')

    // Find the selected product object
    const product = products.find(p => p.id === Number(selectedProduct))
    if (!product) {
      setUpdateError('Please select a product.')
      return
    }

    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setUpdateError('Please enter a valid quantity.')
      return
    }

    // ---- KEY VALIDATION: Prevent Negative Stock ----
    if (operation === 'OUT' && product.stock < qty) {
      setUpdateError(`Cannot remove ${qty} units. Only ${product.stock} units available. Stock cannot go below zero.`)
      return
    }

    // Calculate new stock
    const newStock = operation === 'IN'
      ? product.stock + qty
      : product.stock - qty

    // Update product stock (immutably — we don't change the original object)
    setProducts(prev =>
      prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p)
    )

    // Create transaction record
    const tx = {
      id: Date.now(),
      productName: product.name,
      sku: product.sku,
      operation,
      quantity: qty,
      note: note || '—',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      price: product.price,
      total: product.price * qty,
    }
    setTransactions(prev => [tx, ...prev])  // Add to front of array

    // For OUT operations, generate an invoice
    if (operation === 'OUT') {
      setInvoice({
        ...tx,
        customerNote: note,
        product,
        newStock,
      })
    }

    setSuccessMsg(`Stock ${operation === 'IN' ? 'added' : 'removed'} successfully!`)
    setQuantity('')
    setNote('')
    setSelectedProduct('')
  }

  /*
    handlePrint — uses the browser's built-in print dialog
    We create a temporary div with invoice HTML, append to body,
    call window.print(), then remove it.
    
    In a real app you'd use a library like react-pdf or html2pdf.
  */
  const handlePrint = () => {
    const invoiceHTML = `
      <html>
      <head>
        <title>Invoice — ClothStock</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
          h1 { color: #7e22ce; margin-bottom: 4px; }
          .subtitle { color: #888; font-size: 13px; margin-bottom: 30px; }
          .divider { border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f5f0ff; text-align: left; padding: 10px 16px; font-size: 13px; color: #7e22ce; }
          td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
          .total { font-size: 18px; font-weight: bold; color: #7e22ce; margin-top: 20px; }
          .footer { margin-top: 40px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>ClothStock</h1>
        <p class="subtitle">Inventory Management System — Official Invoice</p>
        <hr class="divider" />
        <p><strong>Invoice #:</strong> INV-${Date.now().toString().slice(-6)}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Processed by:</strong> ${user?.name} (Manager)</p>
        ${invoice?.customerNote ? `<p><strong>Note:</strong> ${invoice.customerNote}</p>` : ''}
        <hr class="divider" />
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice?.productName}</td>
              <td>${invoice?.sku}</td>
              <td>${invoice?.quantity} units</td>
              <td>₹${invoice?.price?.toLocaleString()}</td>
              <td>₹${invoice?.total?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <p class="total">Total Amount: ₹${invoice?.total?.toLocaleString()}</p>
        <hr class="divider" />
        <p class="footer">This is a computer-generated invoice. — ClothStock IMS</p>
      </body>
      </html>
    `
    const win = window.open('', '_blank', 'width=800,height=600')
    win.document.write(invoiceHTML)
    win.document.close()
    win.print()
  }

  const tabs = [
    { id: 'products', label: 'Product List',  icon: Package },
    { id: 'update',   label: 'Update Stock',  icon: TrendingUp },
    { id: 'history',  label: 'History',       icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white">

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 bg-[#0f0a1a]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">ClothStock</h1>
              <p className="text-violet-400 text-xs mt-0.5">Manager Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm text-gray-300">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-6 pb-0">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200
                  ${activeTab === tab.id
                    ? 'border-violet-500 text-violet-300'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ===== TAB 1: PRODUCT LIST ===== */}
        {activeTab === 'products' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Product List</h2>
              <p className="text-gray-400 text-sm mt-1">View all products and current stock levels</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status'].map(h => (
                        <th key={h} className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-6 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{p.image}</span>
                            <div>
                              <p className="text-white font-medium text-sm">{p.name}</p>
                              <p className="text-gray-500 text-xs">{p.brand} · {p.size} · {p.color}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-violet-300 text-xs bg-violet-900/30 px-2 py-1 rounded-lg">{p.sku}</code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm capitalize">{p.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-semibold">₹{p.price.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">{p.stock}</span>
                          <span className="text-gray-500 text-xs ml-1">units</span>
                        </td>
                        <td className="px-6 py-4">
                          <StockBadge stock={p.stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 2: UPDATE STOCK ===== */}
        {activeTab === 'update' && (
          <div className="max-w-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Update Stock</h2>
              <p className="text-gray-400 text-sm mt-1">Add incoming stock or record outgoing sales</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

              {/* Operation Toggle: IN / OUT */}
              <div className="flex gap-3 mb-6">
                {/*
                  These are toggle buttons, not radio inputs.
                  We use state + onClick to control which is "active".
                */}
                <button
                  type="button"
                  onClick={() => setOperation('IN')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border
                    ${operation === 'IN'
                      ? 'bg-green-900/50 border-green-600/50 text-green-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Stock IN (Receive)
                </button>
                <button
                  type="button"
                  onClick={() => setOperation('OUT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border
                    ${operation === 'OUT'
                      ? 'bg-orange-900/50 border-orange-600/50 text-orange-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Stock OUT (Sell)
                </button>
              </div>

              {/* Update Form */}
              <form onSubmit={handleStockUpdate} className="space-y-4">

                {/* Product Selector */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Select Product</label>
                  <div className="relative">
                    <select
                      value={selectedProduct}
                      onChange={e => { setSelectedProduct(e.target.value); setUpdateError(''); setSuccessMsg('') }}
                      className="input-field appearance-none pr-10"
                      required
                    >
                      <option value="">— Choose a product —</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Stock: {p.stock}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Show selected product's current stock */}
                {selectedProduct && (() => {
                  const p = products.find(pr => pr.id === Number(selectedProduct))
                  return p ? (
                    <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.image}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{p.name}</p>
                          <p className="text-gray-400 text-xs">Current stock: {p.stock} units</p>
                        </div>
                      </div>
                      <StockBadge stock={p.stock} />
                    </div>
                  ) : null
                })()}

                {/* Quantity */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => { setQuantity(e.target.value); setUpdateError(''); setSuccessMsg('') }}
                    placeholder="Enter number of units"
                    className="input-field"
                    required
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                    Note <span className="text-gray-600 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={operation === 'IN' ? 'e.g. Received from supplier' : 'e.g. Customer order #42'}
                    className="input-field"
                  />
                </div>

                {/* Error message */}
                {updateError && (
                  <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                {/* Success message */}
                {successMsg && (
                  <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 text-green-300 text-sm rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className={`w-full font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2
                    ${operation === 'IN'
                      ? 'bg-gradient-to-r from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 text-white shadow-green-900/30'
                      : 'bg-gradient-to-r from-orange-700 to-orange-900 hover:from-orange-600 hover:to-orange-800 text-white shadow-orange-900/30'
                    }`}
                >
                  {operation === 'IN' ? (
                    <><ArrowDownCircle className="w-4 h-4" /> Confirm Stock IN</>
                  ) : (
                    <><ArrowUpCircle className="w-4 h-4" /> Confirm Stock OUT & Invoice</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===== TAB 3: TRANSACTION HISTORY ===== */}
        {activeTab === 'history' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Transaction History</h2>
              <p className="text-gray-400 text-sm mt-1">All stock movements and operations</p>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Operation icon */}
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                        tx.operation === 'IN'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-orange-900/40 text-orange-400'
                      }`}>
                        {tx.operation === 'IN'
                          ? <TrendingDown className="w-5 h-5" />
                          : <TrendingUp className="w-5 h-5" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold text-sm">{tx.productName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                            tx.operation === 'IN'
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-orange-900/50 text-orange-300'
                          }`}>
                            {tx.operation === 'IN' ? '+' : '-'}{tx.quantity} units
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">{tx.sku} · {tx.note}</p>
                        <p className="text-gray-600 text-xs mt-0.5">{tx.date} at {tx.time}</p>
                      </div>
                    </div>
                    {/* Total value for OUT transactions */}
                    {tx.operation === 'OUT' && tx.total && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-bold">₹{tx.total.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">₹{tx.price?.toLocaleString()} each</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ===== INVOICE MODAL ===== */}
      {invoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a0d30] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            {/* Invoice header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-bold text-white">Invoice Generated</h3>
              </div>
              <button onClick={() => setInvoice(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice preview */}
            <div className="bg-white/5 rounded-2xl p-5 space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Product</span>
                <span className="text-white font-medium">{invoice.productName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">SKU</span>
                <code className="text-violet-300">{invoice.sku}</code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Quantity</span>
                <span className="text-white">{invoice.quantity} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Unit Price</span>
                <span className="text-white">₹{invoice.price?.toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="text-gray-300 font-semibold">Total Amount</span>
                <span className="text-white font-bold text-lg">₹{invoice.total?.toLocaleString()}</span>
              </div>
              {invoice.customerNote && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Note</span>
                  <span className="text-gray-300">{invoice.customerNote}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Processed by</span>
                <span>{user?.name}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={() => setInvoice(null)} className="flex-1 btn-secondary">
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
