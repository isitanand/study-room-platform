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
  // Map actions to descriptive message strings
  const getActionDetails = (item: ActivityItem) => {
    const name = item.profiles?.full_name || item.profiles?.username || 'Someone'
    const metadata = item.metadata || {}

    switch (item.action) {
      case 'room_created':
        return {
          icon: <Home className="w-3.5 h-3.5 text-blue-400" />,
          bgColor: 'bg-blue-500/10 border-blue-500/15',
          text: (
            <span>
              🏠 <span className="font-semibold text-zinc-200">@{name}</span> created the room
            </span>
          ),
        }
      case 'member_joined':
        return {
          icon: <UserPlus className="w-3.5 h-3.5 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/15',
          text: (
            <span>
              👋 <span className="font-semibold text-zinc-200">@{name}</span> joined the room
            </span>
          ),
        }
      case 'member_left':
        return {
          icon: <UserMinus className="w-3.5 h-3.5 text-zinc-400" />,
          bgColor: 'bg-zinc-800/60 border-zinc-700/60',
          text: (
            <span>
              🚪 <span className="font-semibold text-zinc-300">@{name}</span> left the room
            </span>
          ),
        }
      case 'session_started':
        const mins = metadata?.duration_minutes ?? '25'
        return {
          icon: <Play className="w-3.5 h-3.5 text-violet-400" />,
          bgColor: 'bg-violet-500/10 border-violet-500/15',
          text: (
            <span>
              ▶️ <span className="font-semibold text-zinc-200">@{name}</span> started a session ({mins} mins)
            </span>
          ),
        }
      case 'session_ended':
        const elapsedSecs = metadata?.actual_duration_seconds ?? 0
        const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60))
        return {
          icon: <Square className="w-3.5 h-3.5 text-amber-500" />,
          bgColor: 'bg-amber-500/10 border-amber-500/15',
          text: (
            <span>
              ⏹️ Session ended ({elapsedMins} mins completed)
            </span>
          ),
        }
      case 'session_completed':
        const compSecs = metadata?.actual_duration_seconds ?? (metadata?.duration_minutes ? metadata.duration_minutes * 60 : 1500)
        const compMins = Math.round(compSecs / 60)
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/15',
          text: (
            <span>
              ✅ Session completed! ({compMins} mins)
            </span>
          ),
        }
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-zinc-500" />,
          bgColor: 'bg-zinc-900 border-zinc-800',
          text: (
            <span>
              ⚡ <span className="font-semibold text-zinc-200">@{name}</span> performed action: {item.action}
            </span>
          ),
        }
    }
  }

  // Format relative timestamp
  const getRelativeTime = (isoString: string) => {
    try {
      const then = new Date(isoString).getTime()
      const now = new Date().getTime()
      const diffMs = now - then

      if (diffMs < 5000) return 'just now'
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
    <div className="space-y-6">
      {/* Activity Log Feed */}
      <Card className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-violet-400" />
            Recent Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {activities.length === 0 ? (
            <p className="text-xs text-zinc-550 text-center py-4">No recent activity across rooms.</p>
          ) : (
            <div className="relative border-l border-zinc-800/80 ml-2.5 pl-5 space-y-5 py-1">
              {activities.map((item) => {
                const config = getActionDetails(item)

                return (
                  <div key={item.id} className="relative">
                    {/* Timeline icon */}
                    <div className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${config.bgColor} shadow-sm shrink-0`}>
                      {config.icon}
                    </div>

                    <div className="text-xs text-zinc-450 leading-tight">
                      {config.text}
                      {item.room_name && (
                        <span className="text-[10px] text-violet-400/90 font-medium block mt-0.5">
                          in {item.room_name}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-[9px] text-zinc-600 mt-1 font-mono" suppressHydrationWarning>
                        <Clock className="w-2.5 h-2.5" />
                        {getRelativeTime(item.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room study summaries list */}
      <Card className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-450">
            My Rooms Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {roomSummaries.length === 0 ? (
            <p className="text-xs text-zinc-550 text-center py-4">No rooms joined yet.</p>
          ) : (
            <div className="divide-y divide-zinc-850">
              {roomSummaries.map((room) => (
                <div key={room.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-200 block truncate leading-tight">
                      {room.name}
                    </span>
                    {room.subject && (
                      <span className="text-[10px] text-zinc-500 font-medium">{room.subject}</span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-zinc-300 font-bold block leading-none">
                      {formatStudyTimeText(room.totalStudyTimeSeconds)}
                    </span>
                    <span className="text-[9px] text-zinc-550 font-medium">
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
