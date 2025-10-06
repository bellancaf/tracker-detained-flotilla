import { Suspense } from 'react'
import { colors, cn } from '@/lib/colors'

export default function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">

        <h1 className={cn("text-4xl md:text-5xl font-bold", colors.text.primary)}>
          About This Project
        </h1>
        <p className={cn("text-xl md:text-2xl max-w-3xl mx-auto", colors.text.secondary)}>
          Tracking repression. Exposing power. Standing together.
        </p>
      </div>

      {/* Main Content */}
      <div className={cn("backdrop-blur-sm rounded-lg shadow-2xl border p-8", colors.background.card, colors.border.accent)}>
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Mission Statement */}
          <section className="space-y-4">
            <h2 className={cn("text-2xl font-bold", colors.text.primary)}>
              Our Mission
            </h2>
            <div className={cn("text-lg leading-relaxed space-y-4", colors.text.secondary)}>
              <p>
                Run by <span className={cn("font-semibold", colors.text.primary)}>Sisyphos</span>, this project exist to document the repression of activists and keep them in the public eye.
              </p>
              <p>
                When states criminalize solidarity, we respond by tracing every arrest, every interrogation, every unlawful act.
              </p>
              <p className={cn("font-semibold", colors.text.primary)}>
                We don't mourn — we organize.<br />
                We don't wait — we expose.
              </p>
            </div>
          </section>

          {/* Core Principles */}
          <section className="space-y-4">
            <h2 className={cn("text-2xl font-bold", colors.text.primary)}>
              Core Principles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className={cn("p-6 rounded-lg border", colors.background.overlay, colors.border.subtle)}>
                <h3 className={cn("text-lg font-semibold mb-3", colors.text.primary)}>
                  Solidarity
                </h3>
                <p className={cn("text-sm", colors.text.secondary)}>
                  No one left behind. Every detained comrade stays visible and defended.
                </p>
              </div>
              <div className={cn("p-6 rounded-lg border", colors.background.overlay, colors.border.subtle)}>
                <h3 className={cn("text-lg font-semibold mb-3", colors.text.primary)}>
                  Accountability
                </h3>
                <p className={cn("text-sm", colors.text.secondary)}>
                  We document the chain of repression — from sea interceptions to courtrooms. Facts are our weapon.
                </p>
              </div>
              <div className={cn("p-6 rounded-lg border", colors.background.overlay, colors.border.subtle)}>
                <h3 className={cn("text-lg font-semibold mb-3", colors.text.primary)}>
                  Transparency
                </h3>
                <p className={cn("text-sm", colors.text.secondary)}>
                  Open data keeps the movement informed and the powers under watch.
                </p>
              </div>
              <div className={cn("p-6 rounded-lg border", colors.background.overlay, colors.border.subtle)}>
                <h3 className={cn("text-lg font-semibold mb-3", colors.text.primary)}>
                  Dignity
                </h3>
                <p className={cn("text-sm", colors.text.secondary)}>
                  We name our comrades with respect — not as victims, but as part of a living struggle.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-4">
            <h2 className={cn("text-2xl font-bold", colors.text.primary)}>
              How It Works
            </h2>
            <div className={cn("text-lg leading-relaxed space-y-4", colors.text.secondary)}>
              <p>
                This tracker follows activists from missions like the Sumud Flotilla and Thousands Medleens, 
                documenting their legal status and the repression they face.
              </p>
              <p>
                Verified reports feed a public record — a tool for collective defense, not commemoration.
              </p>
              <p>
                If you have updates or evidence, send them.<br />
                Together we keep the pressure on — until every activist is free.
              </p>
            </div>
          </section>

          {/* Call to Action */}
          <section className={cn("p-6 rounded-lg border text-center", colors.background.overlay, colors.border.accent)}>
            <h3 className={cn("text-xl font-bold mb-4", colors.text.primary)}>
              Send Updates & Evidence
            </h3>
            <p className={cn("mb-6", colors.text.secondary)}>
              Help us maintain the pressure. Every piece of information strengthens our collective defense.
            </p>
            <a 
              href="/submit" 
              className={cn("inline-block px-8 py-3 rounded-lg text-sm font-medium transition-colors duration-200", colors.button.primary)}
            >
              Submit Information
            </a>
          </section>

        </div>
      </div>

      {/* Quote Section */}
      <div className="text-center">
        <blockquote className={cn("text-2xl md:text-3xl font-medium italic leading-relaxed max-w-4xl mx-auto", colors.text.primary)}>
          "We leave together, we come back together."
        </blockquote>
        <p className={cn("mt-4 text-sm", colors.text.muted)}>
          — Core principle of activist solidarity
        </p>
      </div>
    </div>
  )
}
