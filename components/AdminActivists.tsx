'use client'

import { useState } from 'react'
import { colors, cn } from '@/lib/colors'

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

interface AdminActivistsProps {
  activists: Activist[]
  onUpdate: (activistId: string, updates: Partial<Activist>) => Promise<void>
  onDelete: (activistId: string) => Promise<void>
  filter: 'all' | 'detained' | 'released' | 'missing' | 'safe' | 'unknown'
}

export default function AdminActivists({ activists, onUpdate, onDelete, filter }: AdminActivistsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Activist>>({})
  const [isUpdating, setIsUpdating] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'detained':
        return 'bg-red-500 text-white'
      case 'released':
        return 'bg-green-500 text-white'
      case 'missing':
        return 'bg-red-600 text-white'
      case 'safe':
        return 'bg-green-600 text-white'
      case 'unknown':
        return 'bg-gray-600 text-white'
      default:
        return 'bg-neutral-600 text-white'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()
    return `${month}/${day}/${year}`
  }

  const filteredActivists = filter === 'all' 
    ? activists 
    : activists.filter(a => a.status.toLowerCase() === filter)

  const handleEdit = (activist: Activist) => {
    setEditingId(activist.id)
    setEditForm({
      name: activist.name,
      nationality: activist.nationality,
      boatName: activist.boatName,
      status: activist.status,
      videoUrl: activist.videoUrl
    })
  }

  const handleSave = async () => {
    if (!editingId) return
    
    try {
      setIsUpdating(true)
      await onUpdate(editingId, editForm)
      setEditingId(null)
      setEditForm({})
    } catch (error) {
      console.error('Failed to update activist:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleDelete = async (activistId: string) => {
    if (confirm('Are you sure you want to delete this activist? This action cannot be undone.')) {
      try {
        await onDelete(activistId)
      } catch (error) {
        console.error('Failed to delete activist:', error)
      }
    }
  }

  return (
    <div className="space-y-4">
      {filteredActivists.length === 0 ? (
        <div className="text-center py-8">
          <div className={cn("mb-2", colors.text.tertiary)}>
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className={cn("text-lg font-medium mb-2", colors.text.primary)}>
            No {filter === 'all' ? '' : filter} activists
          </h3>
          <p className={cn(colors.text.secondary)}>
            {filter === 'all' 
              ? 'No activists found in the database.'
              : 'No activists match this status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivists.map((activist) => (
            <div key={activist.id} className={cn("rounded-lg shadow-sm border p-6", colors.background.card, colors.border.accent)}>
              {editingId === activist.id ? (
                // Edit Form
                <div className="space-y-4">
                  <h3 className={cn("text-lg font-semibold", colors.text.primary)}>
                    Edit Activist
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
                        Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
                        Nationality *
                      </label>
                      <input
                        type="text"
                        value={editForm.nationality || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                        className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
                        Boat Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.boatName || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, boatName: e.target.value }))}
                        className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
                        Status *
                      </label>
                      <select
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                        className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
                        required
                      >
                        <option value="unknown">Unknown</option>
                        <option value="detained">Detained</option>
                        <option value="released">Released</option>
                        <option value="missing">Missing</option>
                        <option value="safe">Safe</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
                      Video URL
                    </label>
                    <input
                      type="url"
                      value={editForm.videoUrl || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://example.com/video"
                      className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={isUpdating}
                      className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50", colors.button.primary)}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", colors.button.secondary)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className={cn("text-lg font-semibold", colors.text.primary)}>
                        {activist.name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activist.status)}`}>
                        {activist.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={cn("text-sm", colors.text.secondary)}>
                          <span className={cn("font-medium", colors.text.tertiary)}>Nationality:</span> {activist.nationality}
                        </p>
                        <p className={cn("text-sm", colors.text.secondary)}>
                          <span className={cn("font-medium", colors.text.tertiary)}>Boat:</span> {activist.boatName}
                        </p>
                      </div>
                      <div>
                        <p className={cn("text-sm", colors.text.secondary)}>
                          <span className={cn("font-medium", colors.text.tertiary)}>Created:</span> {formatDate(activist.createdAt)}
                        </p>
                        <p className={cn("text-sm", colors.text.secondary)}>
                          <span className={cn("font-medium", colors.text.tertiary)}>Timeline Events:</span> {activist._count.timelineEvents}
                        </p>
                      </div>
                    </div>

                    {activist.videoUrl && (
                      <div className="mb-4">
                        <p className={cn("text-sm", colors.text.secondary)}>
                          <span className={cn("font-medium", colors.text.tertiary)}>Video:</span>{' '}
                          <a 
                            href={activist.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={cn("transition-colors", colors.link.primary)}
                          >
                            View Video
                          </a>
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <a 
                        href={`/activist/${activist.id}`}
                        className={cn("text-sm font-medium transition-colors", colors.link.primary)}
                      >
                        View Public Profile →
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleEdit(activist)}
                      className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", colors.button.secondary)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(activist.id)}
                      className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", colors.button.danger)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
