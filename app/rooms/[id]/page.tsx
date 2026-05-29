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

  const now = new Date().toISOString()

  // Fetch all room data in parallel to reduce database roundtrip latency
  const [
    membershipRes,
    roomRes,
    membersRes,
    messagesRes,
    sessionRes,
    activityRes
  ] = await Promise.all([
    supabase
      .from('room_members')
      .select('role')
      .eq('room_id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('rooms')
      .select('id, name, subject, description, invite_code, created_by, is_active, created_at')
      .eq('id', id)
      .single(),
    supabase
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
      .order('joined_at', { ascending: true }),
    supabase
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
      .limit(50),
    supabase
      .from('study_sessions')
      .select('*')
      .eq('room_id', id)
      .eq('is_active', true)
      .gt('ended_at', now)
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
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
  ])

  const membership = membershipRes.data
  if (!membership) {
    redirect('/dashboard')
  }

  const room = roomRes.data
  if (!room || !room.is_active) {
    notFound()
  }

  const members = (membersRes.data || []).map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    profile: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }))

  const initialMessages = (messagesRes.data || []).map((m: any) => ({
    id: m.id,
    roomId: m.room_id,
    userId: m.user_id,
    content: m.content,
    createdAt: m.created_at,
    profile: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }))

  const activeSessionRaw = sessionRes.data
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

  const initialActivities = (activityRes.data || []).map((a: any) => ({
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
