'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { colors, cn } from '@/lib/colors'

interface Activist {
  id: string
  name: string
  nationality: string
  boatName: string
  status: string
}

export default function SubmitPage() {
  const searchParams = useSearchParams()
  const activistId = searchParams.get('activist')
  
  const [formData, setFormData] = useState({
    activistId: activistId || '',
    eventDate: '',
    sourceTitle: '',
    description: '',
    submitterEmail: '',
    sourceUrl: ''
  })
  const [submissionType, setSubmissionType] = useState<'activist' | 'general'>('activist')
  const [activists, setActivists] = useState<Activist[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Fetch activists for dropdown
    fetch('/api/activists')
      .then(res => res.json())
      .then(data => setActivists(data))
      .catch(err => console.error('Error fetching activists:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submissionType
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          activistId: '',
          eventDate: '',
          sourceTitle: '',
          description: '',
          submitterEmail: '',
          sourceUrl: ''
        })
      } else {
        const errorData = await response.json()
        setSubmitStatus('error')
        setErrorMessage(errorData.message || 'Failed to submit information')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className={cn("relative min-h-screen", colors.background.primary)}>
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

      <div className="relative z-20 max-w-2xl mx-auto space-y-6 pt-20 pb-8">
        <div className="text-center">
          <h1 className={cn("text-3xl font-bold mb-4", colors.text.primary)}>
            Submit Information
          </h1>
          <p className={cn("text-lg", colors.text.secondary)}>
            Help us keep the activist tracker updated by submitting new information, 
            updates, or corrections. All submissions are reviewed before being added to the timeline.
          </p>
        </div>

        {submitStatus === 'success' && (
          <div className={cn("rounded-lg p-4 border", colors.background.card, colors.border.primary)}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={cn("text-sm font-medium", colors.text.primary)}>
                  Information submitted successfully!
                </h3>
                <div className={cn("mt-2 text-sm", colors.text.secondary)}>
                  <p>
                    Thank you for your submission. Our team will review the information 
                    and add it to the timeline if verified. You will be notified via email 
                    once the information is processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className={cn("rounded-lg p-4 border", colors.background.card, colors.border.primary)}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={cn("text-sm font-medium", colors.text.primary)}>
                  Error submitting information
                </h3>
                <div className={cn("mt-2 text-sm", colors.text.secondary)}>
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={cn("backdrop-blur-sm rounded-lg shadow-2xl border p-6", colors.background.card, colors.border.accent)}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submission Type */}
          <div>
            <label className={cn("block text-sm font-medium mb-3", colors.text.primary)}>
              What type of information are you submitting?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="submissionType"
                  value="activist"
                  checked={submissionType === 'activist'}
                  onChange={(e) => setSubmissionType(e.target.value as 'activist' | 'general')}
                  className="mr-2"
                />
                <span className={cn("text-sm", colors.text.secondary)}>Information about a specific activist</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="submissionType"
                  value="general"
                  checked={submissionType === 'general'}
                  onChange={(e) => setSubmissionType(e.target.value as 'activist' | 'general')}
                  className="mr-2"
                />
                <span className={cn("text-sm", colors.text.secondary)}>General news about the flotilla</span>
              </label>
            </div>
          </div>

          {/* Activist Selection - only show for activist submissions */}
          {submissionType === 'activist' && (
            <div>
            <label htmlFor="activistId" className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
              Select Activist *
            </label>
            <select
              id="activistId"
              name="activistId"
              value={formData.activistId}
              onChange={handleInputChange}
              required
              className={cn("w-full px-3 py-2 rounded-md focus:outline-none", colors.input.background, colors.input.border, colors.input.focus, colors.text.primary)}
            >
              <option value="">Choose an activist...</option>
              {activists.map(activist => (
                <option key={activist.id} value={activist.id}>
                  {activist.name} ({activist.nationality}) - {activist.boatName}
                </option>
              ))}
            </select>
            <p className={cn("mt-1 text-sm", colors.text.muted)}>
              If the activist is not listed, please contact us directly.
            </p>
            </div>
          )}

          {/* Source URL - required for general news */}
          {submissionType === 'general' && (
            <div>
              <label htmlFor="sourceUrl" className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
                Source Link *
              </label>
              <input
                type="url"
                id="sourceUrl"
                name="sourceUrl"
                value={formData.sourceUrl}
                onChange={handleInputChange}
                required={submissionType === 'general'}
                placeholder="https://example.com/news-article"
                className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
              />
              <p className={cn("mt-1 text-sm", colors.text.muted)}>
                Please provide a link to the source of this news.
              </p>
            </div>
          )}

          {/* Event Date */}
          <div>
            <label htmlFor="eventDate" className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
              Event Date *
            </label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              required
              className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
            />
          </div>

          {/* Source Title */}
          <div>
            <label htmlFor="sourceTitle" className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
              Source/Title *
            </label>
            <input
              type="text"
              id="sourceTitle"
              name="sourceTitle"
              value={formData.sourceTitle}
              onChange={handleInputChange}
              required
              placeholder="e.g., 'Arrest reported by family', 'Court hearing scheduled'"
              className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.placeholder, colors.input.focus)}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Provide detailed information about the event, including any relevant context, sources, or additional details..."
              className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
            />
          </div>

          {/* Submitter Email */}
          <div>
            <label htmlFor="submitterEmail" className={cn("block text-sm font-medium mb-2", colors.text.primary)}>
              Your Email Address *
            </label>
            <input
              type="email"
              id="submitterEmail"
              name="submitterEmail"
              value={formData.submitterEmail}
              onChange={handleInputChange}
              required
              placeholder="your.email@example.com"
              className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:border-transparent", colors.input.background, colors.input.border, colors.text.primary, colors.input.focus)}
            />
            <p className={cn("mt-1 text-sm", colors.text.muted)}>
              We'll use this to contact you if we need clarification or to notify you when your submission is processed.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn("font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed", colors.button.primary)}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Information'}
            </button>
          </div>
        </form>
        </div>

        {/* Guidelines */}
        <div className={cn("backdrop-blur-sm rounded-lg p-6 border", colors.background.card, colors.border.accent)}>
          <h3 className={cn("text-lg font-medium mb-3", colors.text.primary)}>
            Submission Guidelines
          </h3>
          <ul className={cn("space-y-2 text-sm", colors.text.secondary)}>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2"></span>
              Provide accurate, verifiable information with sources when possible
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2"></span>
              Include specific dates, times, and locations when available
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2"></span>
              All submissions are reviewed before being added to the public timeline
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2"></span>
              We respect privacy and will not publish sensitive personal information
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
