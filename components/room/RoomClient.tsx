'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RoomSidebar } from './RoomSidebar'
import { RoomChat } from './RoomChat'
import { StudyTimer } from './StudyTimer'
import { ActivityLog } from './ActivityLog'
import { RoomHistory } from './RoomHistory'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Menu, MessageSquare, History } from 'lucide-react'
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
  const supabase = createClient()

  // Room states
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat')
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [activeSession, setActiveSession] = useState<any>(initialActiveSession)
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([currentUser.id])

  // Helper to fetch user profile if it's missing in our member list
  const getOrFetchProfile = useCallback(
    async (userId: string): Promise<Profile | undefined> => {
      const existing = members.find((m) => m.userId === userId)
      if (existing?.profile) return existing.profile

      const { data } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (data) return data
      return undefined
    },
    [members, supabase]
  )

  // Realtime Subscriptions
  useEffect(() => {
    // 1. Setup Presence tracking
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

    // 2. Setup Message Database subscription
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
            // Avoid duplicates
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
      .subscribe()

    // 3. Setup Study Session Database subscription
    const sessionChannel = supabase
      .channel(`room_sessions:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE
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
              duration_minutes: Math.round(session.duration_seconds / 60),
              ends_at: session.ended_at,
              status: 'active',
              created_at: session.started_at
            })
          }
        }
      )
      .subscribe()

    // 4. Setup Activity Log subscription
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
            ].slice(0, 20) // Cap to last 20
          })

          // If a new member joined, trigger reload of member list
          if (newAct.action === 'join' || newAct.action === 'member_joined') {
            // Fetch updated members list
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

  // Database action: Send message
  const handleSendMessage = async (content: string) => {
    const { error } = await supabase.from('messages').insert({
      room_id: room.id,
      user_id: currentUser.id,
      content: content.trim(),
    })

    if (error) throw error
  }

  // Database action: Start study session
  const handleStartSession = async (durationMinutes: number) => {
    const now = new Date()
    const endedAt = new Date(now.getTime() + durationMinutes * 60000)

    // First insert study session
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

    // Find current user's username
    const myMember = members.find((m) => m.userId === currentUser.id)
    const myUsername = myMember?.profile?.username || currentUser.email?.split('@')[0] || 'User'

    // Insert activity log
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

  // Database action: End study session (completed or cancelled)
  const handleEndSession = async (sessionId: string, status: 'completed' | 'cancelled') => {
    const now = new Date()
    
    // Retrieve the session to compute elapsed seconds
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

    // Find current user's username
    const myMember = members.find((m) => m.userId === currentUser.id)
    const myUsername = myMember?.profile?.username || currentUser.email?.split('@')[0] || 'User'

    // Insert activity log
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
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">{room.name}</span>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex items-center bg-zinc-900/60 border border-zinc-800 rounded-xl p-0.5 max-w-[200px]">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>

        {/* Mobile menu trigger for sidebar */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 border-zinc-800 bg-zinc-950 w-80 text-white">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Room Info, Members List (Visible on Large Screens) */}
        <div className="hidden lg:block h-full">
          <RoomSidebar
            room={room}
            members={members}
            onlineUserIds={onlineUserIds}
            currentUserId={currentUser.id}
            currentRole={currentRole}
          />
        </div>

        {/* Middle: Timer & Chat or History */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <StudyTimer
            roomId={room.id}
            currentUserId={currentUser.id}
            activeSession={activeSession}
            members={members}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
          />
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

        {/* Right Side: Activity Log Feed */}
        <div className="hidden lg:block h-full">
          <ActivityLog activities={activities} />
        </div>
      </div>
    </div>
  )
}
