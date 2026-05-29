'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, Copy, Check, LogOut, Shield 
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
    <aside className="w-full lg:w-80 shrink-0 border-r border-[#e7e7e7] bg-[#f4eee5] flex flex-col h-full font-sans">
      {/* Room Information */}
      <div className="p-5 border-b border-[#e7e7e7]">
        <div className="flex items-start justify-between gap-4 mb-3.5">
          <div>
            <div className="badge-tag-evernote">
              {room.subject || 'General'}
            </div>
            <h2 className="text-[#141414] text-heading-sm font-semibold mt-3 tracking-tight truncate">
              {room.name}
            </h2>
          </div>
        </div>
        {room.description && (
          <p className="text-[13px] text-[#4e4d4c] leading-relaxed mb-4">{room.description}</p>
        )}

        {/* Invite Code Panel */}
        <div className="rounded-[10px] bg-white border border-[#e7e7e7] p-3.5 flex items-center justify-between shadow-none">
          <div className="min-w-0">
            <span className="text-[10px] text-[#737373] block uppercase tracking-wider mb-0.5">Invite Code</span>
            <span className="font-mono text-sm text-[#141414] tracking-wider truncate block uppercase">
              {room.invite_code}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyInvite}
            className="h-8 w-8 hover:bg-[#f4eee5] text-[#262626] rounded-[5px] cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#0A7C6E]" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Members Section */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[13px] font-semibold text-[#141414] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#262626]" />
            Members ({members.length})
          </h3>
          <span className="text-[10px] text-[#0A7C6E] border border-[#0A7C6E]/30 bg-[#0A7C6E]/10 px-2.5 py-0.5 rounded-[52px] font-medium tracking-wide uppercase">
            {onlineUserIds.length} ONLINE
          </span>
        </div>

        <div className="space-y-2">
          {members.map((member) => {
            const isOnline = onlineUserIds.includes(member.userId)
            const fallbackChar = member.profile?.username?.charAt(0).toUpperCase() || '?'
            const isSelf = member.userId === currentUserId

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-[10px] transition-all duration-200 hover:bg-white/60 border border-transparent hover:border-[#e7e7e7]"
              >
                <div className="relative">
                  <Avatar className="w-9 h-9 border border-[#e7e7e7] rounded-[10px]">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#f4eee5] text-[#141414] border border-[#e7e7e7] text-sm rounded-[10px] font-medium">
                      {fallbackChar}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#0A7C6E] border border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-[13px] tracking-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#141414] truncate block font-semibold">
                      {member.profile?.full_name || member.profile?.username}
                    </span>
                    {member.role === 'owner' && (
                      <span title="Owner">
                        <Shield className="w-3.5 h-3.5 text-[#4e4d4c] shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="text-[#737373] truncate block text-[11px] font-normal">
                    @{member.profile?.username} {isSelf && '(You)'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leave Room Button */}
      <div className="p-5 border-t border-[#e7e7e7] bg-[#f4eee5]">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={isLeaving}
              className="border border-[#cc3737]/30 bg-transparent text-[#cc3737] hover:bg-[#cc3737]/10 rounded-[5px] font-sans text-xs uppercase px-4 py-2.5 w-full flex items-center justify-center transition-all cursor-pointer shadow-none font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {currentRole === 'owner' ? 'LEAVE & RELINQUISH' : 'LEAVE ROOM'}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white border border-[#e7e7e7] text-[#141414] max-w-sm rounded-[16px] shadow-none p-6 font-sans">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-heading-sm text-[#141414] font-semibold tracking-tight">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#4e4d4c] text-[13px] tracking-normal font-normal mt-2 leading-relaxed">
                This action will remove you from this study room. You will need to use the invite code{' '}
                <code className="font-mono bg-[#f4eee5] text-[#141414] px-1.5 py-0.5 rounded-[3px] tracking-wider font-semibold">{room.invite_code}</code> to join back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2.5">
              <AlertDialogCancel className="bg-[#f4eee5] border border-[#e7e7e7] text-[#4e4d4c] hover:bg-[#e7e7e7] hover:text-[#141414] rounded-[5px] text-[13px] uppercase py-2 cursor-pointer shadow-none font-medium">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLeaveRoom}
                className="bg-[#cc3737] hover:bg-[#cc3737]/90 text-white border-0 rounded-[5px] text-[13px] uppercase py-2 transition-all cursor-pointer shadow-none font-medium"
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

