'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Square, RefreshCw, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [collapsed, setCollapsed] = useState(false)

  
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  
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
  }, [activeSession, currentUserId]) 

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

  const formatDisplayTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  
  const percentage = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0
  const svgSize = 140
  const strokeWidth = 5
  const radius = (svgSize / 2) - (strokeWidth * 2)
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const elapsedPercent = totalSeconds > 0 ? Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100) : 0

  const getStarterName = () => {
    if (!activeSession) return ''
    const starter = members.find((m) => m.userId === activeSession.started_by)
    return starter?.profile?.full_name || starter?.profile?.username || 'a member'
  }

  const getStartTimeString = () => {
    if (!activeSession) return ''
    try {
      return new Date(activeSession.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className="w-full bg-white border-b border-[#e7e7e7] font-sans shrink-0">
      {activeSession ? (
        <>
          {}
          {collapsed ? (
            <div className="flex items-center justify-between px-5 py-2.5 gap-3">
              {}
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#0A7C6E] animate-pulse shrink-0" />
                <span
                  className="font-semibold text-[#141414] tabular-nums"
                  style={{ fontSize: '1.05rem', letterSpacing: '-0.03em' }}
                  suppressHydrationWarning
                >
                  {formatDisplayTime(timeLeft)}
                </span>
                <span className="text-[11px] text-[#a1a1a1] uppercase tracking-wider hidden sm:inline">
                  remaining
                </span>
                {}
                <div className="w-20 h-1 bg-[#f0f0f0] rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full bg-[#0A7C6E] rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${elapsedPercent}%` }}
                  />
                </div>
              </div>

              {}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={ending}
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 border border-[#cc3737]/30 bg-[#cc3737]/5 text-[#cc3737] hover:bg-[#cc3737]/12 rounded-[5px] text-[12px] font-medium px-3 py-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Square className="w-3 h-3" />
                  End
                </button>
                <button
                  onClick={() => setCollapsed(false)}
                  title="Expand timer"
                  className="w-7 h-7 rounded-[5px] border border-[#e7e7e7] bg-[#f9f6f2] hover:bg-[#f4eee5] flex items-center justify-center text-[#737373] hover:text-[#141414] transition-all cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            
            <div className="flex flex-col items-center px-6 py-4.5 gap-3.5">
              {}
              <div className="w-full flex items-center justify-between">
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 text-[10px] text-[#0A7C6E] border border-[#0A7C6E]/25 bg-[#0A7C6E]/8 px-3.5 py-1 rounded-full font-medium tracking-widest uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0A7C6E] animate-pulse" />
                  Focus Session Active
                </div>
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={() => setCollapsed(true)}
                    title="Collapse timer"
                    className="w-7 h-7 rounded-[5px] border border-[#e7e7e7] bg-[#f9f6f2] hover:bg-[#f4eee5] flex items-center justify-center text-[#737373] hover:text-[#141414] transition-all cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {}
              <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
                <svg width={svgSize} height={svgSize} className="transform -rotate-90 absolute inset-0">
                  <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} stroke="#f0f0f0" strokeWidth={strokeWidth} fill="transparent" />
                  <circle
                    cx={svgSize / 2} cy={svgSize / 2} r={radius}
                    stroke="#0A7C6E" strokeWidth={strokeWidth} fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center z-10 select-none">
                  <span
                    className="font-sans font-semibold text-[#141414] tabular-nums"
                    style={{ fontSize: '2rem', letterSpacing: '-0.04em', lineHeight: 1 }}
                    suppressHydrationWarning
                  >
                    {formatDisplayTime(timeLeft)}
                  </span>
                  <span className="text-[9px] text-[#a1a1a1] uppercase tracking-[0.15em] mt-1.5 font-medium">
                    Remaining
                  </span>
                </div>
              </div>

              {}
              <div className="w-full max-w-[140px] h-0.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0A7C6E] rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${elapsedPercent}%` }}
                />
              </div>

              {}
              <p className="text-[11px] text-[#737373] text-center">
                Started by{' '}
                <span className="font-semibold text-[#141414]">@{getStarterName()}</span>
                {' '}at{' '}
                <span className="font-semibold text-[#141414]" suppressHydrationWarning>{getStartTimeString()}</span>
              </p>

              {}
              <button
                disabled={ending}
                onClick={handleCancel}
                className="flex items-center gap-2 border border-[#cc3737]/30 bg-[#cc3737]/5 text-[#cc3737] hover:bg-[#cc3737]/12 rounded-[5px] font-medium text-[12px] px-6 py-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Square className="w-3 h-3" />
                {ending ? 'Ending…' : 'End Session'}
              </button>
            </div>
          )}
        </>
      ) : (
        
        <div className="flex flex-col items-center px-8 py-8 gap-4 text-center">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#e7e7e7] flex items-center justify-center bg-[#f9f6f2]">
            <Clock className="w-6 h-6 text-[#a1a1a1]" />
          </div>

          <div>
            <h3 className="text-[14px] font-semibold text-[#141414] tracking-tight">No active session</h3>
            <p className="text-[12px] text-[#737373] max-w-[220px] mt-1 leading-relaxed mx-auto">
              Start a synced Pomodoro timer for everyone in this room.
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="btn-evernote-primary text-[13px] py-2 px-6 h-9 cursor-pointer flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-white" />
                Start Session
              </button>
            </DialogTrigger>

            <DialogContent className="bg-white border border-[#e7e7e7] text-[#141414] max-w-sm rounded-[16px] shadow-none p-6 font-sans">
              <DialogHeader>
                <DialogTitle className="text-[17px] text-[#141414] font-semibold tracking-tight">Start Study Session</DialogTitle>
                <DialogDescription className="text-[#737373] text-[13px] mt-1.5 leading-relaxed">
                  Choose a duration. The timer syncs in real-time for all room members.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-2.5 mt-5 mb-1">
                {[25, 50, -1].map((val) => {
                  const isActive = duration === val
                  const label = val === -1 ? 'Custom' : `${val} min`
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDuration(val)}
                      className={`text-[13px] py-2.5 rounded-[5px] border transition-all font-medium cursor-pointer ${
                        isActive
                          ? 'bg-[#141414] text-white border-[#141414]'
                          : 'border-[#e7e7e7] bg-transparent text-[#4e4d4c] hover:text-[#141414] hover:border-[#141414]'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {duration === -1 && (
                <div className="space-y-1.5 my-4">
                  <Label htmlFor="custom-mins" className="text-[13px] text-[#4e4d4c] font-medium">Duration (minutes)</Label>
                  <Input
                    id="custom-mins"
                    type="number"
                    min="1"
                    max="180"
                    placeholder="e.g. 45"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="bg-white border border-[#e7e7e7] text-[#141414] focus-visible:ring-1 focus-visible:ring-[#0A7C6E] focus-visible:border-[#0A7C6E] rounded-[5px] h-10 placeholder:text-[#a1a1a1] text-[14px] px-3 font-sans shadow-none"
                  />
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={starting}
                className="btn-evernote-primary w-full text-[13px] py-2.5 mt-4 justify-center h-10 cursor-pointer flex items-center gap-2"
              >
                {starting
                  ? <><RefreshCw className="w-4 h-4 animate-spin text-white" /> Starting…</>
                  : <><Play className="w-3.5 h-3.5 text-white" /> Start Session</>
                }
              </button>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
