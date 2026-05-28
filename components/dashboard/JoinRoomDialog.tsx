'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Hash } from 'lucide-react'

interface JoinRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: () => void
}

export function JoinRoomDialog({ open, onOpenChange, userId, onSuccess }: JoinRoomDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const inviteCode = (fd.get('invite_code') as string).trim().toLowerCase()

    if (inviteCode.length !== 8) {
      setError('Invite code must be exactly 8 characters.')
      setLoading(false)
      return
    }

    try {
      // 1. Find room by invite code
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('id, name, is_active')
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .maybeSingle()

      if (roomErr) throw roomErr
      if (!room) {
        setError('Invalid or expired invite code. Please check and try again.')
        return
      }

      // 2. Check if already a member
      const { data: existing } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        setError('You are already a member of this room.')
        return
      }

      // 3. Join as member
      const { error: joinErr } = await supabase
        .from('room_members')
        .insert({ room_id: room.id, user_id: userId, role: 'member' })

      if (joinErr) throw joinErr

      // 4. Activity log
      await supabase.from('activity_log').insert({
        room_id: room.id,
        user_id: userId,
        action: 'member_joined',
      })

      onOpenChange(false)
      ;(e.target as HTMLFormElement).reset()
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join room'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Hash className="w-4 h-4 text-violet-400" />
            </div>
            <DialogTitle className="text-white text-lg">Join Study Room</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-sm">
            Enter the 8-character invite code shared by the room owner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-900/50 px-3.5 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="join-invite-code" className="text-zinc-300 text-sm font-medium">
              Invite Code <span className="text-red-400">*</span>
            </Label>
            <Input
              id="join-invite-code"
              name="invite_code"
              placeholder="e.g. a1b2c3d4"
              maxLength={8}
              required
              autoComplete="off"
              disabled={loading}
              className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-400 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 h-12 text-center font-mono text-xl tracking-[0.3em]"
            />
            <p className="text-xs text-zinc-600">8 characters — letters and numbers</p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              id="join-room-submit"
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 text-white min-w-24 shadow-lg shadow-violet-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining…
                </>
              ) : (
                'Join Room'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
