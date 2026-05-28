'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Medal, Crown } from 'lucide-react'

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

  // Get rank icons for top 3
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-4 h-4 text-amber-400 fill-amber-400/10" />
      case 1:
        return <Medal className="w-4 h-4 text-slate-350" />
      case 2:
        return <Medal className="w-4 h-4 text-amber-600" />
      default:
        return null
    }
  }

  return (
    <Card className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
      <CardHeader className="p-5 pb-2 flex flex-row items-center gap-2">
        <Trophy className="w-4.5 h-4.5 text-violet-400" />
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-450">
          Leaderboards (Top Members)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-6">
        {leaderboards.length === 0 ? (
          <p className="text-xs text-zinc-550 text-center py-4">Join a study room to view leaderboards.</p>
        ) : (
          leaderboards.map((board) => (
            <div key={board.roomId} className="space-y-2.5">
              {/* Room name header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-xs font-bold text-zinc-300 leading-tight">
                  {board.roomName}
                </span>
                <span className="text-[9px] uppercase font-black text-violet-400 tracking-wider">
                  Leaderboard
                </span>
              </div>

              {/* Members ranked list */}
              {board.members.length === 0 ? (
                <p className="text-[10px] text-zinc-650 italic">No study logs yet for this room.</p>
              ) : (
                <div className="space-y-2">
                  {board.members.slice(0, 3).map((member, index) => {
                    const isSelf = member.userId === currentUserId
                    const displayName = member.fullName || member.username || 'Student'
                    const rank = index + 1

                    return (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                          isSelf
                            ? 'bg-violet-600/10 border-violet-500/30 shadow-sm'
                            : 'bg-zinc-950/20 border-zinc-900/60 hover:bg-zinc-950/45 hover:border-zinc-850'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank indicator */}
                          <div className="w-5 flex items-center justify-center shrink-0">
                            {getRankIcon(index) || (
                              <span className="text-[10px] font-bold text-zinc-600 font-mono">
                                #{rank}
                              </span>
                            )}
                          </div>

                          {/* Avatar */}
                          <Avatar className="w-6 h-6 border border-zinc-800 shrink-0">
                            <AvatarImage src={member.avatarUrl || undefined} />
                            <AvatarFallback className="bg-zinc-900 text-zinc-500 text-[9px] font-bold">
                              {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* Name details */}
                          <span
                            className={`font-semibold truncate ${
                              isSelf ? 'text-violet-300' : 'text-zinc-200'
                            }`}
                          >
                            @{member.username} {isSelf && '(You)'}
                          </span>
                        </div>

                        {/* Accumulated study time */}
                        <div className="text-right shrink-0">
                          <span className="font-mono text-zinc-300 font-extrabold">
                            {formatTime(member.totalTimeSeconds)}
                          </span>
                        </div>
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
