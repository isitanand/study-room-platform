'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Sparkles,
  Timer,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Home,
  UserPlus,
  UserMinus,
  Loader2,
} from 'lucide-react'

interface StudySession {
  id: string
  room_id: string
  started_by: string
  started_at: string
  ended_at: string | null
  duration_seconds: number
  is_active: boolean
  profiles?: {
    username: string
    full_name?: string | null
    avatar_url?: string | null
  }
}

interface ActivityItem {
  id: string
  room_id: string
  user_id: string
  action: string
  metadata?: any
  created_at: string
  profiles?: {
    username: string
    full_name?: string | null
  }
}

interface RoomHistoryProps {
  roomId: string
  members: any[]
}

export function RoomHistory({ roomId, members }: RoomHistoryProps) {
  const supabase = createClient()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const itemsPerPage = 50

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch study sessions (all past sessions)
      const { data: sessData, error: sessErr } = await supabase
        .from('study_sessions')
        .select(`
          id,
          room_id,
          started_by,
          started_at,
          ended_at,
          duration_seconds,
          is_active,
          profiles:started_by (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('started_at', { ascending: false })

      if (sessErr) throw sessErr

      const mappedSessions = (sessData || []).map((s: any) => ({
        ...s,
        profiles: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
      }))
      setSessions(mappedSessions)

      // 2. Fetch first page of activity timeline
      const { data: actData, error: actErr } = await supabase
        .from('activity_log')
        .select(`
          id,
          room_id,
          user_id,
          action,
          metadata,
          created_at,
          profiles:user_id (
            username,
            full_name
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(0, itemsPerPage - 1)

      if (actErr) throw actErr

      const mappedActivities = (actData || []).map((a: any) => ({
        ...a,
        profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
      }))
      setActivities(mappedActivities)
      setHasMore(mappedActivities.length === itemsPerPage)
      setPage(1)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()

    // Setup realtime subscription for study_sessions to auto-refresh list on active session updates
    const sessionSub = supabase
      .channel(`room_history_sessions:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          // Re-fetch sessions list to stay accurate
          const { data } = await supabase
            .from('study_sessions')
            .select(`
              id,
              room_id,
              started_by,
              started_at,
              ended_at,
              duration_seconds,
              is_active,
              profiles:started_by (
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('room_id', roomId)
            .order('started_at', { ascending: false })
          if (data) {
            setSessions(
              data.map((s: any) => ({
                ...s,
                profiles: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
              }))
            )
          }
        }
      )
      .subscribe()

    // Setup realtime subscription for activity_log to auto-add new timeline entries
    const activitySub = supabase
      .channel(`room_history_activities:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newAct = payload.new as any
          if (newAct.action === 'message_sent') return // ignore noisy messages

          // Fetch profile of the actor
          const { data: prof } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', newAct.user_id)
            .single()

          setActivities((prev) => {
            if (prev.some((a) => a.id === newAct.id)) return prev
            return [
              {
                id: newAct.id,
                room_id: newAct.room_id,
                user_id: newAct.user_id,
                action: newAct.action,
                metadata: newAct.metadata,
                created_at: newAct.created_at,
                profiles: prof || undefined,
              },
              ...prev,
            ]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sessionSub)
      supabase.removeChannel(activitySub)
    }
  }, [roomId])

  const loadMoreActivities = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    try {
      const startRange = page * itemsPerPage
      const endRange = startRange + itemsPerPage - 1

      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          id,
          room_id,
          user_id,
          action,
          metadata,
          created_at,
          profiles:user_id (
            username,
            full_name
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(startRange, endRange)

      if (error) throw error

      const mapped = (data || []).map((a: any) => ({
        ...a,
        profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
      }))

      if (mapped.length > 0) {
        setActivities((prev) => {
          const newItems = mapped.filter((m) => !prev.some((p) => p.id === m.id))
          return [...prev, ...newItems]
        })
        setPage((p) => p + 1)
        setHasMore(mapped.length === itemsPerPage)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more activities:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Derived metrics
  const totalSessionsCount = useMemo(() => {
    return sessions.filter((s) => !s.is_active).length
  }, [sessions])

  const totalStudyTimeText = useMemo(() => {
    const totalSecs = sessions
      .filter((s) => !s.is_active)
      .reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)

    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)

    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    }
    return `${mins}m`
  }, [sessions])

  // Helper formatting for durations
  const formatSessionDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600)
    const mins = Math.floor((secs % 3600) / 60)
    const remainingSecs = secs % 60

    const parts = []
    if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? 's' : ''}`)
    if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`)
    if (remainingSecs > 0 || parts.length === 0) {
      parts.push(`${remainingSecs} sec${remainingSecs > 1 ? 's' : ''}`)
    }

    return parts.join(' ')
  }

  // Formatting relative timestamp
  const getRelativeTime = (isoString: string) => {
    const then = new Date(isoString).getTime()
    const now = new Date().getTime()
    const diffMs = now - then

    if (diffMs < 5000) return 'just now'
    const diffSecs = Math.round(diffMs / 1000)
    if (diffSecs < 60) return `${diffSecs}s ago`
    const diffMins = Math.round(diffSecs / 60)
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    const diffHours = Math.round(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    const diffDays = Math.round(diffHours / 24)
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }

  // Formatting calendar dates
  const formatLocalDate = (isoString: string) => {
    const dateObj = new Date(isoString)
    return dateObj.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Group timeline activities by date ("Today", "Yesterday", or "MMM DD, YYYY")
  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: ActivityItem[] } = {}
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    activities
      .filter((a) => a.action !== 'message_sent')
      .forEach((act) => {
        const dateStr = new Date(act.created_at).toDateString()
        let groupTitle = ''

        if (dateStr === today) {
          groupTitle = 'Today'
        } else if (dateStr === yesterday) {
          groupTitle = 'Yesterday'
        } else {
          groupTitle = new Date(act.created_at).toLocaleDateString([], {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        }

        if (!groups[groupTitle]) {
          groups[groupTitle] = []
        }
        groups[groupTitle].push(act)
      })

    return Object.entries(groups)
  }, [activities])

  // Map timeline events to icons and text
  const renderTimelineEvent = (act: ActivityItem) => {
    const metadata = act.metadata || {}
    const name = act.profiles?.full_name || act.profiles?.username || 'Someone'

    switch (act.action) {
      case 'room_created':
        return {
          icon: <Home className="w-3.5 h-3.5 text-blue-400" />,
          color: 'bg-blue-500/10 border-blue-500/25',
          text: (
            <span>
              🏠 <span className="font-semibold text-white">@{name}</span> created this room
            </span>
          ),
        }
      case 'member_joined':
        return {
          icon: <UserPlus className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'bg-emerald-500/10 border-emerald-500/25',
          text: (
            <span>
              👋 <span className="font-semibold text-white">@{name}</span> joined the room
            </span>
          ),
        }
      case 'member_left':
        return {
          icon: <UserMinus className="w-3.5 h-3.5 text-zinc-500" />,
          color: 'bg-zinc-800 border-zinc-700',
          text: (
            <span>
              🚪 <span className="font-semibold text-zinc-400">@{name}</span> left the room
            </span>
          ),
        }
      case 'session_started':
        const startMins = metadata?.duration_minutes ?? '25'
        const starter = metadata?.started_by_username || name
        return {
          icon: <Play className="w-3.5 h-3.5 text-violet-400" />,
          color: 'bg-violet-500/10 border-violet-500/25',
          text: (
            <span>
              ▶️ <span className="font-semibold text-white">@{starter}</span> started a session ({startMins} mins)
            </span>
          ),
        }
      case 'session_ended':
        const actualSecs = metadata?.actual_duration_seconds ?? 0
        const actualMins = Math.max(1, Math.round(actualSecs / 60))
        return {
          icon: <Square className="w-3.5 h-3.5 text-amber-500" />,
          color: 'bg-amber-500/10 border-amber-500/25',
          text: (
            <span>
              ⏹️ Session ended early ({actualMins} mins completed)
            </span>
          ),
        }
      case 'session_completed':
        const compSecs = metadata?.actual_duration_seconds ?? (metadata?.duration_minutes ? metadata.duration_minutes * 60 : 1500)
        const compMins = Math.round(compSecs / 60)
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'bg-emerald-500/10 border-emerald-500/25',
          text: (
            <span>
              ✅ Session completed! ({compMins} mins)
            </span>
          ),
        }
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-zinc-500" />,
          color: 'bg-zinc-900 border-zinc-800',
          text: (
            <span>
              ⚡ <span className="font-semibold text-white">@{name}</span> performed action: {act.action}
            </span>
          ),
        }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400 bg-zinc-950">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
        <p className="text-sm">Loading room history…</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950 text-white space-y-8">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Timer className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Total Sessions
            </span>
            <h4 className="text-2xl font-bold text-white leading-none mt-1">
              {totalSessionsCount}
            </h4>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Time Accumulated
            </span>
            <h4 className="text-2xl font-bold text-white leading-none mt-1">
              {totalStudyTimeText}
            </h4>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex items-center gap-4 sm:col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Group Size
            </span>
            <h4 className="text-2xl font-bold text-white leading-none mt-1">
              {members.length} Member{members.length !== 1 ? 's' : ''}
            </h4>
          </div>
        </div>
      </div>

      {/* Study Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-2.5">
          <Calendar className="w-4.5 h-4.5 text-violet-400" />
          <h3 className="text-base font-bold text-zinc-200">Study Sessions History</h3>
        </div>

        {sessions.filter(s => !s.is_active).length === 0 ? (
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/20 p-8 text-center text-zinc-550 text-sm">
            No completed study sessions recorded yet. Start a session from the timer panel!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/25">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-bold tracking-wider uppercase bg-zinc-900/40">
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Started By</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {sessions
                  .filter((s) => !s.is_active)
                  .map((s, index, arr) => {
                    const sessionNumber = arr.length - index
                    const starterName = s.profiles?.full_name || s.profiles?.username || 'User'
                    const isEarlyEnd = s.duration_seconds < (s.duration_seconds || 1500) && s.duration_seconds !== 1500 && s.duration_seconds !== 3000

                    return (
                      <tr key={s.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-violet-400">
                          #{sessionNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5 border border-zinc-800">
                              <AvatarImage src={s.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="bg-zinc-900 text-zinc-500 text-[9px] font-semibold">
                                {starterName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-zinc-200">@{s.profiles?.username || 'user'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400" suppressHydrationWarning>
                          {formatLocalDate(s.started_at)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {formatSessionDuration(s.duration_seconds)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {s.duration_seconds >= 1490 && s.duration_seconds !== 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Completed ✅
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              Ended Early ⚠️
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chronological Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-2.5">
          <Clock className="w-4.5 h-4.5 text-violet-400" />
          <h3 className="text-base font-bold text-zinc-200">Full Activity Timeline</h3>
        </div>

        {groupedActivities.length === 0 ? (
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/20 p-8 text-center text-zinc-550 text-sm">
            No timeline logs found for this room.
          </div>
        ) : (
          <div className="space-y-8 pl-1">
            {groupedActivities.map(([dateGroup, items]) => (
              <div key={dateGroup} className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-4">
                  {dateGroup}
                </h4>

                <div className="relative border-l border-zinc-800 ml-6 pl-6 space-y-5">
                  {items.map((act) => {
                    const eventConfig = renderTimelineEvent(act)

                    return (
                      <div key={act.id} className="relative">
                        {/* Bullet point icon */}
                        <div
                          className={`absolute -left-[36px] top-0 w-6 h-6 rounded-full border flex items-center justify-center shadow-inner ${eventConfig.color}`}
                        >
                          {eventConfig.icon}
                        </div>

                        <div className="text-xs leading-normal">
                          <div className="text-zinc-350">{eventConfig.text}</div>
                          <span className="text-[9px] font-mono text-zinc-550 block mt-0.5" suppressHydrationWarning>
                            {getRelativeTime(act.created_at)} ({new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={loadMoreActivities}
                  disabled={loadingMore}
                  variant="outline"
                  className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs py-2 px-6 rounded-xl"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Loading more timeline…
                    </>
                  ) : (
                    'Load More Activity'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
