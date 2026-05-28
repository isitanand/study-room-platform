'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/auth/actions'
import { BookOpen, LogOut } from 'lucide-react'

interface DashboardNavbarProps {
  profile: { username: string | null; full_name: string | null; avatar_url: string | null } | null
  email: string | undefined
}

export function DashboardNavbar({ profile, email }: DashboardNavbarProps) {
  const displayName = profile?.full_name || profile?.username || email?.split('@')[0] || 'Student'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30">
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <span className="font-bold text-white tracking-tight">StudyRoom</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <Avatar className="w-6 h-6">
              <AvatarImage src={profile?.avatar_url ?? ''} />
              <AvatarFallback className="bg-violet-600/30 text-violet-300 text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-zinc-300 font-medium max-w-32 truncate">{displayName}</span>
          </div>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 px-3"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline text-sm">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
