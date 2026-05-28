'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, Copy, Check, LogOut, Shield, Info, BookOpen 
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Member {
  id: string
  userId: string
  role: string
  joinedAt: string
  profile?: {
    username: string
    full_name?: string | null
    avatar_url?: string | null
  }
}

interface RoomSidebarProps {
  room: {
    id: string
    name: string
    subject?: string | null
    description?: string | null
    invite_code?: string | null
  }
  members: Member[]
  onlineUserIds: string[]
  currentUserId: string
  currentRole: string
}

export function RoomSidebar({
  room,
  members,
  onlineUserIds,
  currentUserId,
  currentRole,
}: RoomSidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [copied, setCopied] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const handleCopyInvite = async () => {
    if (!room.invite_code) return
    try {
      await navigator.clipboard.writeText(room.invite_code)
      setCopied(true)
      toast.success('Invite code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy invite code.')
    }
  }

  const handleLeaveRoom = async () => {
    setIsLeaving(true)
    try {
      // Delete membership
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', currentUserId)

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        room_id: room.id,
        user_id: currentUserId,
        action: 'member_left',
        metadata: {},
      })

      toast.success('Successfully left the room.')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to leave the room.')
      setIsLeaving(false)
    }
  }

  return (
    <aside className="w-full lg:w-80 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full">
      {/* Room Information */}
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/15">
              {room.subject || 'General'}
            </span>
            <h2 className="text-xl font-bold text-white mt-1 leading-snug">{room.name}</h2>
          </div>
        </div>
        {room.description && (
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">{room.description}</p>
        )}

        {/* Invite Code Panel */}
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Invite Code</span>
            <span className="font-mono text-sm font-semibold text-white tracking-wider truncate block">
              {room.invite_code}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyInvite}
            className="h-8 w-8 hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Members Section */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Members ({members.length})
          </h3>
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">
            {onlineUserIds.length} Online
          </span>
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const isOnline = onlineUserIds.includes(member.userId)
            const fallbackChar = member.profile?.username?.charAt(0).toUpperCase() || '?'
            const isSelf = member.userId === currentUserId

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-zinc-900/40 border border-transparent hover:border-zinc-900"
              >
                <div className="relative">
                  <Avatar className="w-9 h-9 border border-zinc-800">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-zinc-900 text-zinc-400 font-medium text-sm">
                      {fallbackChar}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-zinc-200 truncate block">
                      {member.profile?.full_name || member.profile?.username}
                    </span>
                    {member.role === 'owner' && (
                      <span title="Owner">
                        <Shield className="w-3 h-3 text-violet-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate block">
                    @{member.profile?.username} {isSelf && '(You)'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leave Room Button */}
      <div className="p-5 border-t border-zinc-800 bg-zinc-950">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/15 font-semibold text-sm transition-all"
              disabled={isLeaving}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {currentRole === 'owner' ? 'Leave & Relinquish Room' : 'Leave Room'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                This action will remove you from this study room. You will need to use the invite code{' '}
                <code className="font-mono text-zinc-200">{room.invite_code}</code> to join back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLeaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Leave Room
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  )
}
