'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Square, Timer, RefreshCw, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'

interface StudySession {
  id: string
  room_id: string
  started_by: string
  started_at: string
  duration_minutes: number
  ends_at: string
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}

interface StudyTimerProps {
  roomId: string
  currentUserId: string
  activeSession: StudySession | null
  members: any[]
  onStartSession: (durationMinutes: number) => Promise<void>
  onEndSession: (sessionId: string, status: 'completed' | 'cancelled') => Promise<void>
}

export function StudyTimer({
  roomId,
  currentUserId,
  activeSession,
  members,
  onStartSession,
  onEndSession,
}: StudyTimerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [duration, setDuration] = useState(25)
  const [customDuration, setCustomDuration] = useState('')
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)

  // Countdown local state
  const [timeLeft, setTimeLeft] = useState(0) // seconds
  const [totalSeconds, setTotalSeconds] = useState(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sync state with activeSession
  useEffect(() => {
    if (activeSession) {
      const calculateTimeLeft = () => {
        const end = new Date(activeSession.ends_at).getTime()
        const start = new Date(activeSession.started_at).getTime()
        const now = new Date().getTime()

        const total = Math.round((end - start) / 1000)
        const left = Math.round((end - now) / 1000)

        setTotalSeconds(total > 0 ? total : activeSession.duration_minutes * 60)
        setTimeLeft(left > 0 ? left : 0)

        if (left <= 0 && activeSession.status === 'active') {
          // If session ended naturally, mark it complete if we are the user who started it
          if (activeSession.started_by === currentUserId) {
            onEndSession(activeSession.id, 'completed')
          }
        }
      }

      calculateTimeLeft()

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

      timerIntervalRef.current = setInterval(() => {
        const end = new Date(activeSession.ends_at).getTime()
        const now = new Date().getTime()
        const left = Math.round((end - now) / 1000)

        if (left <= 0) {
          setTimeLeft(0)
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
          
          // Trigger completion sound/toast
          toast.success('Study session completed! Time for a break.')
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav')
            audio.volume = 0.5
            audio.play().catch(() => {})
          } catch {}

          if (activeSession.started_by === currentUserId) {
            onEndSession(activeSession.id, 'completed')
          }
        } else {
          setTimeLeft(left)
        }
      }, 1000)
    } else {
      setTimeLeft(0)
      setTotalSeconds(0)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [activeSession, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    const finalMinutes = duration === -1 ? parseInt(customDuration) : duration
    if (isNaN(finalMinutes) || finalMinutes <= 0 || finalMinutes > 180) {
      toast.error('Please enter a duration between 1 and 180 minutes.')
      return
    }

    setStarting(true)
    try {
      await onStartSession(finalMinutes)
      setIsOpen(false)
      toast.success(`Study session started for ${finalMinutes} minutes!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to start study session.')
    } finally {
      setStarting(false)
    }
  }

  const handleCancel = async () => {
    if (!activeSession) return
    setEnding(true)
    try {
      await onEndSession(activeSession.id, 'cancelled')
      toast.info('Study session ended.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to end study session.')
    } finally {
      setEnding(false)
    }
  }

  // Format HH:MM:SS
  const formatDisplayTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Calculate SVG stroke offset for radial timer
  const percentage = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Get starter user info
  const getStarterName = () => {
    if (!activeSession) return ''
    const starter = members.find((m) => m.userId === activeSession.started_by)
    return starter?.profile?.full_name || starter?.profile?.username || 'a member'
  }

  const getStartTimeString = () => {
    if (!activeSession) return ''
    try {
      return new Date(activeSession.started_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800 p-6 flex flex-col items-center justify-center shrink-0">
      {activeSession ? (
        // Active Session View
        <div className="flex flex-col items-center w-full max-w-sm">
          <div className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20 mb-4 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">Session in Progress</span>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-zinc-800/60"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-violet-500 transition-all duration-1000 ease-linear"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-bold tracking-tight text-white" suppressHydrationWarning>
                {formatDisplayTime(timeLeft)}
              </span>
              <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase mt-1">
                Remaining
              </span>
            </div>
          </div>

          {/* Session Metadata info */}
          <p className="text-[11px] text-zinc-500 mb-5 text-center leading-relaxed max-w-[240px]">
            Started by <span className="text-zinc-300 font-semibold">@{getStarterName()}</span> at{' '}
            <span className="text-zinc-300 font-semibold" suppressHydrationWarning>{getStartTimeString()}</span>
          </p>

          <div className="flex items-center gap-3 w-full max-w-xs">
            <Button
              variant="outline"
              disabled={ending}
              onClick={handleCancel}
              className="w-full border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 transition-all text-xs font-bold py-2 rounded-xl"
            >
              <Square className="w-3.5 h-3.5 mr-2" />
              End Session
            </Button>
          </div>
        </div>
      ) : (
        // Start Session Card
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full mb-3">
            <AlertCircle className="w-3 h-3 text-zinc-500" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">No Active Session</span>
          </div>

          <h3 className="text-sm font-semibold text-zinc-200">Start a study session</h3>
          <p className="text-xs text-zinc-500 max-w-[200px] mt-1 mb-4 leading-relaxed">
            Timer status is synchronized in real-time across all study room members.
          </p>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet-650 hover:bg-violet-750 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-lg shadow-violet-900/25">
                <Play className="w-3 h-3 mr-1.5" />
                Start Study Session
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border border-zinc-800 text-white max-w-sm rounded-2xl">
              <DialogHeader>
                <DialogTitle>Start Study Session</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Select a duration. This timer will sync in real-time across all study room members.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-2 my-4">
                <Button
                  type="button"
                  variant={duration === 25 ? 'default' : 'outline'}
                  onClick={() => setDuration(25)}
                  className={`text-xs font-medium ${
                    duration === 25 ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  25 min
                </Button>
                <Button
                  type="button"
                  variant={duration === 50 ? 'default' : 'outline'}
                  onClick={() => setDuration(50)}
                  className={`text-xs font-medium ${
                    duration === 50 ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  50 min
                </Button>
                <Button
                  type="button"
                  variant={duration === -1 ? 'default' : 'outline'}
                  onClick={() => setDuration(-1)}
                  className={`text-xs font-medium ${
                    duration === -1 ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Custom
                </Button>
              </div>

              {duration === -1 && (
                <div className="space-y-1.5 mb-4">
                  <Label htmlFor="custom-mins" className="text-xs text-zinc-400">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="custom-mins"
                    type="number"
                    min="1"
                    max="180"
                    placeholder="Enter minutes..."
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-violet-500 rounded-xl"
                  />
                </div>
              )}

              <Button
                onClick={handleStart}
                disabled={starting}
                className="w-full bg-violet-600 hover:bg-violet-750 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md"
              >
                {starting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-2" />}
                Start Session
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
