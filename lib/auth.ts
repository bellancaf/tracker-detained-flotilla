import { NextRequest } from 'next/server'

export function verifyAdminAuth(request: NextRequest): { success: boolean; error?: string } {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { success: false, error: 'Missing or invalid authorization header' }
  }
  
  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  const [username, password] = credentials.split(':')
  
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminEmail || !adminPassword) {
    return { success: false, error: 'Admin credentials not configured' }
  }
  
  const isValid = username === adminEmail && password === adminPassword
  return { success: isValid, error: isValid ? undefined : 'Invalid credentials' }
}

export function getAuthHeaders(email: string, password: string) {
  const credentials = Buffer.from(`${email}:${password}`).toString('base64')
  return {
    'Authorization': `Basic ${credentials}`
  }
}