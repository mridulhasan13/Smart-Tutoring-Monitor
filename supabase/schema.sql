
-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- 1. Profiles Table (Extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  profession text,
  institution text,
  university text,
  year_term text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );

-- 2. Students Table
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  phone text,
  email text,
  subject text,
  grade text,
  monthly_payment numeric,
  is_group boolean default false,
  group_size integer default 0,
  group_members text[], -- Array of strings
  color text,
  whatsapp_group_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.students enable row level security;
create policy "Users can view their own students." on public.students for select using ( auth.uid() = user_id );
create policy "Users can insert their own students." on public.students for insert with check ( auth.uid() = user_id );
create policy "Users can update their own students." on public.students for update using ( auth.uid() = user_id );
create policy "Users can delete their own students." on public.students for delete using ( auth.uid() = user_id );

-- 3. Sessions Table
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  student_id uuid references public.students(id) on delete cascade not null,
  student_name text, -- Snapshotted name for persistence
  date timestamp with time zone not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration integer,
  status text check (status in ('completed', 'scheduled', 'cancelled', 'in-progress')),
  subject_taught text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.sessions enable row level security;
create policy "Users can view their own sessions." on public.sessions for select using ( auth.uid() = user_id );
create policy "Users can insert their own sessions." on public.sessions for insert with check ( auth.uid() = user_id );
create policy "Users can update their own sessions." on public.sessions for update using ( auth.uid() = user_id );
create policy "Users can delete their own sessions." on public.sessions for delete using ( auth.uid() = user_id );

-- 4. Payments Table
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  student_id uuid references public.students(id) on delete cascade not null,
  student_name text, -- Snapshotted name for persistence
  amount numeric not null,
  date timestamp with time zone not null,
  due_date timestamp with time zone not null,
  status text check (status in ('paid', 'pending', 'overdue')),
  reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.payments enable row level security;
create policy "Users can view their own payments." on public.payments for select using ( auth.uid() = user_id );
create policy "Users can insert their own payments." on public.payments for insert with check ( auth.uid() = user_id );
create policy "Users can update their own payments." on public.payments for update using ( auth.uid() = user_id );
create policy "Users can delete their own payments." on public.payments for delete using ( auth.uid() = user_id );

-- 5. Emails Table
create table public.emails (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  "to" text not null,
  subject text not null,
  body text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('dispatched', 'delivered'))
);
alter table public.emails enable row level security;
create policy "Users can view their own emails." on public.emails for select using ( auth.uid() = user_id );
create policy "Users can insert their own emails." on public.emails for insert with check ( auth.uid() = user_id );

-- 6. Login History Table
create table public.login_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  action text check (action in ('login', 'logout'))
);
alter table public.login_history enable row level security;
create policy "Users can view their own login history." on public.login_history for select using ( auth.uid() = user_id );
create policy "Users can insert their own login history." on public.login_history for insert with check ( auth.uid() = user_id );
