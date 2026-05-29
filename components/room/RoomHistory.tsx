'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Sparkles,
  Timer,
  CheckCircle2,
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
          if (newAct.action === 'message_sent') return 

          
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

  
  const getRelativeTime = (isoString: string) => {
    const then = new Date(isoString).getTime()
    const now = new Date().getTime()
    const diffMs = now - then

    if (diffMs < 5000) return 'Just now'
    const diffSecs = Math.round(diffMs / 1000)
    if (diffSecs < 60) return `${diffSecs}s ago`
    const diffMins = Math.round(diffSecs / 60)
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    const diffHours = Math.round(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    const diffDays = Math.round(diffHours / 24)
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }

  
  const formatLocalDate = (isoString: string) => {
    const dateObj = new Date(isoString)
    return dateObj.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  
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

  
  const renderTimelineEvent = (act: ActivityItem) => {
    const metadata = act.metadata || {}
    const name = act.profiles?.username || 'Someone'

    switch (act.action) {
      case 'room_created':
        return {
          icon: <Home className="w-3 h-3 text-[#262626]" />,
          color: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#141414] font-semibold">@{name}</span> created this room
            </span>
          ),
        }
      case 'member_joined':
        return {
          icon: <UserPlus className="w-3 h-3 text-[#262626]" />,
          color: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#141414] font-semibold">@{name}</span> joined the room
            </span>
          ),
        }
      case 'member_left':
        return {
          icon: <UserMinus className="w-3 h-3 text-[#737373]" />,
          color: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#737373]">@{name}</span> left the room
            </span>
          ),
        }
      case 'session_started':
        const startMins = metadata?.duration_minutes ?? '25'
        const starter = metadata?.started_by_username || name
        return {
          icon: <Play className="w-3 h-3 text-[#262626]" />,
          color: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#141414] font-semibold">@{starter}</span> started a session ({startMins} mins)
            </span>
          ),
        }
      case 'session_ended':
        const actualSecs = metadata?.actual_duration_seconds ?? 0
        const actualMins = Math.max(1, Math.round(actualSecs / 60))
        return {
          icon: <Square className="w-3 h-3 text-[#262626]" />,
          color: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              Session ended early ({actualMins} mins completed)
            </span>
          ),
        }
      case 'session_completed':
        const compSecs = metadata?.actual_duration_seconds ?? (metadata?.duration_minutes ? metadata.duration_minutes * 60 : 1500)
        const compMins = Math.round(compSecs / 60)
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-[#0A7C6E]" />,
          color: 'bg-[#0A7C6E]/10 border-[#0A7C6E]/30',
          text: (
            <span className="text-[#141414] font-semibold">
              Session completed! ({compMins} mins)
            </span>
          ),
        }
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-[#262626]" />,
          color: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#141414] font-semibold">@{name}</span> performed action: {act.action}
            </span>
          ),
        }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#4e4d4c] bg-[#f9f6f2] font-sans">
        <Loader2 className="w-6 h-6 text-[#141414] animate-spin mb-3" />
        <p className="text-[14px]">Loading room history…</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f9f6f2] text-[#4e4d4c] space-y-8 text-[14px] font-sans">
      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {}
        <div className="bg-white border border-[#e7e7e7] rounded-[10px] p-5 flex flex-col gap-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#737373] uppercase tracking-wider font-semibold">
              Total Sessions
            </span>
            <div className="w-8 h-8 rounded-[5px] bg-[#f4eee5] border border-[#e7e7e7] flex items-center justify-center">
              <Timer className="w-4 h-4 text-[#262626]" />
            </div>
          </div>
          <div>
            <h4 className="text-[#141414] text-heading-sm font-semibold tracking-tight">
              {totalSessionsCount}
            </h4>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#e7e7e7] rounded-[10px] p-5 flex flex-col gap-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#737373] uppercase tracking-wider font-semibold">
              Time Accumulated
            </span>
            <div className="w-8 h-8 rounded-[5px] bg-[#f4eee5] border border-[#e7e7e7] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#262626]" />
            </div>
          </div>
          <div>
            <h4 className="text-[#141414] text-heading-sm font-semibold tracking-tight">
              {totalStudyTimeText}
            </h4>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#e7e7e7] rounded-[10px] p-5 flex flex-col gap-4 sm:col-span-2 md:col-span-1 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#737373] uppercase tracking-wider font-semibold">
              Group Size
            </span>
            <div className="w-8 h-8 rounded-[5px] bg-[#f4eee5] border border-[#e7e7e7] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#262626]" />
            </div>
          </div>
          <div>
            <h4 className="text-[#141414] text-heading-sm font-semibold tracking-tight">
              {members.length} Member{members.length !== 1 ? 's' : ''}
            </h4>
          </div>
        </div>
      </div>

      {}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#e7e7e7] pb-2.5">
          <Calendar className="w-4.5 h-4.5 text-[#262626]" />
          <h3 className="text-heading-sm font-semibold text-[#141414]">Study Sessions History</h3>
        </div>

        {sessions.filter(s => !s.is_active).length === 0 ? (
          <div className="border border-[#e7e7e7] bg-white p-8 rounded-[10px] text-center text-[#737373] text-[14px]">
            No completed study sessions recorded yet. Start a session from the timer panel!
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#e7e7e7] bg-white shadow-none rounded-[10px]">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-[#e7e7e7] text-[#737373] font-medium bg-[#f4eee5] text-[12px] uppercase">
                  <th className="py-3.5 px-4 font-semibold">Session</th>
                  <th className="py-3.5 px-4 font-semibold">Started By</th>
                  <th className="py-3.5 px-4 font-semibold">Date &amp; Time</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e7e7] text-[#141414]">
                {sessions
                  .filter((s) => !s.is_active)
                  .map((s, index, arr) => {
                    const sessionNumber = arr.length - index
                    const starterName = s.profiles?.full_name || s.profiles?.username || 'User'

                    return (
                      <tr key={s.id} className="hover:bg-[#f9f6f2] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#141414]">
                          #{sessionNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5 border border-[#e7e7e7] rounded-[5px]">
                              <AvatarImage src={s.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="bg-[#f4eee5] text-[#141414] text-[9px] rounded-[5px] font-medium">
                                {starterName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[#141414] font-semibold">@{s.profiles?.username || 'user'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#4e4d4c]" suppressHydrationWarning>
                          {formatLocalDate(s.started_at)}
                        </td>
                        <td className="py-3 px-4 text-[#141414]">
                          {formatSessionDuration(s.duration_seconds)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {s.duration_seconds >= 1490 && s.duration_seconds !== 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#0A7C6E] bg-[#0A7C6E]/10 border border-[#0A7C6E]/30 px-2 py-0.5 rounded-[52px] font-medium uppercase">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#737373] bg-[#f4eee5] border border-[#e7e7e7] px-2 py-0.5 rounded-[52px] font-medium uppercase">
                              Ended Early
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

      {}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#e7e7e7] pb-2.5">
          <Clock className="w-4.5 h-4.5 text-[#262626]" />
          <h3 className="text-heading-sm font-semibold text-[#141414]">Full Activity Timeline</h3>
        </div>

        {groupedActivities.length === 0 ? (
          <div className="border border-[#e7e7e7] bg-white p-8 rounded-[10px] text-center text-[#737373]">
            No timeline logs found for this room.
          </div>
        ) : (
          <div className="space-y-8 pl-1">
            {groupedActivities.map(([dateGroup, items]) => (
              <div key={dateGroup} className="space-y-4">
                <h4 className="text-[12px] text-[#737373] tracking-wide pl-4 font-semibold uppercase">
                  {dateGroup}
                </h4>

                <div className="relative border-l border-[#e7e7e7] ml-6 pl-6 space-y-5">
                  {items.map((act) => {
                    const eventConfig = renderTimelineEvent(act)

                    return (
                      <div key={act.id} className="relative">
                        {}
                        <div
                          className={`absolute -left-[37px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center bg-white ${eventConfig.color}`}
                        >
                          {eventConfig.icon}
                        </div>

                        <div className="text-[13px] leading-relaxed text-[#4e4d4c]">
                          <div>{eventConfig.text}</div>
                          <span className="text-[10px] text-[#737373] block mt-0.5" suppressHydrationWarning>
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
                <button
                  onClick={loadMoreActivities}
                  disabled={loadingMore}
                  className="border border-[#e7e7e7] bg-white hover:bg-[#f4eee5] text-[#262626] rounded-[5px] font-sans text-xs uppercase px-6 py-2.5 transition-all cursor-pointer flex items-center justify-center shadow-none font-medium"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-[#262626]" />
                      Loading more timeline…
                    </>
                  ) : (
                    'Load More Activity'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

