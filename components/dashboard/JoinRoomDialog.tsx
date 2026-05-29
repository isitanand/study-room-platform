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
      <DialogContent className="bg-[#ffffff] border border-[#e7e7e7] text-[#141414] sm:max-w-sm rounded-[16px] shadow-none p-6 font-sans">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-[5px] border border-[#e7e7e7] flex items-center justify-center bg-[#f4eee5]">
              <Hash className="w-4 h-4 text-[#141414]" />
            </div>
            <DialogTitle className="text-[#141414] text-heading-sm font-semibold tracking-tight">
              Join Study Room
            </DialogTitle>
          </div>
          <DialogDescription className="text-[#4e4d4c] text-[13px] tracking-normal font-normal">
            Enter the 8-character invite code shared by the room owner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {error && (
            <div className="rounded-[5px] bg-[#f4eee5] border border-[#cc3737]/20 px-3.5 py-2.5 text-[13px] font-normal text-[#cc3737]">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="join-invite-code" className="text-[#4e4d4c] text-[13px] font-medium tracking-normal">
              Invite Code <span className="text-[#cc3737]">*</span>
            </Label>
            <Input
              id="join-invite-code"
              name="invite_code"
              placeholder="e.g. a1b2c3d4"
              maxLength={8}
              required
              autoComplete="off"
              disabled={loading}
              className="bg-white border border-[#e7e7e7] text-[#141414] placeholder:text-[#a1a1a1] focus-visible:ring-1 focus-visible:ring-[#0A7C6E] focus-visible:border-[#141414] rounded-[5px] h-12 text-center text-xl tracking-[0.3em] font-mono uppercase"
            />
            <p className="text-[#737373] text-[12px] tracking-normal font-normal mt-1">
              8 characters — letters and numbers
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e7e7e7] mt-6">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-transparent text-[#4e4d4c] hover:text-[#141414] hover:bg-[#f4eee5] rounded-[5px] font-medium text-[14px] px-4 h-10 transition-all border-none shadow-none cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              id="join-room-submit"
              type="submit"
              disabled={loading}
              className="btn-evernote-primary h-10 min-w-24 text-[14px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
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

