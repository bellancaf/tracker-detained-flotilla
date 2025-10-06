'use client'

import { useState } from 'react'
import Link from 'next/link'
import { colors, cn } from '@/lib/colors'

interface TimelineEvent {
  id: string
  eventDate: string
  sourceTitle: string
  description: string
}

interface Activist {
  id: string
  name: string
  nationality: string
  boatName: string
  status: string
  createdAt: string
  updatedAt: string
  timelineEvents: TimelineEvent[]
  _count: {
    timelineEvents: number
  }
}

interface ActivistsTableProps {
  activists: Activist[]
}

export default function ActivistsTable({ activists }: ActivistsTableProps) {
  const [sortField, setSortField] = useState<keyof Activist | 'latestUpdate'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Get unique statuses for filter
  const statuses = Array.from(new Set(activists.map(a => a.status)))

  // Filter and sort activists
  const filteredActivists = activists
    .filter(activist => {
      const matchesSearch = activist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activist.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activist.boatName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || activist.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      
      if (sortField === 'latestUpdate') {
        // Sort by latest timeline event date
        aValue = a.timelineEvents.length > 0 ? new Date(a.timelineEvents[0].eventDate) : new Date(0)
        bValue = b.timelineEvents.length > 0 ? new Date(b.timelineEvents[0].eventDate) : new Date(0)
        return sortDirection === 'asc' 
          ? (aValue as Date).getTime() - (bValue as Date).getTime()
          : (bValue as Date).getTime() - (aValue as Date).getTime()
      } else {
        aValue = a[sortField]
        bValue = b[sortField]
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortDirection === 'asc' 
        ? (aValue < bValue ? -1 : 1)
        : (bValue < aValue ? -1 : 1)
    })

  const handleSort = (field: keyof Activist | 'latestUpdate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

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
      default:
        return 'bg-gray-600 text-white'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="px-6 py-4 border-b bg-neutral-800/50 border-neutral-600">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, nationality, or boat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500 focus:ring-green-500"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent bg-neutral-800 border-neutral-600 text-white focus:ring-green-500"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-700">
          <thead className="bg-neutral-800/50">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors text-neutral-400 hover:bg-neutral-800/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  {sortField === 'name' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors text-neutral-400 hover:bg-neutral-800/50"
                onClick={() => handleSort('nationality')}
              >
                <div className="flex items-center">
                  Nationality
                  {sortField === 'nationality' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors text-neutral-400 hover:bg-neutral-800/50"
                onClick={() => handleSort('boatName')}
              >
                <div className="flex items-center">
                  Boat
                  {sortField === 'boatName' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors text-neutral-400 hover:bg-neutral-800/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {sortField === 'status' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors text-neutral-400 hover:bg-neutral-800/50"
                onClick={() => handleSort('latestUpdate')}
              >
                <div className="flex items-center">
                  Latest Update
                  {sortField === 'latestUpdate' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Timeline Events</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-neutral-900/50 divide-neutral-700">
            {filteredActivists.map((activist) => (
              <tr 
                key={activist.id}
                className="cursor-pointer transition-colors hover:bg-neutral-800/50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <Link 
                    href={`/activist/${activist.id}`}
                    className="font-medium text-green-400 hover:text-green-300 transition-colors"
                  >
                    {activist.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-200">{activist.nationality}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-200">{activist.boatName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-200">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activist.status)}`}>
                    {activist.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-200">
                  {activist.timelineEvents.length > 0 ? (
                    <div>
                      <div className="text-sm font-medium text-white">
                        {(() => {
                          const date = new Date(activist.timelineEvents[0].eventDate)
                          const year = date.getUTCFullYear()
                          const month = date.getUTCMonth() + 1
                          const day = date.getUTCDate()
                          return `${month}/${day}/${year}`
                        })()}
                      </div>
                      <div className="text-xs truncate max-w-xs text-neutral-400">
                        {activist.timelineEvents[0].sourceTitle}
                      </div>
                    </div>
                  ) : (
                    <span className="text-neutral-500">No updates</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-700 text-white">
                    {activist._count.timelineEvents} events
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredActivists.map((activist) => (
          <div 
            key={activist.id}
            className={cn("rounded-lg border p-4 transition-colors", colors.background.card, colors.border.accent, "hover:bg-neutral-700/50")}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Link 
                  href={`/activist/${activist.id}`}
                  className={cn("text-lg font-semibold hover:underline", colors.link.primary)}
                >
                  {activist.name}
                </Link>
                <div className={cn("text-sm mt-1", colors.text.secondary)}>
                  {activist.nationality} • {activist.boatName}
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activist.status)}`}>
                {activist.status}
              </span>
            </div>
            
            <div className="space-y-2">
              {activist.timelineEvents.length > 0 ? (
                <div>
                  <div className={cn("text-sm font-medium", colors.text.primary)}>
                    Latest: {(() => {
                      const date = new Date(activist.timelineEvents[0].eventDate)
                      const year = date.getUTCFullYear()
                      const month = date.getUTCMonth() + 1
                      const day = date.getUTCDate()
                      return `${month}/${day}/${year}`
                    })()}
                  </div>
                  <div className={cn("text-xs", colors.text.tertiary)}>
                    {activist.timelineEvents[0].sourceTitle}
                  </div>
                </div>
              ) : (
                <div className={cn("text-sm", colors.text.muted)}>No updates</div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-neutral-700">
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", colors.background.tertiary, colors.text.primary)}>
                  {activist._count.timelineEvents} events
                </span>
                <Link 
                  href={`/activist/${activist.id}`}
                  className={cn("text-sm font-medium", colors.link.primary)}
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredActivists.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No activists found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
