'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import LoadingAnimation from './LoadingAnimation'
import ActivistsTable from './ActivistsTable'
import MissionCards from './MissionCards'
import { colors, cn } from '@/lib/colors'

interface Activist {
  id: string
  name: string
  nationality: string
  boatName: string
  status: string
  createdAt: string
  updatedAt: string
  missionId: string
  timelineEvents: any[]
  _count: {
    timelineEvents: number
  }
}

interface Mission {
  id: string
  name: string
  description?: string
  stats: {
    totalActivists: number
    statusBreakdown: {
      [status: string]: number
    }
  }
}

interface HomePageWrapperProps {
  activists: Activist[]
  missions: Mission[]
}

export default function HomePageWrapper({ activists, missions }: HomePageWrapperProps) {
  const [showLoading, setShowLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [backgroundTextOpacity, setBackgroundTextOpacity] = useState(0.1)
  const searchParams = useSearchParams()
  
  const selectedMissionId = searchParams.get('mission')
  const missionTitle = searchParams.get('title')
  
  // Filter activists by mission if one is selected
  const filteredActivists = selectedMissionId 
    ? activists.filter(activist => activist.missionId === selectedMissionId)
    : activists

  const handleLoadingComplete = () => {
    setShowLoading(false)
    // Start content animation after loading completes
    setTimeout(() => {
      setShowContent(true)
      // Gradually fade background text
      setTimeout(() => {
        setBackgroundTextOpacity(0.05)
      }, 1000)
    }, 500)
  }

  if (showLoading) {
    return <LoadingAnimation onComplete={handleLoadingComplete} />
  }

  return (
    <div className="relative min-h-screen bg-neutral-900">
      {/* Background texture using Speckles.svg */}
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
          style={{ opacity: backgroundTextOpacity }}
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

      {/* Main content with slide-in animation */}
      <div 
        className={`relative z-20 space-y-6 transition-all duration-1000 ${
          showContent 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Inspiring Quote */}
        <blockquote className="text-center">
          <p className="text-xl md:text-2xl font-medium text-white italic leading-relaxed">
          </p>
        </blockquote>

        {/* Mission Cards or Table based on selection */}
        {!selectedMissionId ? (
          <div className={cn("backdrop-blur-sm rounded-lg shadow-2xl border p-6", colors.background.card, colors.border.accent)}>
            <MissionCards missions={missions} />
          </div>
        ) : (
          <div className={cn("backdrop-blur-sm rounded-lg shadow-2xl border", colors.background.card, colors.border.accent)}>
            <div className={cn("px-6 py-4 border-b", colors.border.primary)}>
              <div className="flex items-center justify-between">
                <h2 className={cn("text-lg font-medium", colors.text.primary)}>
                  {missionTitle || 'Mission Activists'} ({filteredActivists.length} total)
                </h2>
                <button
                  onClick={() => window.history.back()}
                  className={cn("text-sm px-3 py-1 rounded-md transition-colors", colors.button.secondary)}
                >
                  ← Back to Missions
                </button>
              </div>
            </div>
            <ActivistsTable activists={filteredActivists} />
          </div>
        )}

        {/* More transparent bottom banner */}
        <div className={cn("backdrop-blur-sm rounded-lg p-6 border", colors.background.overlay, colors.border.subtle)}>
          <h3 className={cn("text-lg font-medium mb-2", colors.text.primary)}>
            Have new information?
          </h3>
          <p className={cn("mb-4", colors.text.secondary)}>
            If you have updates about any activist or new information to share, 
            please submit it through our secure form.
          </p>
          <a 
            href="/submit" 
            className={cn("px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 inline-block", colors.button.secondary)}
          >
            Submit Information
          </a>
        </div>
      </div>
    </div>
  )
}
