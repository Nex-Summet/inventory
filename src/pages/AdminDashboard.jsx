/*
  ==========================================
  AdminDashboard.jsx — Admin Panel
  ==========================================
  
  FEATURES:
    1. View all products in a table
    2. Add new product (modal form)
    3. Edit existing product (same modal, pre-filled)
    4. Delete product (with confirmation)
    5. Stock status indicators
    6. Summary stats (total products, low stock, out of stock)
    7. Logout
  
  CONCEPTS COVERED:
    - useState for local component state
    - Conditional rendering (show/hide modal)
    - Array methods: map, filter, find, findIndex
    - Lifting state (managing products array at top level)
    - Modal pattern
*/

import { useState } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { INITIAL_PRODUCTS, getStockStatus } from '../data'
import {
  LogOut, Plus, Pencil, Trash2, Package, AlertTriangle,
  XCircle, Search, X, ShoppingBag, BarChart3, ChevronDown
} from 'lucide-react'

// ---- Sub-component: StatCard ----
// A small reusable card for showing a single number/stat
// Props let us customize what each card shows
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
        <div className={`p-2 rounded-xl bg-white/5`}>
          <Icon className={`w-5 h-5 ${colors[color].split(' ').pop()}`} />
        </div>
      </div>
    </div>
  )
}

// ---- Sub-component: StockBadge ----
// Shows colored badge based on stock level
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

// ---- Default export: Main Admin Dashboard Component ----
export default function AdminDashboard() {
  const navigate  = useNavigate()
  const { user, logout } = useAuth()

  /*
    products — the main data array
    We initialize it with INITIAL_PRODUCTS from data.js
    All CRUD operations modify this state array
  */
  const [products, setProducts] = useState(INITIAL_PRODUCTS)

  // Search input value
  const [search, setSearch] = useState('')

  // Category filter: 'all', 'shirt', 'pant'
  const [filterCat, setFilterCat] = useState('all')

  /*
    Modal state:
    - showModal: true/false — is the modal open?
    - editProduct: null (add mode) or a product object (edit mode)
  */
  const [showModal,   setShowModal]   = useState(false)
  const [editProduct, setEditProduct] = useState(null)

  // Delete confirmation modal
  const [deleteId, setDeleteId] = useState(null)

  /*
    formData — controlled form state for the add/edit modal
    Each key matches a product property
  */
  const emptyForm = {
    name: '', category: 'shirt', sku: '', price: '',
    stock: '', size: '', color: '', brand: '', image: '👔'
  }
  const [formData, setFormData] = useState(emptyForm)

  // ---- DERIVED DATA (computed from state, not stored separately) ----
  
  /*
    filteredProducts — we don't store this in state.
    We compute it fresh every render from the current products + search + filter.
    This ensures it's always in sync.
  */
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || p.category === filterCat
    return matchSearch && matchCat
  })

  const totalProducts = products.length
  const lowStock      = products.filter(p => p.stock > 0 && p.stock < 10).length
  const outOfStock    = products.filter(p => p.stock === 0).length
  const totalValue    = products.reduce((sum, p) => sum + p.price * p.stock, 0)

  // ---- HANDLER FUNCTIONS ----

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Opens the modal in ADD mode (no pre-filled data)
  const openAddModal = () => {
    setEditProduct(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  // Opens the modal in EDIT mode (pre-fills form with product data)
  const openEditModal = (product) => {
    setEditProduct(product)
    // Spread copies all product properties into formData
    setFormData({ ...product })
    setShowModal(true)
  }

  // Closes modal and resets form
  const closeModal = () => {
    setShowModal(false)
    setEditProduct(null)
    setFormData(emptyForm)
  }

  /*
    handleFormChange — universal change handler for all form inputs
    
    "name" attribute on each input matches the formData key.
    e.target.name = the input's name attribute
    e.target.value = what the user typed
    
    Spread operator (...formData) copies existing values,
    then [e.target.name] overwrites just the changed field.
    This is the React pattern for updating nested state.
  */
  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  /*
    handleSave — Add or Edit a product
    
    If editProduct exists → we're editing (find and replace in array)
    If editProduct is null → we're adding (append to array)
  */
  const handleSave = (e) => {
    e.preventDefault()

    const product = {
      ...formData,
      price: Number(formData.price),  // Convert string to number
      stock: Number(formData.stock),
      image: formData.category === 'shirt' ? '👔' : '👖',
    }

    if (editProduct) {
      // EDIT: map through array, replace matching product
      setProducts(prev =>
        prev.map(p => p.id === editProduct.id ? { ...product, id: editProduct.id } : p)
      )
    } else {
      // ADD: create new product with unique ID (timestamp)
      const newProduct = { ...product, id: Date.now() }
      setProducts(prev => [...prev, newProduct])
    }

    closeModal()
  }

  // DELETE: filter out the product with matching id
  const handleDelete = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    setDeleteId(null)
  }

  // ---- RENDER ----
  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white">

      {/* ===== HEADER / NAVBAR ===== */}
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
            {/* User info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm text-gray-300">{user?.name}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Page title + Add button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Inventory</h2>
            <p className="text-gray-400 text-sm mt-1">Manage your clothing stock</p>
          </div>
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* ===== STATS GRID ===== */}
        {/*
          grid-cols-2 on mobile, grid-cols-4 on large screens
          Tailwind responsive prefix: "lg:grid-cols-4" means:
          "apply grid-cols-4 when screen is lg (1024px) or wider"
        */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package}       label="Total Products" value={totalProducts} color="purple" />
          <StatCard icon={BarChart3}     label="Inventory Value" value={`₹${(totalValue/1000).toFixed(0)}K`} color="green" />
          <StatCard icon={AlertTriangle} label="Low Stock"      value={lowStock}     color="amber" />
          <StatCard icon={XCircle}       label="Out of Stock"   value={outOfStock}   color="red" />
        </div>

        {/* ===== FILTERS ROW ===== */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">

          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>

          {/* Category filter dropdown */}
          <div className="relative">
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="input-field pr-10 appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all">All Categories</option>
              <option value="shirt">Shirts</option>
              <option value="pant">Pants</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* ===== PRODUCTS TABLE ===== */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-16">
                      No products found
                    </td>
                  </tr>
                ) : (
                  /*
                    .map() transforms each product into a <tr> row.
                    key={p.id} is required — React uses it to track rows efficiently.
                    Without key, React can't tell which row changed and re-renders all.
                  */
                  filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors duration-150 group">
                      {/* Product name + image */}
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
                        <code className="text-purple-300 text-xs bg-purple-900/30 px-2 py-1 rounded-lg">{p.sku}</code>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg transition-all"
                            title="Edit product"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete button — sets deleteId to show confirmation */}
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-2 text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-all"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-6 py-3 border-t border-white/10 bg-white/3">
            <p className="text-gray-500 text-xs">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        </div>
      </main>

      {/* ===== ADD / EDIT MODAL ===== */}
      {/*
        CONDITIONAL RENDERING: {showModal && <Component />}
        When showModal is false, nothing is rendered.
        When showModal is true, the modal appears.
        This is the React way to show/hide elements.
      */}
      {showModal && (
        /*
          Modal backdrop — the dark overlay behind the modal.
          Clicking the backdrop closes the modal (onClick={closeModal}).
          
          fixed + inset-0 = covers the entire screen.
          z-50 = appears above everything else.
          flex items-center justify-center = centers the modal card.
        */
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}  // Click outside = close
        >
          {/*
            e.stopPropagation() prevents the click from bubbling up
            to the backdrop's onClick, so clicking inside the modal
            doesn't close it.
          */}
          <div
            className="bg-[#1a0d30] border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="col-span-2">
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Product Name</label>
                  <input
                    name="name"           // matches formData key
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Cotton Formal Shirt"
                    className="input-field"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Category</label>
                  <select name="category" value={formData.category} onChange={handleFormChange} className="input-field">
                    <option value="shirt">Shirt</option>
                    <option value="pant">Pant</option>
                  </select>
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">SKU</label>
                  <input
                    name="sku"
                    value={formData.sku}
                    onChange={handleFormChange}
                    placeholder="e.g. SHT-004"
                    className="input-field"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="1299"
                    className="input-field"
                    min="0"
                    required
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Stock (units)</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleFormChange}
                    placeholder="50"
                    className="input-field"
                    min="0"
                    required
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Size</label>
                  <input
                    name="size"
                    value={formData.size}
                    onChange={handleFormChange}
                    placeholder="M / 32"
                    className="input-field"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Color</label>
                  <input
                    name="color"
                    value={formData.color}
                    onChange={handleFormChange}
                    placeholder="White"
                    className="input-field"
                  />
                </div>

                {/* Brand */}
                <div className="col-span-2">
                  <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Brand</label>
                  <input
                    name="brand"
                    value={formData.brand}
                    onChange={handleFormChange}
                    placeholder="e.g. Arrow, Levis"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Modal action buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a0d30] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Product?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone. The product will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
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
