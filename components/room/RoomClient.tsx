'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RoomSidebar } from './RoomSidebar'
import { RoomChat } from './RoomChat'
import { StudyTimer } from './StudyTimer'
import { ActivityLog } from './ActivityLog'
import { RoomHistory } from './RoomHistory'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Menu, MessageSquare, History } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface Profile {
  username: string
  full_name?: string | null
  avatar_url?: string | null
}

interface Member {
  id: string
  userId: string
  role: string
  joinedAt: string
  profile?: Profile
}

interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: string
  profile?: Profile
}

interface ActivityItem {
  id: string
  roomId: string
  userId: string
  actionType: string
  details?: any
  createdAt: string
  profile?: Profile
}

interface RoomClientProps {
  room: {
    id: string
    name: string
    subject?: string | null
    description?: string | null
    invite_code?: string | null
    created_by: string
  }
  currentUser: any
  currentRole: string
  initialMembers: Member[]
  initialMessages: Message[]
  initialActiveSession: any
  initialActivities: ActivityItem[]
}

export function RoomClient({
  room,
  currentUser,
  currentRole,
  initialMembers,
  initialMessages,
  initialActiveSession,
  initialActivities,
}: RoomClientProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat')
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [activeSession, setActiveSession] = useState<any>(initialActiveSession)
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([currentUser.id])

  
  const [timerHeight, setTimerHeight] = useState(250) 
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const middleContainer = document.getElementById('middle-container')
      if (!middleContainer) return

      const rect = middleContainer.getBoundingClientRect()
      const newHeight = e.clientY - rect.top

      const minHeight = 55 
      const maxHeight = Math.min(500, rect.height - 150) 

      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setTimerHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const membersRef = useRef<Member[]>(members)
  useEffect(() => {
    membersRef.current = members
  }, [members])

  
  const getOrFetchProfile = useCallback(
    async (userId: string): Promise<Profile | undefined> => {
      const existing = membersRef.current.find((m) => m.userId === userId)
      if (existing?.profile) return existing.profile

      const { data } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (data) return data
      return undefined
    },
    [supabase]
  )

  
  useEffect(() => {
    
    const presenceChannel = supabase.channel(`room_presence:${room.id}`, {
      config: { presence: { key: currentUser.id } },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const onlineIds = Object.keys(state)
        setOnlineUserIds(onlineIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: currentUser.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    
    const messageChannel = supabase
      .channel(`room_messages:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any
          const profile = await getOrFetchProfile(newMsg.user_id)
          
          setMessages((prev) => {
            
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [
              ...prev,
              {
                id: newMsg.id,
                roomId: newMsg.room_id,
                userId: newMsg.user_id,
                content: newMsg.content,
                createdAt: newMsg.created_at,
                profile,
              },
            ]
          })
        }
      )
      .subscribe((status, err) => {
        if (err) {
          import('sonner').then(({ toast }) => toast.error(`Messages Realtime error: ${err.message}`))
        } else if (status === 'CHANNEL_ERROR') {
          import('sonner').then(({ toast }) => toast.error('Messages Realtime subscription failed (Channel Error)'))
        }
      })

    
    const sessionChannel = supabase
      .channel(`room_sessions:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'study_sessions',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const session = payload.new as any
          if (!session || !session.is_active) {
            setActiveSession(null)
          } else {
            setActiveSession({
              id: session.id,
              room_id: session.room_id,
              started_by: session.started_by,
              started_at: session.started_at,
              duration_seconds: Math.round(session.duration_seconds / 60),
              ends_at: session.ended_at,
              status: 'active',
              created_at: session.started_at
            })
          }
        }
      )
      .subscribe()

    
    const activityChannel = supabase
      .channel(`room_activities:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const newAct = payload.new as any
          const profile = await getOrFetchProfile(newAct.user_id)

          setActivities((prev) => {
            if (prev.some((a) => a.id === newAct.id)) return prev
            return [
              {
                id: newAct.id,
                roomId: newAct.room_id,
                userId: newAct.user_id,
                actionType: newAct.action,
                details: newAct.metadata,
                createdAt: newAct.created_at,
                profile,
              },
              ...prev,
            ].slice(0, 20) 
          })

          
          if (newAct.action === 'join' || newAct.action === 'member_joined') {
            
            const { data: membersRaw } = await supabase
              .from('room_members')
              .select(`
                id,
                user_id,
                role,
                joined_at,
                profiles:user_id (
                  username,
                  full_name,
                  avatar_url
                )
              `)
              .eq('room_id', room.id)
              .order('joined_at', { ascending: true })

            if (membersRaw) {
              const updatedMembers = (membersRaw || []).map((m: any) => ({
                id: m.id,
                userId: m.user_id,
                role: m.role,
                joinedAt: m.joined_at,
                profile: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
              }))
              setMembers(updatedMembers)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(sessionChannel)
      supabase.removeChannel(activityChannel)
    }
  }, [room.id, currentUser.id, getOrFetchProfile, supabase])

  
  const handleSendMessage = async (content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: room.id,
        user_id: currentUser.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) throw error

    if (data) {
      const myMember = members.find((m) => m.userId === currentUser.id)
      const profile = myMember?.profile || {
        username: currentUser.email?.split('@')[0] || 'User',
        full_name: myMember?.profile?.full_name,
        avatar_url: myMember?.profile?.avatar_url,
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [
          ...prev,
          {
            id: data.id,
            roomId: data.room_id,
            userId: data.user_id,
            content: data.content,
            createdAt: data.created_at,
            profile,
          },
        ]
      })
    }
  }

  
  const handleStartSession = async (durationMinutes: number) => {
    const now = new Date()
    const endedAt = new Date(now.getTime() + durationMinutes * 60000)

    
    const { data: newSession, error: sessionErr } = await supabase
      .from('study_sessions')
      .insert({
        room_id: room.id,
        started_by: currentUser.id,
        duration_seconds: durationMinutes * 60,
        ended_at: endedAt.toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (sessionErr) throw sessionErr

    
    const myMember = members.find((m) => m.userId === currentUser.id)
    const myUsername = myMember?.profile?.username || currentUser.email?.split('@')[0] || 'User'

    
    await supabase.from('activity_log').insert({
      room_id: room.id,
      user_id: currentUser.id,
      action: 'session_started',
      metadata: {
        duration_minutes: durationMinutes,
        session_id: newSession.id,
        started_by_username: myUsername,
      },
    })
  }

  
  const handleEndSession = async (sessionId: string, status: 'completed' | 'cancelled') => {
    const now = new Date()
    
    
    const { data: session } = await supabase
      .from('study_sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single()

    const startedTime = session ? new Date(session.started_at).getTime() : now.getTime()
    const elapsedSeconds = Math.max(0, Math.round((now.getTime() - startedTime) / 1000))

    const { error: updateErr } = await supabase
      .from('study_sessions')
      .update({ 
        is_active: false,
        ended_at: now.toISOString(),
        duration_seconds: elapsedSeconds
      })
      .eq('id', sessionId)

    if (updateErr) throw updateErr

    
    const myMember = members.find((m) => m.userId === currentUser.id)
    const myUsername = myMember?.profile?.username || currentUser.email?.split('@')[0] || 'User'

    
    await supabase.from('activity_log').insert({
      room_id: room.id,
      user_id: currentUser.id,
      action: status === 'completed' ? 'session_completed' : 'session_ended',
      metadata: {
        session_id: sessionId,
        actual_duration_seconds: elapsedSeconds,
        ended_by_username: myUsername,
        duration_minutes: session ? Math.round(elapsedSeconds / 60) : 0
      },
    })
  }

  return (
    <div className="h-screen flex flex-col bg-[#f9f6f2] text-[#141414] overflow-hidden font-sans">
      {}
      <header className="h-16 border-b border-[#e7e7e7] bg-[#f9f6f2] px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-[#f4eee5] text-[#4e4d4c] hover:text-[#141414] rounded-[5px] border border-[#e7e7e7] bg-white flex items-center justify-center shadow-none cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {}
            <svg
              className="w-5 h-5 text-[#262626] stroke-[1.5]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="font-sans text-[15px] text-[#141414] tracking-tight font-semibold">{room.name}</span>
          </div>
        </div>

        {}
        <div className="flex border border-[#e7e7e7] bg-white rounded-[5px] p-0.5 shadow-none gap-0.5">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-sans transition-all duration-200 cursor-pointer rounded-[4px] ${
              activeTab === 'chat'
                ? 'bg-[#141414] text-white font-medium shadow-none'
                : 'text-[#4e4d4c] hover:text-[#141414] hover:bg-[#f4eee5]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-sans transition-all duration-200 cursor-pointer rounded-[4px] ${
              activeTab === 'history'
                ? 'bg-[#141414] text-white font-medium shadow-none'
                : 'text-[#4e4d4c] hover:text-[#141414] hover:bg-[#f4eee5]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>

        {}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8.5 w-8.5 text-[#141414] hover:bg-[#f4eee5] rounded-[5px] border border-[#e7e7e7] bg-white cursor-pointer shadow-none">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 border-l border-[#e7e7e7] bg-[#f9f6f2] w-80 text-[#141414] shadow-none rounded-none">
              <RoomSidebar
                room={room}
                members={members}
                onlineUserIds={onlineUserIds}
                currentUserId={currentUser.id}
                currentRole={currentRole}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {}
        <div className="hidden lg:block h-full">
          <RoomSidebar
            room={room}
            members={members}
            onlineUserIds={onlineUserIds}
            currentUserId={currentUser.id}
            currentRole={currentRole}
          />
        </div>

        {}
        <div id="middle-container" className="flex-1 flex flex-col h-full overflow-hidden">
          <div 
            style={activeTab === 'history' ? { height: `${timerHeight}px` } : undefined} 
            className={`overflow-y-auto shrink-0 ${activeTab === 'history' ? '' : 'h-auto max-h-[250px]'} ${isDragging ? 'select-none pointer-events-none' : ''}`}
          >
            <StudyTimer
              roomId={room.id}
              currentUserId={currentUser.id}
              activeSession={activeSession}
              members={members}
              onStartSession={handleStartSession}
              onEndSession={handleEndSession}
            />
          </div>

          {}
          {activeTab === 'history' && (
            <div
              onMouseDown={handleMouseDown}
              className={`h-2 bg-[#f9f6f2] border-t border-b border-[#e7e7e7] hover:bg-[#e7e7e7] active:bg-[#0A7C6E]/20 cursor-row-resize transition-colors flex items-center justify-center select-none shrink-0 group ${
                isDragging ? 'bg-[#0A7C6E]/10 border-t-[#0A7C6E]/30 border-b-[#0A7C6E]/30' : ''
              }`}
              title="Drag to resize panels"
            >
              <div className={`w-10 h-0.5 rounded-full bg-[#c0c0c0] group-hover:bg-[#737373] transition-colors ${
                isDragging ? 'bg-[#0A7C6E]' : ''
              }`} />
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {activeTab === 'chat' ? (
              <RoomChat
                roomId={room.id}
                currentUserId={currentUser.id}
                messages={messages}
                initialMessages={initialMessages}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <RoomHistory roomId={room.id} members={members} />
            )}
          </div>
        </div>

        {}
        <div className="hidden lg:block h-full">
          <ActivityLog activities={activities} />
        </div>
      </div>
    </div>
  )
}

