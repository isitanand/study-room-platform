'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoomCard } from './RoomCard'
import { CreateRoomDialog } from './CreateRoomDialog'
import { JoinRoomDialog } from './JoinRoomDialog'
import { StatsCards } from './StatsCards'

// Lazy load StudyChart component to optimize performance
const StudyChart = dynamic(
  () => import('./StudyChart').then((mod) => mod.StudyChart),
  { ssr: false, loading: () => <Skeleton className="h-[340px] w-full bg-zinc-900/60" /> }
)

import { ActivityFeed } from './ActivityFeed'
import { Leaderboard } from './Leaderboard'
import { DashboardShell } from './DashboardShell'
import { toast } from 'sonner'
import { Plus, LogIn, Users, Timer, Sparkles } from 'lucide-react'

export type Room = {
  id: string
  name: string
  description: string | null
  subject: string | null
  created_by: string
  invite_code: string
  is_active: boolean
  created_at: string
  member_count: number
  has_active_session: boolean
  user_role: 'owner' | 'member'
  total_completed_sessions: number
  total_study_time_seconds: number
  last_active_at: string | null
}

interface DashboardClientProps {
  userId: string
}

export function DashboardClient({ userId }: DashboardClientProps) {
  const supabase = createClient()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  // Extra dashboard stats states
  const [totalStudyTime, setTotalStudyTime] = useState(0)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [roomsJoinedCount, setRoomsJoinedCount] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [roomSummaries, setRoomSummaries] = useState<any[]>([])
  const [leaderboards, setLeaderboards] = useState<any[]>([])

  const fetchAllDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch user's room memberships
      const { data: memberData, error: memberErr } = await supabase
        .from('room_members')
        .select(`
          room_id,
          role,
          rooms:room_id (
            id, name, description, subject,
            created_by, invite_code, is_active, created_at
          )
        `)
        .eq('user_id', userId)

      if (memberErr) throw memberErr

      // Filter only active rooms
      type RoomRow = { role: string; room_id: string; rooms: Record<string, any> }
      const activeRows = ((memberData || []) as any[]).filter(
        (m) => m.rooms && m.rooms.is_active === true
      )

      setRoomsJoinedCount(activeRows.length)

      if (activeRows.length === 0) {
        setRooms([])
        setTotalStudyTime(0)
        setSessionsCompleted(0)
        setStreakDays(0)
        setChartData([])
        setRecentActivities([])
        setRoomSummaries([])
        setLeaderboards([])
        setLoading(false)
        return
      }

      const roomIds = activeRows.map((m) => m.room_id)

      // Fetch queries in parallel using Promise.all
      const [
        allMembersResult,
        activeSessionsResult,
        allSessionsResult,
        activitiesResult,
        profilesResult,
      ] = await Promise.all([
        supabase.from('room_members').select('room_id, user_id, profiles:user_id(username, full_name, avatar_url)').in('room_id', roomIds),
        supabase.from('study_sessions').select('room_id').in('room_id', roomIds).eq('is_active', true).gt('ended_at', new Date().toISOString()),
        supabase.from('study_sessions').select('room_id, duration_seconds, started_by, ended_at, is_active, started_at').in('room_id', roomIds),
        supabase.from('activity_log').select('id, room_id, user_id, action, metadata, created_at, rooms:room_id(name), profiles:user_id(username, full_name)').in('room_id', roomIds).order('created_at', { ascending: false }).limit(15),
        supabase.from('profiles').select('id, username, full_name, avatar_url'),
      ])

      const allMembers = allMembersResult.data || []
      const activeSessions = activeSessionsResult.data || []
      const allSessions = allSessionsResult.data || []
      const activitiesRaw = activitiesResult.data || []
      const profilesMap = new Map((profilesResult.data || []).map((p) => [p.id, p]))

      // Filter activities to exclude noisy message_sent logs
      const filteredActivities = activitiesRaw
        .filter((act) => act.action !== 'message_sent')
        .slice(0, 10)
        .map((act) => ({
          ...act,
          room_name: (act.rooms as any)?.name || (Array.isArray(act.rooms) ? (act.rooms[0] as any)?.name : undefined),
          profiles: act.profiles ? (Array.isArray(act.profiles) ? act.profiles[0] : act.profiles) : undefined,
        }))
      setRecentActivities(filteredActivities)

      // Aggregate Study Sessions Metrics
      const completedSessions = allSessions.filter((s) => !s.is_active && s.ended_at)
      setSessionsCompleted(completedSessions.length)

      const totalTimeSecs = completedSessions.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
      setTotalStudyTime(totalTimeSecs)

      // Calculate Study Streak (consecutive days of session participation)
      const uniqueStreakDays = new Set(
        completedSessions.map((s) => new Date(s.started_at).toDateString())
      )
      const sortedDates = Array.from(uniqueStreakDays)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime())

      let streak = 0
      if (sortedDates.length > 0) {
        const todayStr = new Date().toDateString()
        const yesterdayStr = new Date(Date.now() - 86400000).toDateString()
        const latestDateStr = sortedDates[0].toDateString()

        if (latestDateStr === todayStr || latestDateStr === yesterdayStr) {
          streak = 1
          let currentRef = sortedDates[0]
          for (let i = 1; i < sortedDates.length; i++) {
            const diffTime = currentRef.getTime() - sortedDates[i].getTime()
            const diffDays = Math.round(diffTime / 86400000)
            if (diffDays === 1) {
              streak++
              currentRef = sortedDates[i]
            } else if (diffDays > 1) {
              break
            }
          }
        }
      }
      setStreakDays(streak)

      // Aggregate weekly study chart stats (current week vs last week last 7 days)
      const daysAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const todayDayIdx = new Date().getDay()
      const chartMap = Array.from({ length: 7 }).map((_, index) => {
        const targetDayIdx = (todayDayIdx - 6 + index + 7) % 7
        return {
          day: daysAbbr[targetDayIdx],
          dayIndex: targetDayIdx,
          currentWeek: 0,
          lastWeek: 0,
        }
      })

      const nowTime = Date.now()
      const oneWeekAgo = nowTime - 7 * 86400000
      const twoWeeksAgo = nowTime - 14 * 86400000

      completedSessions.forEach((sess) => {
        const sessTime = new Date(sess.started_at).getTime()
        const dayIdx = new Date(sess.started_at).getDay()
        const item = chartMap.find((c) => c.dayIndex === dayIdx)

        if (item) {
          const durationMins = Math.round((sess.duration_seconds || 0) / 60)
          if (sessTime >= oneWeekAgo && sessTime <= nowTime) {
            item.currentWeek += durationMins
          } else if (sessTime >= twoWeeksAgo && sessTime < oneWeekAgo) {
            item.lastWeek += durationMins
          }
        }
      })
      setChartData(chartMap)

      // Map Room summaries
      const summaries = activeRows.map((mr) => {
        const r = mr.rooms
        const rId = mr.room_id
        const roomSess = completedSessions.filter((s) => s.room_id === rId)
        const roomTimeSecs = roomSess.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)

        // Find last active session ended_at or room created_at
        let lastActive: string | null = r.created_at as string
        roomSess.forEach((s) => {
          if (s.ended_at && new Date(s.ended_at).getTime() > new Date(lastActive!).getTime()) {
            lastActive = s.ended_at
          }
        })

        return {
          id: rId,
          name: r.name as string,
          subject: r.subject as string | null,
          totalSessions: roomSess.length,
          totalStudyTimeSeconds: roomTimeSecs,
          lastActive,
        }
      })
      // Sort summaries by last active date
      summaries.sort((a, b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime())
      setRoomSummaries(summaries)

      // Generate Leaderboard scores
      const boards = activeRows.map((mr) => {
        const rId = mr.room_id
        const roomSess = completedSessions.filter((s) => s.room_id === rId)
        
        // Sum elapsed study time per member
        const userTimeMap: { [key: string]: number } = {}
        roomSess.forEach((s) => {
          const sBy = s.started_by
          if (sBy) {
            userTimeMap[sBy] = (userTimeMap[sBy] || 0) + (s.duration_seconds || 0)
          }
        })

        const boardMembers = Object.entries(userTimeMap).map(([uId, secs]) => {
          const prof = profilesMap.get(uId)
          return {
            userId: uId,
            username: prof?.username || 'user',
            fullName: prof?.full_name,
            avatarUrl: prof?.avatar_url,
            totalTimeSeconds: secs,
          }
        })

        // Sort descending
        boardMembers.sort((a, b) => b.totalTimeSeconds - a.totalTimeSeconds)

        return {
          roomId: rId,
          roomName: mr.rooms.name as string,
          members: boardMembers,
        }
      })
      setLeaderboards(boards)

      // Map combined rooms list
      const combined: Room[] = activeRows.map((mr) => {
        const r = mr.rooms
        const rId = mr.room_id
        const sum = summaries.find((s) => s.id === rId)
        return {
          id: rId,
          name: r.name as string,
          description: r.description as string | null,
          subject: r.subject as string | null,
          created_by: r.created_by as string,
          invite_code: r.invite_code as string,
          is_active: r.is_active as boolean,
          created_at: r.created_at as string,
          user_role: mr.role as 'owner' | 'member',
          member_count: allMembers.filter((m) => m.room_id === rId).length,
          has_active_session: activeSessions.some((s) => s.room_id === rId),
          total_completed_sessions: sum?.totalSessions || 0,
          total_study_time_seconds: sum?.totalStudyTimeSeconds || 0,
          last_active_at: sum?.lastActive || null,
        }
      })
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRooms(combined)
    } catch (err: any) {
      toast.error('Failed to load dashboard data. Please refresh.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  // Setup periodic refresh (every 60 seconds) and tab focus refresh
  useEffect(() => {
    fetchAllDashboardData()

    const interval = setInterval(fetchAllDashboardData, 60000)

    const onFocus = () => {
      fetchAllDashboardData()
    }
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchAllDashboardData])

  return (
    <DashboardShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Study Dashboard</h2>
          <p className="text-zinc-500 text-sm mt-1">
            {loading
              ? 'Loading study overview…'
              : rooms.length > 0
              ? `Manage your rooms, view streak indicators, or start Pomodoro sessions.`
              : 'No joined study rooms yet'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            id="join-room-btn"
            variant="outline"
            onClick={() => setJoinOpen(true)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-9 rounded-xl"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Join Room
          </Button>
          <Button
            id="create-room-btn"
            onClick={() => setCreateOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white h-9 shadow-lg shadow-violet-900/25 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Room
          </Button>
        </div>
      </div>

      {/* TOP SECTION: Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
              <Skeleton className="h-4 w-28 bg-zinc-800" />
              <Skeleton className="h-8 w-16 bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : (
        <StatsCards
          totalStudyTimeSeconds={totalStudyTime}
          sessionsCompletedCount={sessionsCompleted}
          roomsJoinedCount={roomsJoinedCount}
          studyStreakDays={streakDays}
        />
      )}

      {/* Personal study Recharts Chart */}
      {!loading && rooms.length > 0 && chartData.length > 0 && (
        <StudyChart data={chartData} />
      )}

      {/* BOTTOM SECTION: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left wider column: Room cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-zinc-850 pb-2.5">
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-violet-400" />
              Active Study Rooms
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                  <Skeleton className="h-5 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-12 w-full bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-550">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Start your first study session!</h3>
              <p className="text-zinc-500 text-xs max-w-xs mb-5">
                Join a room using an invite code or create a new room to collaborate.
              </p>
              <Button
                onClick={() => setJoinOpen(true)}
                className="bg-violet-650 hover:bg-violet-750 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                Join with Code
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  userId={userId}
                  onRefresh={fetchAllDashboardData}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right narrower column: Leaderboards + Activities */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full bg-zinc-900/60" />
              <Skeleton className="h-44 w-full bg-zinc-900/60" />
            </div>
          ) : (
            <>
              <ActivityFeed activities={recentActivities} roomSummaries={roomSummaries} />
              <Leaderboard leaderboards={leaderboards} currentUserId={userId} />
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        userId={userId}
        onSuccess={() => {
          fetchAllDashboardData()
          toast.success('Room created!', { description: 'Invite others with the invite code on the card.' })
        }}
      />
      <JoinRoomDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        userId={userId}
        onSuccess={() => {
          fetchAllDashboardData()
          toast.success('Joined successfully!', { description: 'The room is now in your dashboard.' })
        }}
      />
    </DashboardShell>
  )
}
