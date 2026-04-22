/*
  ==========================================
  data.js — Shared Mock Data
  ==========================================
  
  In a real app, this data would come from your 
  Node.js + Express + PostgreSQL backend via API calls like:
    fetch('/api/products')
    fetch('/api/products/1')
  
  For now, we store it here as JavaScript arrays.
  
  We export it so both Admin and Manager pages can use the same data.
  This is called "single source of truth" — one place for data.
*/

export const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Premium Cotton Shirt',
    category: 'shirt',
    sku: 'SHT-001',          // SKU = Stock Keeping Unit (unique product code)
    price: 1299,              // Price in INR
    stock: 45,
    size: 'M',
    color: 'White',
    brand: 'ArrowMen',
    image: '👔',             // Emoji as placeholder for product image
  },
  {
    id: 2,
    name: 'Slim Fit Chinos',
    category: 'pant',
    sku: 'PNT-001',
    price: 1899,
    stock: 30,
    size: '32',
    color: 'Beige',
    brand: 'Peter England',
    image: '👖',
  },
  {
    id: 3,
    name: 'Formal Linen Shirt',
    category: 'shirt',
    sku: 'SHT-002',
    price: 1599,
    stock: 8,                 // Low stock! (below 10)
    size: 'L',
    color: 'Light Blue',
    brand: 'Van Heusen',
    image: '👔',
  },
  {
    id: 4,
    name: 'Stretch Denim Jeans',
    category: 'pant',
    sku: 'PNT-002',
    price: 2499,
    stock: 22,
    size: '34',
    color: 'Dark Blue',
    brand: 'Levis',
    image: '👖',
  },
  {
    id: 5,
    name: 'Polo T-Shirt',
    category: 'shirt',
    sku: 'SHT-003',
    price: 899,
    stock: 0,                 // Out of stock!
    size: 'XL',
    color: 'Navy',
    brand: 'US Polo',
    image: '👕',
  },
  {
    id: 6,
    name: 'Cargo Pants',
    category: 'pant',
    sku: 'PNT-003',
    price: 1699,
    stock: 15,
    size: '33',
    color: 'Olive Green',
    brand: 'Woodland',
    image: '👖',
  },
]

// Stock status helper — tells us the state of a product's stock
// This is a "pure function" — given stock number, returns a label
export function getStockStatus(stock) {
  if (stock === 0)   return { label: 'Out of Stock', color: 'red'    }
  if (stock < 10)    return { label: 'Low Stock',    color: 'amber'  }
  return               { label: 'In Stock',      color: 'green'  }
}