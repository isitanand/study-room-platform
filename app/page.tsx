import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Users, Timer, MessageSquare, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-indigo-600/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[500px] bg-purple-700/5 rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30">
            <BookOpen className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">StudyRoom</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30 transition-all">
              Get started
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-24 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 border border-violet-500/20 px-4 py-1.5 text-sm text-violet-400 mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Collaborative studying, reimagined
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
          Study smarter,{' '}
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            together
          </span>
        </h1>

        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl mb-10">
          Create virtual study rooms, invite your peers, run timed Pomodoro sessions, and
          collaborate in real-time — all in one focused space.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth/signup">
            <Button
              id="hero-cta"
              size="lg"
              className="bg-violet-600 hover:bg-violet-500 text-white h-13 px-8 text-base font-medium shadow-xl shadow-violet-900/30 transition-all duration-200 hover:scale-[1.02]"
            >
              Start studying free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-13 px-8 text-base transition-all"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Users,
              title: 'Study Rooms',
              desc: 'Create or join rooms with an invite code and study with your group.',
            },
            {
              icon: Timer,
              title: 'Timed Sessions',
              desc: 'Start focused Pomodoro-style sessions tracked for the whole room.',
            },
            {
              icon: MessageSquare,
              title: 'Real-time Chat',
              desc: 'Communicate with roommates via instant messaging powered by Supabase Realtime.',
            },
            {
              icon: BookOpen,
              title: 'Activity Log',
              desc: 'Review session history and track collective study progress over time.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-600/20 transition-colors">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
