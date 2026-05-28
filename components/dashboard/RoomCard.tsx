'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Room } from './DashboardClient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      <div className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-700 hover:bg-zinc-900/90 transition-all duration-200 overflow-hidden">
        {/* Subtle top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Card header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {room.has_active_session && (
                <div className="flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  <span className="text-[10px] font-semibold text-green-400 leading-none">LIVE</span>
                </div>
              )}
              {isOwner && (
                <Badge className="text-[10px] px-1.5 h-4 bg-violet-600/15 text-violet-400 border-violet-500/25 hover:bg-violet-600/15">
                  Owner
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-white leading-tight line-clamp-1 text-[15px]">
              {room.name}
            </h3>
            {room.subject && (
              <p className="text-xs text-violet-400 mt-0.5 font-medium">{room.subject}</p>
            )}
          </div>

          {/* Options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-zinc-600 hover:text-white hover:bg-zinc-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Room options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-900 border-zinc-800 text-zinc-300 w-44 shadow-xl shadow-black/40"
            >
              <DropdownMenuItem asChild>
                <Link
                  href={`/rooms/${room.id}`}
                  className="flex items-center gap-2 hover:bg-zinc-800 hover:text-white cursor-pointer px-2 py-1.5 rounded-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Enter Room
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={copyInviteCode}
                className="hover:bg-zinc-800 hover:text-white cursor-pointer gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Invite Code
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800" />

              {!isOwner && (
                <DropdownMenuItem
                  onClick={() => setLeaveOpen(true)}
                  className="text-red-400 hover:bg-red-950/30 hover:text-red-300 cursor-pointer gap-2 focus:text-red-300 focus:bg-red-950/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Leave Room
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-400 hover:bg-red-950/30 hover:text-red-300 cursor-pointer gap-2 focus:text-red-300 focus:bg-red-950/30"
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
            <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
              {room.description}
            </p>
          ) : (
            <p className="text-sm text-zinc-700 italic">No description</p>
          )}
        </div>

        {/* Room Metrics & Aggregations */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-950/40 rounded-xl p-3 border border-zinc-800/40 text-[11px] text-zinc-400">
          <div>
            <span className="text-zinc-650 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Sessions</span>
            <span className="font-semibold text-zinc-300 font-mono">
              {room.total_completed_sessions || 0} completed
            </span>
          </div>
          <div>
            <span className="text-zinc-650 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Study Time</span>
            <span className="font-semibold text-zinc-300 font-mono">
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
            <div className="col-span-2 border-t border-zinc-800/45 pt-1.5 mt-1">
              <span className="text-zinc-650 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Last Active</span>
              <span className="font-medium text-zinc-400" suppressHydrationWarning>
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
        <div className="flex items-center justify-between pt-3.5 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            <span>
              {room.member_count} member{room.member_count !== 1 ? 's' : ''}
            </span>
          </div>
          <Link href={`/rooms/${room.id}`}>
            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 border border-violet-500/20 hover:border-violet-400/40 transition-all shadow-none"
            >
              Enter
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Invite code */}
        <button
          onClick={copyInviteCode}
          title="Click to copy invite code"
          className="mt-2 flex items-center gap-1.5 group/code w-fit"
        >
          <Copy className="w-3 h-3 text-zinc-700 group-hover/code:text-zinc-500 transition-colors" />
          <code className="text-[11px] font-mono text-zinc-700 group-hover/code:text-zinc-500 transition-colors tracking-wider">
            {room.invite_code}
          </code>
        </button>
      </div>

      {/* Leave confirmation */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave &ldquo;{room.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              You&apos;ll be removed from this room. To rejoin, you&apos;ll need a new invite code from the room owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-500 text-white border-0"
            >
              {actionLoading ? 'Leaving…' : 'Leave Room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{room.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently deactivate the room and remove access for all members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-500 text-white border-0"
            >
              {actionLoading ? 'Deleting…' : 'Delete Room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
