import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function rateLimit(
  request: NextRequest,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number; resetTime: number } {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowStart = now - windowMs

  // Clean up old entries
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < windowStart) {
      delete store[key]
    }
  })

  // Get or create entry for this IP
  if (!store[ip]) {
    store[ip] = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  // Check if window has expired
  if (store[ip].resetTime < now) {
    store[ip] = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  // Increment count
  store[ip].count++

  const success = store[ip].count <= maxRequests
  const remaining = Math.max(0, maxRequests - store[ip].count)

  return {
    success,
    remaining,
    resetTime: store[ip].resetTime
  }
}
