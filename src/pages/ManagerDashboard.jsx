import { useState, useEffect } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LogOut, ArrowDownCircle, ArrowUpCircle, FileText,
  ShoppingBag, TrendingUp, TrendingDown, Package,
  ChevronDown, Printer, X, CheckCircle, AlertCircle
} from 'lucide-react'

// ---- Helpers ----
function getStockStatus(stock) {
  if (stock === 0)   return { label: 'Out of Stock', color: 'red'    }
  if (stock < 10)    return { label: 'Low Stock',    color: 'amber'  }
  return               { label: 'In Stock',         color: 'green'  }
}

// ---- StockBadge ----
function StockBadge({ stock }) {
  const { label, color } = getStockStatus(stock)
  const styles = {
    red: 'bg-red-900/40 text-red-300 border-red-700/40',
    amber: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
    green: 'bg-green-900/40 text-green-300 border-green-700/40',
  }
  return (
    <span className={`px-2 py-1 text-xs border rounded ${styles[color]}`}>
      {label}
    </span>
  )
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('products')

  const [selectedProduct, setSelectedProduct] = useState('')
  const [operation, setOperation] = useState('OUT')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [transactions, setTransactions] = useState([])
  const [invoice, setInvoice] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

  // FETCH PRODUCTS FROM API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/products`,
          { credentials: "include" }
        )
        const result = await res.json()

        if (!res.ok || !result.success) {
          console.log("Error fetching products", result.message)
          setProducts([])
          return
        }

        const items = result.data || []

        const formatted = items.map(p => ({
          id: p.productId || p.id,
          name: p.productName || p.name || 'Unnamed',
          sku: (p.productId || p.id || '').toString().slice(0, 6).toUpperCase(),
          price: Number(p.price || p.itemPrice || 0),
          stock: Number((p.stockIn ?? p.stock ?? 0) - (p.stockOut ?? 0)),
          image: (p.categoryName || p.category) === 'pant' ? '👖' : '👔'
        }))

        setProducts(formatted)
      } catch (err) {
        console.log("Fetch error:", err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // STOCK UPDATE WITH API
  const handleStockUpdate = async (e) => {
    e.preventDefault()
    setUpdateError('')
    setSuccessMsg('')

    const product = products.find(p => p.id === selectedProduct)
    if (!product) {
      setUpdateError('Select product')
      return
    }

    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setUpdateError('Invalid quantity')
      return
    }

    if (operation === 'OUT' && product.stock < qty) {
      setUpdateError('Not enough stock')
      return
    }

    const newStock =
      operation === 'IN'
        ? product.stock + qty
        : product.stock - qty

    try {
      const res = await fetch(
        `${API_BASE}/api/products/${product.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: product.name,
            price: product.price,
            stock: newStock
          })
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setUpdateError(data.message || "Update failed")
        return
      }

      // update UI
      setProducts(prev =>
        prev.map(p =>
          p.id === product.id ? { ...p, stock: newStock } : p
        )
      )

      const tx = {
        id: Date.now(),
        productName: product.name,
        sku: product.sku,
        operation,
        quantity: qty,
        note,
        price: product.price,
        total: product.price * qty,
        time: new Date().toLocaleTimeString(),
        date: "Today"
      }

      setTransactions(prev => [tx, ...prev])

      if (operation === 'OUT') {
        setInvoice(tx)
      }

      setSuccessMsg("Stock updated ✅")
      setQuantity('')
      setNote('')
      setSelectedProduct('')
    } catch (err) {
      console.log(err)
      setUpdateError("Server error")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const tabs = [
    { id: 'products', label: 'Product List', icon: Package },
    { id: 'update', label: 'Update Stock', icon: TrendingUp },
    { id: 'history', label: 'History', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white">

      {/* HEADER */}
      <header className="p-4 flex justify-between border-b border-white/10 items-center">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-purple-400" />
          <h1 className="font-bold text-lg">Manager Dashboard</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </header>

      {/* TABS */}
      <div className="flex gap-2 p-4 border-b border-white/10">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <main className="p-6 max-w-6xl mx-auto">

        {/* PRODUCTS */}
        {activeTab === 'products' && (
          <>
            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-sm flex items-center gap-3">
                          <span className="text-lg">{p.image}</span>
                          <span className="text-white">{p.name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 font-mono">{p.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">₹{p.price}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{p.stock}</td>
                        <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* UPDATE */}
        {activeTab === 'update' && (
          <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Update Stock</h3>

            <form onSubmit={handleStockUpdate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Product</label>
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="" className="bg-[#1a1025]">Select product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#1a1025]">
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Operation</label>
                <div className="flex gap-2">
                  {['IN', 'OUT'].map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperation(op)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        operation === op
                          ? op === 'IN'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {op === 'IN' ? 'Stock In' : 'Stock Out'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {updateError && (
                <div className="text-red-400 text-sm bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
                  {updateError}
                </div>
              )}
              {successMsg && (
                <div className="text-green-400 text-sm bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-2">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
              >
                Update Stock
              </button>
            </form>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Op</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{tx.productName}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        tx.operation === 'IN'
                          ? 'bg-green-900/40 text-green-300'
                          : 'bg-red-900/40 text-red-300'
                      }`}>
                        {tx.operation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{tx.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">₹{tx.total}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{tx.time}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  )
}

