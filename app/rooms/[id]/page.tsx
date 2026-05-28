import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoomClient } from '@/components/room/RoomClient'
import type { Metadata } from 'next'

interface RoomPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('name, subject')
    .eq('id', id)
    .single()

  return {
    title: room ? `${room.name} — StudyRoom` : 'Study Room',
    description: room?.subject ? `Study room for ${room.subject}` : 'A collaborative study room.',
  }
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Verify user is a member of this room
  const { data: membership } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // 2. Fetch room details
  const { data: room } = await supabase
    .from('rooms')
    .select('id, name, subject, description, invite_code, created_by, is_active, created_at')
    .eq('id', id)
    .single()

  if (!room || !room.is_active) {
    notFound()
  }

  // 3. Fetch initial members with profiles
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
    .eq('room_id', id)
    .order('joined_at', { ascending: true })

  // Cast members profiles properly
  const members = (membersRaw || []).map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    profile: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }))

  // 4. Fetch initial messages (last 50)
  const { data: messagesRaw } = await supabase
    .from('messages')
    .select(`
      id,
      room_id,
      user_id,
      content,
      created_at,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('room_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  const initialMessages = (messagesRaw || []).map((m: any) => ({
    id: m.id,
    roomId: m.room_id,
    userId: m.user_id,
    content: m.content,
    createdAt: m.created_at,
    profile: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }))

  // 5. Fetch current active session (ended_at > now)
  const now = new Date().toISOString()
  const { data: activeSessionRaw } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('room_id', id)
    .eq('is_active', true)
    .gt('ended_at', now)
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const activeSession = activeSessionRaw ? {
    id: activeSessionRaw.id,
    room_id: activeSessionRaw.room_id,
    started_by: activeSessionRaw.started_by,
    started_at: activeSessionRaw.started_at,
    duration_minutes: Math.round(activeSessionRaw.duration_seconds / 60),
    ends_at: activeSessionRaw.ended_at,
    status: 'active' as const,
    created_at: activeSessionRaw.started_at
  } : null

  // 6. Fetch recent activity log (last 20)
  const { data: activityRaw } = await supabase
    .from('activity_log')
    .select(`
      id,
      room_id,
      user_id,
      action,
      metadata,
      created_at,
      profiles:user_id (
        username,
        full_name
      )
    `)
    .eq('room_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const initialActivities = (activityRaw || []).map((a: any) => ({
    id: a.id,
    roomId: a.room_id,
    userId: a.user_id,
    actionType: a.action,
    details: a.metadata,
    createdAt: a.created_at,
    profile: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
  }))

  return (
    <RoomClient
      room={room}
      currentUser={user}
      currentRole={membership.role}
      initialMembers={members}
      initialMessages={initialMessages}
      initialActiveSession={activeSession}
      initialActivities={initialActivities}
    />
  )
}
