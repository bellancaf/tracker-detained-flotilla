import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { colors, cn } from '@/lib/colors'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Global Sumud Flotilla Tracker',
  description: 'Track activists from the Global Sumud Flotilla - their status, timeline, and updates',
  keywords: ['flotilla', 'activists', 'tracker', 'sumud', 'palestine'],
  authors: [{ name: 'Sisyphos' }],
  icons: {
    icon: '/we-leave.svg',
    shortcut: '/we-leave.svg',
    apple: '/we-leave.svg',
  },
  openGraph: {
    title: 'Global Sumud Flotilla Tracker',
    description: 'Track activists from the Global Sumud Flotilla',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-neutral-900 relative flex flex-col">
          <header className="bg-transparent absolute top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center space-x-4">
                  <a href="/" className="flex items-center space-x-2">
                    <img 
                      src="/we-leave.svg" 
                      alt="We Leave Together" 
                      className="h-8 w-8"
                    />
                    <span className="text-white font-semibold text-lg">We Leave Together</span>
                  </a>
                </div>
                <div className="flex items-center space-x-4">
                  <a 
                    href="/about" 
                    className={cn("text-sm font-medium transition-colors duration-200", colors.text.secondary, "hover:text-white")}
                  >
                    About
                  </a>
                  <a 
                    href="/submit" 
                    className={cn("px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200", colors.button.secondary)}
                  >
                    Submit Info
                  </a>
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 flex-1">
            {children}
          </main>
          <footer className="bg-neutral-800/50 border-t border-neutral-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="text-center">
                <p className={cn("text-sm", colors.text.muted)}>
                  Made with rage by <span className="font-semibold">Sisyphos</span> 2025
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
