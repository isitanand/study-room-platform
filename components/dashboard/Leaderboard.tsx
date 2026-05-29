'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Medal } from 'lucide-react'

interface LeaderboardMember {
  userId: string
  username: string
  fullName?: string | null
  avatarUrl?: string | null
  totalTimeSeconds: number
}

interface RoomLeaderboard {
  roomId: string
  roomName: string
  members: LeaderboardMember[]
}

interface LeaderboardProps {
  leaderboards: RoomLeaderboard[]
  currentUserId: string
}

export function Leaderboard({ leaderboards, currentUserId }: LeaderboardProps) {
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600)
    const mins = Math.floor((secs % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  const rankColors: Record<number, string> = {
    1: 'text-amber-500',
    2: 'text-[#a1a1a1]',
    3: 'text-amber-700',
  }

  const rankSymbols: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  }

  return (
    <Card className="border border-[#e7e7e7] bg-white shadow-none rounded-[10px]">
      <CardHeader className="p-5 pb-3 flex flex-row items-center gap-2">
        <div className="w-7 h-7 rounded-[5px] bg-[#fffbeb] flex items-center justify-center shrink-0">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <CardTitle className="text-[13px] font-semibold text-[#141414]">
          Top Members
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-5">
        {leaderboards.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-[#737373]">Join a study room to view leaderboards.</p>
          </div>
        ) : (
          leaderboards.map((board) => (
            <div key={board.roomId} className="space-y-2">
              {/* Room name label */}
              <div className="flex items-center justify-between border-b border-[#e7e7e7] pb-2">
                <span className="text-[12px] font-semibold text-[#141414] truncate max-w-[70%]">
                  {board.roomName}
                </span>
                <span className="text-[11px] text-[#a1a1a1]">
                  Rankings
                </span>
              </div>

              {/* Members ranked list */}
              {board.members.length === 0 ? (
                <p className="text-[13px] text-[#737373] py-2">No study logs yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {board.members.slice(0, 3).map((member, index) => {
                    const isSelf = member.userId === currentUserId
                    const displayName = member.fullName || member.username || 'Student'
                    const rank = index + 1

                    return (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-[5px] border transition-all duration-200 ${
                          isSelf
                            ? 'bg-[#e6f4f2] border-[#0A7C6E]'
                            : 'bg-[#f9f6f2] border-[#e7e7e7] hover:border-[#0A7C6E]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank */}
                          <span className="text-[14px] shrink-0 leading-none">
                            {rankSymbols[rank] || `#${rank}`}
                          </span>

                          {/* Avatar */}
                          <Avatar className="w-6 h-6 border border-[#e7e7e7] shrink-0 rounded-[5px]">
                            <AvatarImage src={member.avatarUrl || undefined} className="rounded-[5px] object-cover" />
                            <AvatarFallback className="bg-[#f4eee5] text-[#141414] text-[9px] font-semibold rounded-[5px]">
                              {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* Name */}
                          <span className={`text-[13px] truncate ${isSelf ? 'font-semibold text-[#0A7C6E]' : 'font-medium text-[#262626]'}`}>
                            {displayName}
                            {isSelf && <span className="text-[11px] font-normal ml-1 text-[#0A7C6E] opacity-70">(you)</span>}
                          </span>
                        </div>

                        {/* Study time */}
                        <span className={`text-[13px] font-semibold shrink-0 ${isSelf ? 'text-[#0A7C6E]' : 'text-[#141414]'}`}>
                          {formatTime(member.totalTimeSeconds)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
