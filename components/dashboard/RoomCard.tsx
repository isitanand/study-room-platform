'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Room } from './DashboardClient'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Users, MoreVertical, Copy, LogOut, Trash2, ArrowRight } from 'lucide-react'

interface RoomCardProps {
  room: Room
  userId: string
  onRefresh: () => void
}

export function RoomCard({ room, userId, onRefresh }: RoomCardProps) {
  const supabase = createClient()
  const isOwner = room.user_role === 'owner'
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(room.invite_code)
    toast.success('Invite code copied!', { description: room.invite_code })
  }

  const handleLeave = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', userId)

      if (error) throw error

      await supabase.from('activity_log').insert({
        room_id: room.id,
        user_id: userId,
        action: 'member_left',
      })

      toast.success('Left the room')
      setLeaveOpen(false)
      onRefresh()
    } catch {
      toast.error('Failed to leave room')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', room.id)

      if (error) throw error

      await supabase.from('activity_log').insert({
        room_id: room.id,
        user_id: userId,
        action: 'room_deleted',
      })

      toast.success('Room deleted')
      setDeleteOpen(false)
      onRefresh()
    } catch {
      toast.error('Failed to delete room')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="group relative flex flex-col rounded-[10px] border border-[#e7e7e7] bg-white p-5 hover:border-[#0A7C6E] transition-all duration-300 overflow-hidden shadow-none">
        {/* Card header */}
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {room.has_active_session && (
                <div className="flex items-center gap-1 rounded-full bg-[#e6f4f2] border border-[#0A7C6E]/20 px-2.5 py-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A7C6E] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0A7C6E]" />
                  </span>
                  <span className="text-[9px] font-semibold text-[#0A7C6E] uppercase tracking-wider leading-none">LIVE TIMER</span>
                </div>
              )}
              {isOwner && (
                <div className="badge-tag-evernote">
                  OWNER
                </div>
              )}
            </div>

            <h3 className="text-[#141414] font-heading text-2xl font-semibold leading-tight line-clamp-1 truncate">
              {room.name}
            </h3>
            {room.subject && (
              <p className="text-caption text-[#4e4d4c] font-semibold uppercase mt-1">{room.subject}</p>
            )}
          </div>

          {/* Options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-[#4e4d4c] hover:text-[#141414] hover:bg-[#f9f6f2] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-[5px]"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Room options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white border border-[#e7e7e7] text-[#262626] w-44 shadow-subtle rounded-[5px] p-1 z-50"
            >
              <DropdownMenuItem asChild>
                <Link
                  href={`/rooms/${room.id}`}
                  className="flex items-center gap-2 hover:bg-[#e6f4f2] hover:text-[#0A7C6E] cursor-pointer px-2.5 py-2 rounded-[5px] text-caption uppercase font-medium"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#0A7C6E]" />
                  Enter Room
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={copyInviteCode}
                className="hover:bg-[#f4eee5] hover:text-black cursor-pointer gap-2 px-2.5 py-2 rounded-[5px] text-caption uppercase font-medium"
              >
                <Copy className="w-3.5 h-3.5 text-[#4e4d4c]" />
                Copy Invite Code
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#e7e7e7] my-1" />

              {!isOwner && (
                <DropdownMenuItem
                  onClick={() => setLeaveOpen(true)}
                  className="text-destructive hover:bg-red-50 cursor-pointer gap-2 px-2.5 py-2 rounded-[5px] text-caption uppercase font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Leave Room
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive hover:bg-red-50 cursor-pointer gap-2 px-2.5 py-2 rounded-[5px] text-caption uppercase font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Room
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <div className="flex-1 mb-4">
          {room.description ? (
            <p className="text-body text-[#262626] leading-relaxed line-clamp-2">
              {room.description}
            </p>
          ) : (
            <p className="text-caption text-[#4e4d4c] uppercase italic">No description</p>
          )}
        </div>

        {/* Room Metrics & Aggregations */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-[#f9f6f2] rounded-[5px] p-3.5 border border-[#e7e7e7] text-caption text-[#4e4d4c] uppercase font-medium">
          <div>
            <span className="text-[#4e4d4c] block text-[9px] tracking-wider mb-0.5">Sessions</span>
            <span className="text-[#141414] font-semibold">
              {room.total_completed_sessions || 0} completed
            </span>
          </div>
          <div>
            <span className="text-[#4e4d4c] block text-[9px] tracking-wider mb-0.5">Study Time</span>
            <span className="text-[#141414] font-semibold">
              {(() => {
                const totalSecs = room.total_study_time_seconds || 0
                const hrs = Math.floor(totalSecs / 3600)
                const mins = Math.floor((totalSecs % 3600) / 60)
                if (hrs > 0) return `${hrs}h ${mins}m total`
                return `${mins}m total`
              })()}
            </span>
          </div>
          {room.last_active_at && (
            <div className="col-span-2 border-t border-[#e7e7e7] pt-2 mt-1.5">
              <span className="text-[#4e4d4c] block text-[9px] tracking-wider mb-0.5">Last Active</span>
              <span className="text-[#141414] font-semibold" suppressHydrationWarning>
                {(() => {
                  try {
                    const then = new Date(room.last_active_at).getTime()
                    const now = Date.now()
                    const diffMs = now - then
                    if (diffMs < 5000) return 'Just now'
                    const diffSecs = Math.round(diffMs / 1000)
                    if (diffSecs < 60) return `${diffSecs}s ago`
                    const diffMins = Math.round(diffSecs / 60)
                    if (diffMins < 60) return `Last active ${diffMins} mins ago`
                    const diffHours = Math.round(diffMins / 60)
                    if (diffHours < 24) return `Last active ${diffHours} hours ago`
                    const diffDays = Math.round(diffHours / 24)
                    return `Last active ${diffDays} days ago`
                  } catch {
                    return 'Unknown'
                  }
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-[#e7e7e7]">
          <div className="flex items-center gap-1.5 text-caption text-[#4e4d4c] uppercase font-semibold">
            <Users className="w-3.5 h-3.5 text-[#4e4d4c]" />
            <span>
              {room.member_count} member{room.member_count !== 1 ? 's' : ''}
            </span>
          </div>
          <Link href={`/rooms/${room.id}`}>
            <button className="btn-evernote-primary text-xs py-1.5 px-4 h-8 uppercase">
              ENTER
            </button>
          </Link>
        </div>

        {/* Invite code */}
        <button
          onClick={copyInviteCode}
          title="Click to copy invite code"
          className="mt-3.5 flex items-center gap-2 group/code w-fit"
        >
          <Copy className="w-3.5 h-3.5 text-[#a1a1a1] group-hover/code:text-[#0A7C6E] transition-colors" />
          <code className="text-caption text-[#4e4d4c] group-hover/code:text-[#141414] transition-colors tracking-wider uppercase font-semibold">
            {room.invite_code}
          </code>
        </button>
      </div>

      {/* Leave confirmation */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent className="bg-white border border-[#e7e7e7] text-black max-w-sm rounded-[16px] shadow-none p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-heading text-black font-semibold uppercase text-xl">Leave &ldquo;{room.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4e4d4c] text-caption uppercase leading-relaxed font-semibold">
              You&apos;ll be removed from this study room. To rejoin, you&apos;ll need a new invite code from the room owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2.5">
            <AlertDialogCancel className="bg-[#f9f6f2] border border-[#e7e7e7] text-[#4e4d4c] hover:bg-[#f4eee5] hover:text-[#141414] rounded-[5px] text-caption uppercase py-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={actionLoading}
              className="bg-destructive hover:opacity-95 text-white border-0 rounded-[5px] text-caption uppercase py-2"
            >
              {actionLoading ? 'Leaving…' : 'Leave Room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-white border border-[#e7e7e7] text-black max-w-sm rounded-[16px] shadow-none p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-heading text-black font-semibold uppercase text-xl">Delete &ldquo;{room.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4e4d4c] text-caption uppercase leading-relaxed font-semibold">
              This will permanently deactivate the room and remove access for all members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2.5">
            <AlertDialogCancel className="bg-[#f9f6f2] border border-[#e7e7e7] text-[#4e4d4c] hover:bg-[#f4eee5] hover:text-[#141414] rounded-[5px] text-caption uppercase py-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive hover:opacity-95 text-white border-0 rounded-[5px] text-caption uppercase py-2"
            >
              {actionLoading ? 'Deleting…' : 'Delete Room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
