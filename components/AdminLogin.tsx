'use client'

import { useState } from 'react'
import { colors, cn } from '@/lib/colors'

interface AdminLoginProps {
  onLogin: (email: string, password: string) => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      onLogin(email, password)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      {/* Background texture */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(/Speckles.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <div className="relative z-10 max-w-md w-full space-y-8">
        <div>
          <h2 className={cn("mt-6 text-center text-3xl font-extrabold", colors.text.primary)}>
            Admin Access
          </h2>
          <p className={cn("mt-2 text-center text-sm", colors.text.secondary)}>
            Enter your credentials to access the admin panel
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={cn("appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-400 rounded-t-md focus:outline-none focus:z-10 sm:text-sm", colors.input.background, colors.input.border, colors.input.focus, colors.text.primary)}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={cn("appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-400 rounded-b-md focus:outline-none focus:z-10 sm:text-sm", colors.input.background, colors.input.border, colors.input.focus, colors.text.primary)}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={cn("group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50", colors.button.primary)}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}