'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/auth/actions'
import { LogOut } from 'lucide-react'

interface DashboardNavbarProps {
  profile: { username: string | null; full_name: string | null; avatar_url: string | null } | null
  email: string | undefined
}

export function DashboardNavbar({ profile, email }: DashboardNavbarProps) {
  const displayName = profile?.full_name || profile?.username || email?.split('@')[0] || 'STUDENT'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e7e7] bg-[#f9f6f2]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-[5px] border border-[#e7e7e7] bg-white text-black shrink-0">
            <svg
              className="w-4 h-4 text-[#0A7C6E] stroke-[2]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight text-[#141414]">STUDYROOM</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-[5px] bg-white border border-[#e7e7e7]">
            <Avatar className="w-6 h-6 border border-[#e7e7e7] rounded-[5px]">
              <AvatarImage src={profile?.avatar_url ?? ''} className="rounded-[5px] object-cover" />
              <AvatarFallback className="bg-[#f9f6f2] text-black text-[10px] font-semibold rounded-[5px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-caption text-[#262626] font-medium max-w-32 truncate">{displayName.toUpperCase()}</span>
          </div>

          <form action={signOutAction}>
            <Button
              type="submit"
              className="btn-evernote-secondary text-caption uppercase h-8 px-3.5 flex items-center gap-1.5 transition-all cursor-pointer py-0 rounded-[5px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
