'use client'

import { useState, useEffect } from 'react'
import AdminSubmissions from '@/components/AdminSubmissions'
import AdminActivists from '@/components/AdminActivists'
import AdminLogin from '@/components/AdminLogin'
import { getAuthHeaders } from '@/lib/auth'
import { colors, cn } from '@/lib/colors'

interface Submission {
  id: string
  activistId: string | null
  eventDate: string
  sourceTitle: string
  description: string
  submitterEmail: string
  status: string
  createdAt: string
  reviewedAt: string | null
  activist: {
    id: string
    name: string
    nationality: string
    boatName: string
  } | null
}

interface Activist {
  id: string
  name: string
  nationality: string
  boatName: string
  status: string
  videoUrl: string | null
  createdAt: string
  updatedAt: string
  _count: {
    timelineEvents: number
  }
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activists, setActivists] = useState<Activist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'submissions' | 'activists'>('submissions')
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [activistFilter, setActivistFilter] = useState<'all' | 'detained' | 'released' | 'missing' | 'safe' | 'unknown'>('all')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authCredentials, setAuthCredentials] = useState<{email: string, password: string} | null>(null)

  useEffect(() => {
    if (isAuthenticated && authCredentials) {
      if (activeTab === 'submissions') {
        fetchSubmissions()
      } else {
        fetchActivists()
      }
    }
  }, [submissionFilter, activistFilter, activeTab, isAuthenticated, authCredentials])

  const fetchSubmissions = async () => {
    if (!authCredentials) return
    
    try {
      setLoading(true)
      const headers = getAuthHeaders(authCredentials.email, authCredentials.password)
      const response = await fetch(`/api/admin/submissions?filter=${submissionFilter}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      } else if (response.status === 401) {
        setIsAuthenticated(false)
        setAuthCredentials(null)
        setError('Authentication failed')
      } else {
        setError('Failed to fetch submissions')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivists = async () => {
    if (!authCredentials) return
    
    try {
      setLoading(true)
      const headers = getAuthHeaders(authCredentials.email, authCredentials.password)
      const response = await fetch(`/api/admin/activists?filter=${activistFilter}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setActivists(data)
      } else if (response.status === 401) {
        setIsAuthenticated(false)
        setAuthCredentials(null)
        setError('Authentication failed')
      } else {
        setError('Failed to fetch activists')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (email: string, password: string) => {
    setAuthCredentials({ email, password })
    setIsAuthenticated(true)
    setError('')
  }

  const handleSubmissionAction = async (submissionId: string, action: 'approve' | 'reject') => {
    if (!authCredentials) return
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(authCredentials.email, authCredentials.password)
      }
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          submissionId,
          action
        }),
      })

      if (response.ok) {
        // Refresh submissions
        fetchSubmissions()
      } else {
        setError('Failed to update submission')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const handleActivistUpdate = async (activistId: string, updates: Partial<Activist>) => {
    if (!authCredentials) return
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(authCredentials.email, authCredentials.password)
      }
      const response = await fetch('/api/admin/activists', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          activistId,
          updates
        }),
      })

      if (response.ok) {
        // Refresh activists
        fetchActivists()
      } else {
        setError('Failed to update activist')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const handleActivistDelete = async (activistId: string) => {
    if (!authCredentials) return
    
    try {
      const headers = getAuthHeaders(authCredentials.email, authCredentials.password)
      const response = await fetch(`/api/admin/activists?id=${activistId}`, {
        method: 'DELETE',
        headers,
      })

      if (response.ok) {
        // Refresh activists
        fetchActivists()
      } else {
        setError('Failed to delete activist')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-neutral-900">
      {/* Background texture */}
      <div 
        className="fixed inset-0 opacity-20 z-0"
        style={{
          backgroundImage: 'url(/Speckles.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Background text with dynamic opacity */}
      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div 
          className="text-center transition-opacity duration-2000"
          style={{ opacity: 0.05 }}
        >
          <h1 className="text-8xl md:text-9xl font-black text-white leading-tight">
            WE LEAVE
            <br />
            TOGETHER
          </h1>
          <div className="mt-8">
            <h2 className="text-6xl md:text-7xl font-black text-white">
              WE COME BACK
              <br />
              TOGETHER
            </h2>
          </div>
        </div>
      </div>

      <div className="relative z-20 space-y-6 pt-20 pb-8">
        <div className="text-center">
          <h1 className={cn("text-3xl font-bold mb-4", colors.text.primary)}>
            Admin Panel
          </h1>
          <p className={cn("text-lg", colors.text.secondary)}>
            Manage submissions and activist information
          </p>
        </div>

        {/* Main Tabs */}
        <div className={cn("border-b", colors.border.primary)}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('submissions')}
              className={cn("py-2 px-1 border-b-2 font-medium text-sm transition-colors", 
                activeTab === 'submissions'
                  ? 'border-green-500 text-green-400'
                  : cn('border-transparent', colors.text.tertiary, 'hover:text-gray-300 hover:border-gray-500')
              )}
            >
              Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('activists')}
              className={cn("py-2 px-1 border-b-2 font-medium text-sm transition-colors", 
                activeTab === 'activists'
                  ? 'border-green-500 text-green-400'
                  : cn('border-transparent', colors.text.tertiary, 'hover:text-gray-300 hover:border-gray-500')
              )}
            >
              Activists ({activists.length})
            </button>
          </nav>
        </div>

        {error && (
          <div className={cn("rounded-lg p-4 border", colors.background.card, colors.border.primary)}>
            <p className={cn("text-red-400", colors.text.primary)}>{error}</p>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'submissions' ? (
          <>
            {/* Submission Filter Tabs */}
            <div className={cn("border-b", colors.border.primary)}>
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'pending', label: 'Pending Review', count: submissions.filter(s => s.status === 'pending').length },
                  { key: 'approved', label: 'Approved', count: submissions.filter(s => s.status === 'approved').length },
                  { key: 'rejected', label: 'Rejected', count: submissions.filter(s => s.status === 'rejected').length },
                  { key: 'all', label: 'All Submissions', count: submissions.length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSubmissionFilter(tab.key as any)}
                    className={cn("py-2 px-1 border-b-2 font-medium text-sm transition-colors", 
                      submissionFilter === tab.key
                        ? 'border-green-500 text-green-400'
                        : cn('border-transparent', colors.text.tertiary, 'hover:text-gray-300 hover:border-gray-500')
                    )}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Submissions List */}
            <AdminSubmissions 
              submissions={submissions}
              onAction={handleSubmissionAction}
              filter={submissionFilter}
            />
          </>
        ) : (
          <>
            {/* Activist Filter Tabs */}
            <div className={cn("border-b", colors.border.primary)}>
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All Activists', count: activists.length },
                  { key: 'unknown', label: 'Unknown', count: activists.filter(a => a.status === 'unknown').length },
                  { key: 'detained', label: 'Detained', count: activists.filter(a => a.status === 'detained').length },
                  { key: 'released', label: 'Released', count: activists.filter(a => a.status === 'released').length },
                  { key: 'missing', label: 'Missing', count: activists.filter(a => a.status === 'missing').length },
                  { key: 'safe', label: 'Safe', count: activists.filter(a => a.status === 'safe').length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActivistFilter(tab.key as any)}
                    className={cn("py-2 px-1 border-b-2 font-medium text-sm transition-colors", 
                      activistFilter === tab.key
                        ? 'border-green-500 text-green-400'
                        : cn('border-transparent', colors.text.tertiary, 'hover:text-gray-300 hover:border-gray-500')
                    )}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Activists List */}
            <AdminActivists 
              activists={activists}
              onUpdate={handleActivistUpdate}
              onDelete={handleActivistDelete}
              filter={activistFilter}
            />
          </>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeTab === 'submissions' ? (
            <>
              <div className={cn("rounded-lg shadow-sm border p-6", colors.background.card, colors.border.accent)}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={cn("text-sm font-medium", colors.text.tertiary)}>Pending Review</p>
                    <p className={cn("text-2xl font-semibold", colors.text.primary)}>
                      {submissions.filter(s => s.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn("rounded-lg shadow-sm border p-6", colors.background.card, colors.border.accent)}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={cn("text-sm font-medium", colors.text.tertiary)}>Approved</p>
                    <p className={cn("text-2xl font-semibold", colors.text.primary)}>
                      {submissions.filter(s => s.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn("rounded-lg shadow-sm border p-6", colors.background.card, colors.border.accent)}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={cn("text-sm font-medium", colors.text.tertiary)}>Rejected</p>
                    <p className={cn("text-2xl font-semibold", colors.text.primary)}>
                      {submissions.filter(s => s.status === 'rejected').length}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={cn("rounded-lg shadow-sm border p-6", colors.background.card, colors.border.accent)}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={cn("text-sm font-medium", colors.text.tertiary)}>Total Activists</p>
                    <p className={cn("text-2xl font-semibold", colors.text.primary)}>
                      {activists.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn("rounded-lg shadow-sm border p-6", colors.background.card, colors.border.accent)}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={cn("text-sm font-medium", colors.text.tertiary)}>Detained/Missing</p>
                    <p className={cn("text-2xl font-semibold", colors.text.primary)}>
                      {activists.filter(a => a.status === 'detained' || a.status === 'missing').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn("rounded-lg shadow-sm border p-6", colors.background.card, colors.border.accent)}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={cn("text-sm font-medium", colors.text.tertiary)}>Safe/Released</p>
                    <p className={cn("text-2xl font-semibold", colors.text.primary)}>
                      {activists.filter(a => a.status === 'safe' || a.status === 'released').length}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
