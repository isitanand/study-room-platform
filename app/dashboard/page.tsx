import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — StudyRoom',
  description: 'Manage your study rooms, create new ones, or join a room with an invite code.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#f9f6f2] text-[#262626] relative overflow-hidden">
      {/* Soft Blurred Background Shapes */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-[#0A7C6E]/4 rounded-full filter blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-[#000015]/4 rounded-full filter blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNavbar profile={profile} email={user.email} />
        <DashboardClient userId={user.id} />
      </div>
    </div>
  )
}
