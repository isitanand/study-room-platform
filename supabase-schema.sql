



CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);



CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read all rooms" 
    ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to create rooms" 
    ON public.rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow room owners to delete or update their rooms" 
    ON public.rooms FOR ALL USING (auth.uid() = created_by);



CREATE TABLE public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (room_id, user_id)
);


ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to read room member list" 
    ON public.room_members FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow user to join a room" 
    ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow members to update or leave a room membership" 
    ON public.room_members FOR ALL USING (auth.uid() = user_id);



CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to read messages" 
    ON public.messages FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.room_members 
            WHERE room_members.room_id = messages.room_id AND room_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow members to insert messages" 
    ON public.messages FOR INSERT WITH CHECK (
        auth.uid() = user_id AND EXISTS (
            SELECT 1 FROM public.room_members 
            WHERE room_members.room_id = messages.room_id AND room_members.user_id = auth.uid()
        )
    );



CREATE TABLE public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    started_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true NOT NULL
);


ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to view study sessions" 
    ON public.study_sessions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow members to insert sessions" 
    ON public.study_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow members to update sessions" 
    ON public.study_sessions FOR UPDATE USING (auth.role() = 'authenticated');



CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select access to activity log" 
    ON public.activity_log FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insertion into activity log" 
    ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Automatic Profile Creation Trigger
-- Automatically creates a user profile in public.profiles when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();









