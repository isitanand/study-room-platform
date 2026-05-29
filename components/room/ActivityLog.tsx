'use client'

import { 
  Home, UserPlus, UserMinus, Play, Square, CheckCircle2, Clock 
} from 'lucide-react'

interface ActivityItem {
  id: string
  roomId: string
  userId: string
  actionType: string
  details?: any
  createdAt: string
  profile?: {
    username: string
    full_name?: string | null
  }
}

interface ActivityLogProps {
  activities: ActivityItem[]
}

export function ActivityLog({ activities }: ActivityLogProps) {
  // Filter out message_sent events and limit to 20
  const filteredActivities = activities
    .filter(a => a.actionType !== 'message_sent')
    .slice(0, 20)

  // Map actions to descriptive message strings
  const getActionDetails = (item: ActivityItem) => {
    const actionType = item.actionType
    const metadata = item.details || {}
    const name = item.profile?.username || 'Someone'

    switch (actionType) {
      case 'room_created':
        return {
          icon: <Home className="w-3 h-3 text-[#262626]" />,
          bgColor: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#141414] font-semibold">@{name}</span> created this room
            </span>
          ),
        };
      case 'join':
      case 'member_joined':
        return {
          icon: <UserPlus className="w-3 h-3 text-[#262626]" />,
          bgColor: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#141414] font-semibold">@{name}</span> joined the room
            </span>
          ),
        };
      case 'leave':
      case 'member_left':
        return {
          icon: <UserMinus className="w-3 h-3 text-[#737373]" />,
          bgColor: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#737373]">@{name}</span> left the room
            </span>
          ),
        };
      case 'session_start':
      case 'session_started':
        const startMins = metadata?.duration_minutes ?? '25'
        const starter = metadata?.started_by_username || name
        return {
          icon: <Play className="w-3 h-3 text-[#262626]" />,
          bgColor: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#141414] font-semibold">@{starter}</span> started a session ({startMins} mins)
            </span>
          ),
        };
      case 'session_end':
      case 'session_ended':
        const elapsedSecs = metadata?.actual_duration_seconds ?? 0
        const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60))
        return {
          icon: <Square className="w-3 h-3 text-[#262626]" />,
          bgColor: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              Session ended ({elapsedMins} mins completed)
            </span>
          ),
        };
      case 'session_completed':
        const compSecs = metadata?.actual_duration_seconds ?? (metadata?.duration_minutes ? metadata.duration_minutes * 60 : 1500)
        const compMins = Math.round(compSecs / 60)
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-[#0A7C6E]" />,
          bgColor: 'bg-[#0A7C6E]/10 border-[#0A7C6E]/30',
          text: (
            <span className="text-[#141414] font-semibold">
              Session completed! ({compMins} mins)
            </span>
          ),
        };
      default:
        return {
          icon: <Clock className="w-3 h-3 text-[#262626]" />,
          bgColor: 'bg-white border-[#e7e7e7]',
          text: (
            <span>
              <span className="text-[#141414] font-semibold">@{name}</span> action: {actionType}
            </span>
          ),
        };
    }
  }

  // Format timestamp as relative time
  const getRelativeTimeString = (isoString: string) => {
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

  return (
    <div className="w-full lg:w-72 shrink-0 border-l border-[#e7e7e7] bg-[#f4eee5] flex flex-col h-full font-sans">
      <div className="p-5 border-b border-[#e7e7e7] flex items-center gap-1.5 shrink-0">
        <Clock className="w-4 h-4 text-[#262626]" />
        <h3 className="text-[13px] font-semibold text-[#141414]">Activity Log</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-[13px] text-[#737373]">No activity logged yet.</p>
          </div>
        ) : (
          <div className="relative border-l border-[#e7e7e7] ml-2.5 pl-5 space-y-5 py-1">
            {filteredActivities.map((item) => {
              const config = getActionDetails(item)

              return (
                <div key={item.id} className="relative">
                  {/* Timeline icon indicator */}
                  <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${config.bgColor} shrink-0`}>
                    {config.icon}
                  </div>

                  <div className="text-[13px] text-[#4e4d4c] leading-relaxed">
                    {config.text}
                    <div className="flex items-center gap-1 text-[10px] text-[#737373] mt-1" suppressHydrationWarning>
                      <Clock className="w-2.5 h-2.5 text-[#737373]" />
                      {getRelativeTimeString(item.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

