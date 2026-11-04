import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import StudentLiveBanner from '@/components/live/StudentLiveBanner'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation()
  const isGameRoute = pathname.startsWith('/games')

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF5FF] text-[#243247]">
      <Navbar />
      <main
        className={
          isGameRoute
            ? 'flex-1 max-w-5xl w-full mx-auto px-2 py-3 sm:px-4 sm:py-5'
            : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'
        }
      >
        {children}
      </main>
      <StudentLiveBanner />
      {!isGameRoute && (
        <footer className="bg-white/80 border-t border-blue-100 py-6 text-center text-sm text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <span className="font-bold text-brand-blue">Learn Arabic with Anshad</span>
              <span>— Fun learning for little explorers</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>28 Arabic Letters</span>
              <span>•</span>
              <span>24 Playful Games</span>
              <span>•</span>
              <span>Safe & Child-Friendly</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
