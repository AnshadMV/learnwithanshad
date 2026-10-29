import React from 'react'
import Navbar from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#EAF5FF] text-[#243247]">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="bg-white/80 border-t border-blue-100 py-6 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌟</span>
            <span className="font-bold text-brand-blue">Arabic Learning Adventure</span>
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
    </div>
  )
}
