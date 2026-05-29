'use client'

import { ReactNode } from 'react'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16 space-y-8 animate-in fade-in duration-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="space-y-8 flex-1">
        {children}
      </div>
      
      <footer className="w-full border-t border-[#e7e7e7] pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-caption text-[#4e4d4c] font-semibold uppercase tracking-wider text-[11px]">
          Digital Architecture by Anand Choubey
        </span>
        <div className="flex items-center gap-6 text-[11px] font-semibold uppercase tracking-wider">
          <a 
            href="https://github.com/isitanand" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-caption text-[#4e4d4c] hover:text-[#141414] flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-[#4e4d4c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
            GitHub
          </a>
          <a 
            href="https://instagram.com/aaanand0.0" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-caption text-[#4e4d4c] hover:text-[#141414] flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-[#4e4d4c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            Instagram
          </a>
        </div>
      </footer>
    </div>
  )
}
