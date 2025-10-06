'use client'

import { useState, useEffect } from 'react'

interface LoadingAnimationProps {
  onComplete: () => void
}

export default function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [textOpacity, setTextOpacity] = useState(0)

  // Check if animation has already been shown in this session
  useEffect(() => {
    const hasShownAnimation = sessionStorage.getItem('flotilla-animation-shown')
    if (hasShownAnimation) {
      // Skip animation if already shown
      onComplete()
      return
    }
    
    // Mark animation as shown
    sessionStorage.setItem('flotilla-animation-shown', 'true')
  }, [onComplete])

  useEffect(() => {
    // Fade in the text
    const fadeInTimer = setTimeout(() => {
      setTextOpacity(1)
    }, 300)

    // Start fade out after 2.5 seconds for smoother transition
    const fadeOutTimer = setTimeout(() => {
      setTextOpacity(0)
      setTimeout(() => {
        setIsVisible(false)
        onComplete()
      }, 800) // Complete after fade out
    }, 2500)

    return () => {
      clearTimeout(fadeInTimer)
      clearTimeout(fadeOutTimer)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900">
      {/* Background texture */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(/Speckles.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div 
        className="text-center relative z-10"
        style={{ 
          opacity: textOpacity,
          transition: 'opacity 1.2s ease-in-out'
        }}
      >
        <h1 className="text-6xl md:text-8xl font-black text-white leading-tight">
          WE LEAVE
          <br />
          TOGETHER
        </h1>
        <div className="mt-8">
          <h2 className="text-4xl md:text-6xl font-black text-white">
            WE COME BACK
            <br />
            TOGETHER
          </h2>
        </div>
      </div>
    </div>
  )
}
