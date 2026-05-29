'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  Home,
  UserPlus,
  UserMinus,
  Activity,
  BookOpen,
  Timer,
} from 'lucide-react'

interface ActivityItem {
  id: string
  room_id: string
  user_id: string
  action: string
  metadata?: any
  created_at: string
  room_name?: string
  profiles?: {
    username: string
    full_name?: string | null
  }
}

interface RoomSummary {
  id: string
  name: string
  subject?: string | null
  totalSessions: number
  totalStudyTimeSeconds: number
  lastActive: string | null
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  roomSummaries: RoomSummary[]
}

export function ActivityFeed({ activities, roomSummaries }: ActivityFeedProps) {
  const getActionDetails = (item: ActivityItem) => {
    const name = item.profiles?.full_name || item.profiles?.username || 'Someone'
    const metadata = item.metadata || {}

    switch (item.action) {
      case 'room_created':
        return {
          icon: <Home className="w-3.5 h-3.5 text-[#0A7C6E]" />,
          iconBg: 'bg-[#e6f4f2]',
          text: (
            <span>
              <span className="font-semibold text-[#141414]">{name}</span>
              <span className="text-[#4e4d4c]"> created the room</span>
            </span>
          ),
        }
      case 'member_joined':
        return {
          icon: <UserPlus className="w-3.5 h-3.5 text-[#0A7C6E]" />,
          iconBg: 'bg-[#e6f4f2]',
          text: (
            <span>
              <span className="font-semibold text-[#141414]">{name}</span>
              <span className="text-[#4e4d4c]"> joined the room</span>
            </span>
          ),
        }
      case 'member_left':
        return {
          icon: <UserMinus className="w-3.5 h-3.5 text-[#a1a1a1]" />,
          iconBg: 'bg-[#f4eee5]',
          text: (
            <span>
              <span className="font-semibold text-[#4e4d4c]">{name}</span>
              <span className="text-[#737373]"> left the room</span>
            </span>
          ),
        }
      case 'session_started':
        const mins = metadata?.duration_minutes ?? '25'
        return {
          icon: <Play className="w-3.5 h-3.5 text-[#0A7C6E]" />,
          iconBg: 'bg-[#e6f4f2]',
          text: (
            <span>
              <span className="font-semibold text-[#141414]">{name}</span>
              <span className="text-[#4e4d4c]"> started a {mins} min session</span>
            </span>
          ),
        }
      case 'session_ended':
        const elapsedSecs = metadata?.actual_duration_seconds ?? 0
        const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60))
        return {
          icon: <Square className="w-3.5 h-3.5 text-[#737373]" />,
          iconBg: 'bg-[#f4eee5]',
          text: (
            <span className="text-[#4e4d4c]">Session ended — {elapsedMins} min completed</span>
          ),
        }
      case 'session_completed':
        const compSecs = metadata?.actual_duration_seconds ?? (metadata?.duration_minutes ? metadata.duration_minutes * 60 : 1500)
        const compMins = Math.round(compSecs / 60)
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#0A7C6E]" />,
          iconBg: 'bg-[#e6f4f2]',
          text: (
            <span>
              <span className="font-semibold text-[#0A7C6E]">Session completed!</span>
              <span className="text-[#4e4d4c]"> {compMins} min</span>
            </span>
          ),
        }
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-[#0A7C6E]" />,
          iconBg: 'bg-[#e6f4f2]',
          text: (
            <span>
              <span className="font-semibold text-[#141414]">{name}</span>
              <span className="text-[#4e4d4c]"> {item.action.replace(/_/g, ' ')}</span>
            </span>
          ),
        }
    }
  }

  const getRelativeTime = (isoString: string) => {
    try {
      const then = new Date(isoString).getTime()
      const now = new Date().getTime()
      const diffMs = now - then

      if (diffMs < 5000) return 'Just now'
      const diffSecs = Math.round(diffMs / 1000)
      if (diffSecs < 60) return `${diffSecs}s ago`
      const diffMins = Math.round(diffSecs / 60)
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.round(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.round(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return ''
    }
  }

  const formatStudyTimeText = (secs: number) => {
    const hrs = Math.floor(secs / 3600)
    const mins = Math.floor((secs % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  return (
    <div className="space-y-4">
      {/* Recent Activity Feed */}
      <Card className="border border-[#e7e7e7] bg-white shadow-none rounded-[10px]">
        <CardHeader className="p-5 pb-3 flex flex-row items-center gap-2">
          <div className="w-7 h-7 rounded-[5px] bg-[#e6f4f2] flex items-center justify-center shrink-0">
            <Activity className="w-3.5 h-3.5 text-[#0A7C6E]" />
          </div>
          <CardTitle className="text-[13px] font-semibold text-[#141414]">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {activities.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-[#737373]">No recent activity across rooms.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((item) => {
                const config = getActionDetails(item)

                return (
                  <div key={item.id} className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-7 h-7 rounded-[5px] flex items-center justify-center shrink-0 mt-0.5 ${config.iconBg}`}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug">
                        {config.text}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.room_name && (
                          <span className="text-[11px] text-[#0A7C6E] font-medium truncate">
                            #{item.room_name}
                          </span>
                        )}
                        {item.room_name && (
                          <span className="text-[#e7e7e7]">·</span>
                        )}
                        <span className="text-[11px] text-[#a1a1a1] flex items-center gap-1" suppressHydrationWarning>
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Room Summaries */}
      <Card className="border border-[#e7e7e7] bg-white shadow-none rounded-[10px]">
        <CardHeader className="p-5 pb-3 flex flex-row items-center gap-2">
          <div className="w-7 h-7 rounded-[5px] bg-[#e6f4f2] flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-[#0A7C6E]" />
          </div>
          <CardTitle className="text-[13px] font-semibold text-[#141414]">
            My Room Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {roomSummaries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-[#737373]">No rooms joined yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {roomSummaries.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 rounded-[5px] bg-[#f9f6f2] border border-[#e7e7e7] hover:border-[#0A7C6E] transition-colors duration-200"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-[#141414] block truncate leading-snug">
                      {room.name}
                    </span>
                    {room.subject && (
                      <span className="text-[11px] text-[#737373] mt-0.5 block truncate">{room.subject}</span>
                    )}
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Timer className="w-3 h-3 text-[#0A7C6E]" />
                      <span className="text-[13px] font-semibold text-[#141414]">
                        {formatStudyTimeText(room.totalStudyTimeSeconds)}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#737373] mt-0.5 block">
                      {room.totalSessions} session{room.totalSessions !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
