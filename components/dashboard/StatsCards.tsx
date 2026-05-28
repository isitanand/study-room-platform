'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle2, Users, Flame } from 'lucide-react'

interface StatsCardsProps {
  totalStudyTimeSeconds: number
  sessionsCompletedCount: number
  roomsJoinedCount: number
  studyStreakDays: number
  // comparison stats optionally
  diffTimeHours?: number
  diffSessionsCount?: number
  diffRoomsCount?: number
  diffStreak?: number
}

export function StatsCards({
  totalStudyTimeSeconds,
  sessionsCompletedCount,
  roomsJoinedCount,
  studyStreakDays,
  diffTimeHours = 2,
  diffSessionsCount = 1,
  diffRoomsCount = 0,
  diffStreak = 1,
}: StatsCardsProps) {
  // Format seconds to Xh Ym
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600)
    const mins = Math.floor((secs % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  const statItems = [
    {
      title: 'Total Study Time',
      value: formatTime(totalStudyTimeSeconds),
      comparison: `+${diffTimeHours}h from last week`,
      icon: <Clock className="w-5 h-5 text-violet-400" />,
      gradient: 'from-violet-600/10 to-indigo-600/5 border-violet-500/20',
    },
    {
      title: 'Sessions Completed',
      value: sessionsCompletedCount,
      comparison: `+${diffSessionsCount} from last week`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      gradient: 'from-emerald-600/10 to-teal-600/5 border-emerald-500/20',
    },
    {
      title: 'Rooms Joined',
      value: roomsJoinedCount,
      comparison: diffRoomsCount >= 0 ? `+${diffRoomsCount} this week` : `${diffRoomsCount} this week`,
      icon: <Users className="w-5 h-5 text-blue-400" />,
      gradient: 'from-blue-600/10 to-cyan-600/5 border-blue-500/20',
    },
    {
      title: 'Study Streak',
      value: `${studyStreakDays} day${studyStreakDays !== 1 ? 's' : ''}`,
      comparison: `+${diffStreak} day streak increase`,
      icon: <Flame className="w-5 h-5 text-amber-500 fill-amber-500/10" />,
      gradient: 'from-amber-600/10 to-orange-600/5 border-amber-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {statItems.map((item, idx) => (
        <Card
          key={idx}
          className={`relative overflow-hidden bg-gradient-to-br ${item.gradient} border bg-zinc-900/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
        >
          {/* Decorative subtle background light */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/3 rounded-full blur-2xl" />

          <CardContent className="p-5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-550 uppercase tracking-wider">
                {item.title}
              </span>
              <div className="w-9 h-9 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-center justify-center shadow-inner">
                {item.icon}
              </div>
            </div>

            <div>
              <h4 className="text-2xl font-black text-white tracking-tight leading-none">
                {item.value}
              </h4>
              <p className="text-[10px] font-semibold text-zinc-500 mt-1.5 flex items-center gap-1">
                {item.comparison}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
