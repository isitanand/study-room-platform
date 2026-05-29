import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Timer, MessageSquare, Clock, ArrowRight } from 'lucide-react'

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
    <main className="min-h-screen bg-[#f9f6f2] flex flex-col relative overflow-hidden text-[#262626] font-sans">
      
      {/* 1. Announcement Bar */}
      <div className="w-full bg-[#f4eee5] text-[#262626] text-center py-2.5 px-4 z-50 relative border-b border-[#e7e7e7]">
        <span className="text-caption uppercase tracking-wider font-semibold">
          NEW: Synced Real-Time Pomodoro Modules Live Now — Start Free
        </span>
      </div>

      {/* 2. Floating Abstract Shapes (Decorative organic shapes in hero bg) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0A7C6E]/5 rounded-full filter blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-[#000015]/5 rounded-full filter blur-[150px]" />
      </div>

      {/* 3. Header */}
      <header className="sticky top-0 z-40 w-full bg-[#f9f6f2]/90 backdrop-blur-md border-b border-[#e7e7e7]">
        <div className="flex items-center justify-between px-6 py-4 max-w-[1320px] mx-auto w-full">
          <div className="flex items-center gap-2">
            {/* Outline Logo Container */}
            <div className="w-8 h-8 rounded-[5px] border border-[#e7e7e7] bg-white flex items-center justify-center text-black">
              <svg
                className="w-4 h-4 text-[#0A7C6E] stroke-[2]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="font-heading text-xl font-semibold tracking-tight text-[#141414]">
              StudyRoom
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login" className="btn-evernote-ghost hover:opacity-60 transition-opacity">
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-evernote-primary text-xs uppercase px-5 py-2">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* 4. Hero Section */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-[1320px] mx-auto w-full flex-1 justify-center">
        
        <span className="text-caption uppercase tracking-wider text-[#4e4d4c] mb-6 font-semibold bg-[#f4eee5] px-3 py-1 rounded-[5px]">
          COLLABORATIVE STUDY SPACE — V2.0
        </span>

        <h1 className="text-display text-[#141414] font-semibold mb-8 leading-[1.1] select-none max-w-4xl text-center">
          Your study space, organized.
        </h1>

        <p className="text-subheading text-[#262626] max-w-2xl mb-12 text-center leading-relaxed">
          Remember everything and track your focused Pomodoro sessions. Timed study modules synced in real-time, persistent team chat, and active peer presence indicators. Built as a calm focus environment.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <div className="relative flex items-center w-full border border-[#e7e7e7] bg-white rounded-[5px] p-1.5 focus-within:border-[#0A7C6E] transition-colors shadow-none">
            <input 
              type="email" 
              placeholder="ENTER YOUR STUDENT EMAIL" 
              className="w-full bg-white text-black font-sans text-sm placeholder:text-[#4e4d4c]/50 px-4 py-3 outline-none rounded-[5px]"
            />
            <Link href="/auth/signup" className="absolute right-2">
              <button className="btn-evernote-primary text-xs uppercase px-5 py-2.5">
                START FREE
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Features Section (Primary Feature Cards) */}
      <section className="relative z-10 w-full bg-[#f4eee5] border-t border-[#e7e7e7] py-28">
        <div className="max-w-[1320px] mx-auto px-6">
          
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e7e7e7] pb-6">
            <div>
              <span className="text-caption uppercase text-[#4e4d4c] font-semibold">
                SYSTEM USE-CASES & FEATURES
              </span>
              <h2 className="text-heading text-[#141414] font-semibold mt-2">
                04 Functional Modules
              </h2>
            </div>
            <p className="text-body text-[#4e4d4c] max-w-sm uppercase font-semibold font-mono tracking-wider text-xs md:text-right">
              Everything in one calm interface
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'STUDY ROOMS',
                desc: 'Create or join highly-collaborative study spaces using secure 8-character invite codes.',
                icon: <Users className="w-5 h-5 text-[#0A7C6E]" />,
              },
              {
                title: 'TIMED SESSIONS',
                desc: 'Run precision timed Pomodoro rounds synced across all active room participants in real-time.',
                icon: <Timer className="w-5 h-5 text-[#0A7C6E]" />,
              },
              {
                title: 'REALTIME CHAT',
                desc: 'Instant message streams backed by flat presence status mapping and persistent histories.',
                icon: <MessageSquare className="w-5 h-5 text-[#0A7C6E]" />,
              },
              {
                title: 'ACTIVITY LOGS',
                desc: 'Review detailed team progress updates, study duration statistics, and room histories.',
                icon: <Clock className="w-5 h-5 text-[#0A7C6E]" />,
              },
            ].map((row) => (
              <div 
                key={row.title}
                className="card-evernote-primary flex gap-6 items-start hover:border-[#0A7C6E] transition-colors"
              >
                {/* Outlined Icon Wrapper */}
                <div className="w-10 h-10 rounded-[5px] border border-[#e7e7e7] bg-[#f9f6f2] flex items-center justify-center shrink-0">
                  {row.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-heading-sm text-[#141414] font-semibold">
                    {row.title}
                  </h3>
                  <p className="text-body text-[#262626]">
                    {row.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. Footer */}
      <footer className="w-full bg-[#f9f6f2] border-t border-[#e7e7e7] py-8 px-6 relative z-10">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-caption text-[#4e4d4c] font-semibold">
            © {new Date().getFullYear()} StudyRoom Inc. Digital Architecture by Anand Choubey.
          </span>
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/isitanand" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-caption text-[#4e4d4c] hover:text-[#141414] font-semibold flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
              GitHub
            </a>
            <a 
              href="https://instagram.com/aaanand0.0" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-caption text-[#4e4d4c] hover:text-[#141414] font-semibold flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
