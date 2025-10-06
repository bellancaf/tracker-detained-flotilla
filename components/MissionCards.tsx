'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { colors, cn } from '@/lib/colors'

interface MissionStats {
  totalActivists: number
  statusBreakdown: {
    [status: string]: number
  }
}

interface Mission {
  id: string
  name: string
  description?: string
  stats: MissionStats
}

interface MissionCardsProps {
  missions: Mission[]
}

export default function MissionCards({ missions }: MissionCardsProps) {
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const handleMissionClick = (missionId: string, missionName: string) => {
    // Navigate to the table view with mission context
    router.push(`/?mission=${missionId}&title=${encodeURIComponent(missionName)}`)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'detained':
        return 'bg-red-500'
      case 'released':
        return 'bg-green-500'
      case 'missing':
        return 'bg-red-600'
      case 'safe':
        return 'bg-green-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Missions</h2>
        <p className="text-neutral-400">Select a mission to view detailed activist information</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className={cn(
              "relative rounded-lg border p-6 cursor-pointer transition-all duration-200",
              colors.background.card,
              colors.border.accent,
              hoveredCard === mission.id 
                ? "transform scale-105 shadow-lg shadow-green-500/20 border-green-500/50" 
                : "hover:bg-neutral-700/50 hover:border-green-500/30"
            )}
            onClick={() => handleMissionClick(mission.id, mission.name)}
            onMouseEnter={() => setHoveredCard(mission.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Mission Header */}
            <div className="mb-4">
              <h3 className={cn("text-xl font-bold mb-2", colors.text.primary)}>
                {mission.name}
              </h3>
              {mission.description && (
                <p className={cn("text-sm", colors.text.secondary)}>
                  {mission.description}
                </p>
              )}
            </div>

            {/* Total Activists */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", colors.text.secondary)}>
                  Total Activists
                </span>
                <span className={cn("text-2xl font-bold", colors.text.primary)}>
                  {mission.stats.totalActivists}
                </span>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-3">
              <h4 className={cn("text-sm font-medium", colors.text.secondary)}>
                Status Breakdown
              </h4>
              
              {Object.entries(mission.stats.statusBreakdown).map(([status, count]) => {
                const percentage = getStatusPercentage(count, mission.stats.totalActivists)
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn("capitalize", colors.text.primary)}>
                        {status}
                      </span>
                      <span className={cn("font-medium", colors.text.primary)}>
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div
                        className={cn("h-2 rounded-full transition-all duration-300", getStatusColor(status))}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Click Indicator */}
            <div className="mt-4 pt-4 border-t border-neutral-700">
              <div className="flex items-center justify-center">
                <span className={cn("text-sm font-medium", colors.link.primary)}>
                  Click to view details →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
