'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle2, Users, Flame } from 'lucide-react'

interface StatsCardsProps {
  totalStudyTimeSeconds: number
  sessionsCompletedCount: number
  roomsJoinedCount: number
  studyStreakDays: number
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
      icon: <Clock className="w-4 h-4 text-[#0A7C6E]" />,
      iconBg: 'bg-[#e6f4f2]',
    },
    {
      title: 'Sessions Completed',
      value: sessionsCompletedCount,
      comparison: `+${diffSessionsCount} from last week`,
      icon: <CheckCircle2 className="w-4 h-4 text-[#0A7C6E]" />,
      iconBg: 'bg-[#e6f4f2]',
    },
    {
      title: 'Rooms Joined',
      value: roomsJoinedCount,
      comparison: diffRoomsCount >= 0 ? `+${diffRoomsCount} this week` : `${diffRoomsCount} this week`,
      icon: <Users className="w-4 h-4 text-[#0A7C6E]" />,
      iconBg: 'bg-[#e6f4f2]',
    },
    {
      title: 'Study Streak',
      value: `${studyStreakDays} Day${studyStreakDays !== 1 ? 's' : ''}`,
      comparison: `+${diffStreak} day increase`,
      icon: <Flame className="w-4 h-4 text-amber-500" />,
      iconBg: 'bg-[#fffbeb]',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, idx) => (
        <Card
          key={idx}
          className="bg-white border border-[#e7e7e7] rounded-[10px] relative overflow-hidden transition-all duration-300 hover:border-[#0A7C6E] shadow-none"
        >
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#737373] font-medium">
                {item.title}
              </span>
              <div className={`w-8 h-8 rounded-[5px] flex items-center justify-center shrink-0 ${item.iconBg}`}>
                {item.icon}
              </div>
            </div>

            <div>
              <h4 className="text-[28px] text-[#141414] font-semibold tracking-tight leading-none">
                {item.value}
              </h4>
              <p className="text-[12px] text-[#737373] mt-2 font-normal">
                {item.comparison}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
