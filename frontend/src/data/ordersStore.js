import { useSyncExternalStore } from 'react'
import { currentUser, initialOrders, sellerRatingSeeds } from './demoData.js'

const STORAGE_KEY = 'v-demo-orders'
const listeners = new Set()

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved)) return saved
  } catch {
    // Stockage indisponible ou corrompu : on repart des données de démonstration.
  }
  return initialOrders
}

let orders = load()
let sequence = orders.length

function commit(next) {
  orders = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // Persistance facultative.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function createOrder({ product, price }) {
  sequence += 1
  const order = {
    id: `cmd-${Date.now()}-${sequence}`,
    productId: product.id,
    productName: product.name,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    buyerId: currentUser.id,
    buyerName: currentUser.name,
    price,
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null,
    rating: null,
  }
  commit([order, ...orders])
  return order
}

export function updateOrderStatus(orderId, status) {
  commit(
    orders.map((order) =>
      order.id === orderId
        ? { ...order, status, completedAt: status === 'completed' ? new Date().toISOString() : null }
        : order,
    ),
  )
}

export function rateOrder(orderId, stars, comment) {
  commit(
    orders.map((order) =>
      order.id === orderId && order.status === 'completed' && !order.rating
        ? { ...order, rating: { stars, comment: comment.trim(), createdAt: new Date().toISOString() } }
        : order,
    ),
  )
}

export function getSellerRating(sellerId, allOrders) {
  const seed = sellerRatingSeeds[sellerId] ?? { average: 0, count: 0 }
  const rated = allOrders.filter((order) => order.sellerId === sellerId && order.rating)
  const count = seed.count + rated.length
  if (!count) return { average: 0, count: 0 }
  const total = seed.average * seed.count + rated.reduce((sum, order) => sum + order.rating.stars, 0)
  return { average: total / count, count }
}

export function useOrders() {
  return useSyncExternalStore(subscribe, () => orders)
}
