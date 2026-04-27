import { useState, useEffect } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LogOut, Plus, Pencil, Trash2, Package, AlertTriangle,
  XCircle, Search, X, ShoppingBag, BarChart3
} from 'lucide-react'

const API_BASE = "http://localhost:8000"
const API = `${API_BASE}/api/products`

// ---- Helpers ----
function getStockStatus(stock) {
  if (stock === 0) return { label: 'Out of Stock', color: 'red' }
  if (stock < 10)  return { label: 'Low Stock',    color: 'amber' }
  return             { label: 'In Stock',         color: 'green' }
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    purple: 'from-purple-600/20 to-purple-800/10 border-purple-700/30 text-purple-300',
    amber:  'from-amber-600/20 to-amber-800/10 border-amber-700/30 text-amber-300',
    red:    'from-red-600/20 to-red-800/10 border-red-700/30 text-red-300',
    green:  'from-green-600/20 to-green-800/10 border-green-700/30 text-green-300',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-xl bg-white/5">
          <Icon className={`w-5 h-5 ${colors[color].split(' ').pop()}`} />
        </div>
      </div>
    </div>
  )
}

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

// ---- API Helper — handles auth token from localStorage as fallback ----
async function apiFetch(url, options = {}) {
  // Try to get token from localStorage (set during login)
  const token = localStorage.getItem('authToken') || localStorage.getItem('token') || ''

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }

  const config = {
    credentials: 'include',           // send cookies if present
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  }

  const res = await fetch(url, config)
  return res
}

// ---- Normalize product from backend response ----
// Category UUID → name mapping (add your real UUIDs here)
const CATEGORY_MAP = {
  'a694bf32-70fd-44ee-85bc-260fa6f72336': 'shirt',
  '64c37978-6c3b-4b45-af6f-8add9ad9ac1c': 'shirt',
  '85cf317a-73e0-48c6-91a7-ac9a95ee755f': 'cap',
  '797e893d-43de-43bb-907b-0a3f6dc668ba': 'sweater',
  'd1dde5e5-60a7-4b90-b096-da64aa9bfb6c': 'sweater',
  // ... add more as needed
}

const CATEGORY_EMOJI = {
  pant: '👖', shirt: '👔', cap: '🧢', sweater: '🧥',
}

function normalizeProduct(item) {
  const rawStock =
    Number(item.stockIn ?? item.stock ?? 0) - Number(item.stockOut ?? 0)

  // Resolve category: name > UUID lookup > fallback
  const cat = (
    item.categoryName ||
    item.category ||
    CATEGORY_MAP[item.categoryId] ||
    'unknown'
  ).toLowerCase()

  return {
    id:       item.productId || item._id || item.id,
    name:     item.productName || item.name || 'Unnamed',
    category: cat,
    sku:      String(item.productId || '').slice(0, 6).toUpperCase(),
    price:    Number(item.price || item.itemPrice || 0),
    stock:    rawStock,
    size:     item.size || '—',
    color:    item.color || '—',
    brand:    item.brand || '—',
    image:    CATEGORY_EMOJI[cat] || '📦',
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [apiError, setApiError]   = useState('')
  const [stats, setStats]         = useState(null)

  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const [showModal, setShowModal]     = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteId, setDeleteId]       = useState(null)
  const [saving, setSaving]           = useState(false)

  const emptyForm = {
    name: '', category: 'shirt', price: '', stock: '',
    size: '', color: '', brand: '',
  }
  const [formData, setFormData] = useState(emptyForm)

  // ---- Fetch on mount ----
  useEffect(() => {
    fetchProducts()
    fetchCardDetails()
  }, [])

  const fetchProducts = async () => {
    setApiError('')
    try {
      const res = await apiFetch(API)

      // Check for non-JSON (HTML error pages, proxy blocks)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text)
        setApiError(`Server returned unexpected response (status ${res.status}). Check if you are logged in and the API is running.`)
        setProducts([])
        return
      }

      const result = await res.json()

      if (!res.ok || result.success === false) {
        setApiError(result.message || `Request failed with status ${res.status}`)
        setProducts([])
        return
      }

      // Backend might return array directly OR { data: [...] }
      const items = Array.isArray(result) ? result : (result.data || [])
      setProducts(items.map(normalizeProduct))
    } catch (err) {
      console.error('Fetch error:', err)
      setApiError('Could not connect to server. Make sure the API is running and CORS allows your origin.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCardDetails = async () => {
    try {
      const res = await apiFetch(`${API}/carddetails`)
      if (!res.ok) return
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) return
      const result = await res.json()
      if (result.success !== false) {
        setStats(result.data || result)
      }
    } catch { /* optional endpoint — ignore errors */ }
  }

  // ---- Filtered list ----
  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase()
    return (
      (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
      (filterCat === 'all' || p.category === filterCat)
    )
  })

  // ---- Computed stats ----
const totalProducts = stats?.totalProducts ?? products.length
const lowStock      = stats?.lowStock      ?? products.filter(p => p.stock > 0 && p.stock < 10).length
const outOfStock    = stats?.outOfStock    ?? products.filter(p => p.stock === 0).length
const totalValue    = stats?.totalValue    ?? products.reduce((s, p) => s + p.price * p.stock, 0)
  // ---- Auth ----
  const handleLogout = () => { logout(); navigate('/login') }

  // ---- Modal ----
  const openAddModal  = () => { setEditProduct(null); setFormData(emptyForm); setShowModal(true) }
  const openEditModal = (p) => { setEditProduct(p); setFormData({ ...p }); setShowModal(true) }
  const closeModal    = () => { setShowModal(false); setEditProduct(null); setFormData(emptyForm) }
  const handleFormChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // ---- Save (create / update) ----
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let res, result

      if (editProduct) {
        // PUT /api/products/:id
        res = await apiFetch(`${API}/${editProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name:  formData.name,
            price: Number(formData.price),
            stock: Number(formData.stock),
          }),
        })
      } else {
        // POST /api/products
        res = await apiFetch(API, {
          method: 'POST',
          body: JSON.stringify({
            name:      formData.name,
            categorys: formData.category,   // backend key is "categorys"
            price:     Number(formData.price),
            stock:     Number(formData.stock),
          }),
        })
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        alert(`Server error (${res.status}): ${text.slice(0, 200)}`)
        return
      }

      result = await res.json()
      if (!res.ok || result.success === false) {
        alert(result.message || `Operation failed (${res.status})`)
        return
      }

      await fetchProducts()
      closeModal()
    } catch (err) {
      console.error('Save error:', err)
      alert('Network error — could not save product.')
    } finally {
      setSaving(false)
    }
  }

  // ---- Delete ----
  const handleDelete = async (id) => {
    try {
      const res = await apiFetch(`${API}/${id}`, { method: 'DELETE' })
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const result = await res.json()
        if (!res.ok || result.success === false) {
          alert(result.message || 'Delete failed')
          return
        }
      } else if (!res.ok) {
        alert(`Delete failed (${res.status})`)
        return
      }
      await fetchProducts()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Network error — could not delete product.')
    }
    setDeleteId(null)
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0f0a1a]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-violet-800 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">ClothStock</h1>
              <p className="text-purple-400 text-xs mt-0.5">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
              <span className="text-sm text-gray-300">{user?.name || user?.email || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* API Error Banner */}
        {apiError && (
          <div className="mb-6 bg-red-900/30 border border-red-700/40 rounded-xl px-5 py-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium text-sm">API Error</p>
              <p className="text-red-400/80 text-xs mt-0.5">{apiError}</p>
            </div>
            <button
              onClick={fetchProducts}
              className="ml-auto text-xs text-red-300 hover:text-white underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Inventory</h2>
            <p className="text-gray-400 text-sm mt-1">Manage your clothing stock</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package}      label="Total Products"   value={totalProducts} color="purple" />
          <StatCard icon={BarChart3}    label="Inventory Value"  value={`₹${(totalValue / 1000).toFixed(1)}K`} color="green" />
          <StatCard icon={AlertTriangle} label="Low Stock"       value={lowStock}      color="amber" />
          <StatCard icon={XCircle}      label="Out of Stock"     value={outOfStock}    color="red" />
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="all">All Categories</option>
            <option value="shirt">Shirt</option>
            <option value="pant">Pant</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{p.image}</span>
                      <div>
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{p.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">{p.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">₹{p.price}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{p.stock}</td>
                  <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-400 hover:text-purple-300 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    {apiError ? '⚠️ Could not load products — check the error above.' : 'No products found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a1025] border border-white/10 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name *</label>
                <input
                  name="name" value={formData.name}
                  onChange={handleFormChange} required
                  placeholder="e.g. Blue Formal Shirt"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category *</label>
                  <select
                    name="category" value={formData.category}
                    onChange={handleFormChange}
                    disabled={!!editProduct}   /* category usually not editable on update */
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                  >
                    <option value="shirt">Shirt</option>
                    <option value="pant">Pant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Price (₹) *</label>
                  <input
                    name="price" type="number" min="0" value={formData.price}
                    onChange={handleFormChange} required placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Stock *</label>
                  <input
                    name="stock" type="number" min="0" value={formData.stock}
                    onChange={handleFormChange} required placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Size</label>
                  <input
                    name="size" value={formData.size}
                    onChange={handleFormChange} placeholder="M / L / XL"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Color</label>
                  <input
                    name="color" value={formData.color}
                    onChange={handleFormChange} placeholder="e.g. Navy Blue"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Brand</label>
                  <input
                    name="brand" value={formData.brand}
                    onChange={handleFormChange} placeholder="e.g. Allen Solly"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button" onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium transition-colors"
                >
                  {saving ? 'Saving...' : editProduct ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a1025] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
            <p className="text-gray-400 text-sm mb-6">Ye action undo nahi ho sakta.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}