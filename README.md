# StudyRoom — Collaborative Study Platform

## 🚀 Live Demo
[https://study-room-platform.vercel.app/](https://study-room-platform.vercel.app/)

## 📋 Project Overview
StudyRoom is a real-time collaborative study space designed for peer learning groups and students. The platform allows users to create virtual study rooms, manage live synchronized study sessions, message each other in real-time, trace complete study histories, and visualize personal performance analytics inside a unified workspace.

## ✨ Features

### Core Features (Assessment Requirements)
- **✅ Authentication**: Sign up with email + password, secure login validation, logout mechanisms, and middleware protected routes.
- **✅ Study Room Management**: Complete controls to create rooms (with auto-generated invite codes), join rooms, leave rooms, and delete rooms (owner exclusive).
- **✅ Real-time Group Chat**: Active messaging interface powered by Supabase Realtime with automatic message persistence.
- **✅ Study Session Timer**: Synced Pomodoro countdown clock that runs in real-time across all online members in a room.
- **✅ Session Duration Tracking**: Saves actual elapsed session durations to the database on completion or manually ending.
- **✅ Room Activity History**: Live chronological sidebar activity feed plus detailed chronological page log history.
- **✅ Activity Dashboard**: Main dashboard workspace showing room cards aggregated with completed sessions, study times, and last active indicators.

### Additional Features (Bonus)
- **✅ Online Presence Indicators**: Real-time member tracking (active presence count and online dot toggles).
- **✅ Invite Code System**: Unique 8-character invite code verification for secure membership access.
- **✅ Weekly Study Chart**: Dual-bar chart visualizing current week vs last week study minutes per day using dynamic lazy-loaded Recharts.
- **✅ Study Streak Tracking**: Computes and displays consecutive daily study streaks on the dashboard.
- **✅ Leaderboard Per Room**: Ranks top 3 members by total session duration with podium style UI highlighting the user.
- **✅ Mobile Responsive Design**: Custom single-column flex grids, compact layouts, and responsive sidebar Sheets suitable down to 375px screens.
- **✅ Real-time Activity Log**: Instant feedback and sync triggers for updates on room status, member actions, and timers.

## 🛠️ Tech Stack
- **Frontend Framework**: Next.js 16 (App Router), TypeScript
- **Styling & UI**: Tailwind CSS, Radix UI, Lucide icons
- **Database & Realtime**: Supabase (PostgreSQL, Auth, realtime database publications)
- **Charts**: Recharts (dynamic client loading)
- **Deployment**: Vercel

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- A Supabase account
- A Vercel account (for deployment)

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/study-room.git
   cd study-room
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file at the root of the project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Database**
   - Create a new project in the Supabase console.
   - Go to the **SQL Editor** in Supabase and run the queries defined in the [supabase-schema.sql](file:///c:/Users/ASUS/.gemini/antigravity/scratch/chatroom/supabase-schema.sql) file at the root of the project to initialize all tables, relations, and row-level security (RLS) policies.
   - Enable Realtime replication under **Database -> Replication -> Publications (supabase_realtime)** for these tables: `messages`, `study_sessions`, `activity_log`, and `room_members`.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open localhost server**
   Access the app at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure
```
app/
  auth/          # Login, signup pages
  dashboard/     # Main dashboard shell
  rooms/[id]/    # Dynamic study room workspace
components/
  ui/            # Shancn/ui primitives
  dashboard/     # Stats, Leaderboard, Chart components  
  room/          # Timer, Chat, Activity log, History components
lib/
  supabase/      # Supabase client/server connection setup
```

## 🗄️ Database Schema
- **`profiles`**: Links to Supabase auth users to hold display names, avatars, and usernames.
- **`rooms`**: Core room records (name, subject, invite code, owner ID, active status).
- **`room_members`**: Mapping table connecting profiles to rooms with role metadata (`owner` vs `member`).
- **`study_sessions`**: Tracks session timings, duration bounds, active states, and starter IDs.
- **`messages`**: Persists room messages with timestamps and content.
- **`activity_log`**: Log table tracking events (`room_created`, `member_joined`, `member_left`, `session_started`, `session_ended`, `session_completed`).

## 🔒 Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL= # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Your Supabase anon key
```

*Note: Never commit `.env.local` or active credential variables to git control.*
