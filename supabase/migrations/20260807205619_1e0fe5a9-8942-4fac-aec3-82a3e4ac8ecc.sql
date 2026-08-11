-- === Roles ===
create type public.app_role as enum ('admin', 'editor');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "users read own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- === Profiles ===
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- === Leads ===
create type public.lead_type as enum ('contact', 'demo');
create type public.lead_status as enum ('new', 'contacted', 'closed');

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  type lead_type not null default 'contact',
  name text not null,
  email text not null,
  phone text,
  school text,
  enquiry_type text,
  message text not null,
  interests text[] default '{}',
  status lead_status not null default 'new',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.leads to authenticated;
grant insert on public.leads to anon;
grant all on public.leads to service_role;
alter table public.leads enable row level security;

create policy "anon can submit leads"
  on public.leads for insert
  to anon
  with check (true);
create policy "authed can submit leads"
  on public.leads for insert
  to authenticated
  with check (true);
create policy "admins manage leads"
  on public.leads for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- === Products ===
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price text not null,
  stock text not null default 'In stock',
  features text[] default '{}',
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "public sees published products"
  on public.products for select
  to anon
  using (published = true);
create policy "authed sees published products"
  on public.products for select
  to authenticated
  using (published = true or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "admins manage products"
  on public.products for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- === Programmes ===
create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'solution',
  summary text not null default '',
  features text[] default '{}',
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.programmes to anon;
grant select, insert, update, delete on public.programmes to authenticated;
grant all on public.programmes to service_role;
alter table public.programmes enable row level security;

create policy "public sees published programmes"
  on public.programmes for select
  to anon
  using (published = true);
create policy "authed sees published programmes"
  on public.programmes for select
  to authenticated
  using (published = true or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "admins manage programmes"
  on public.programmes for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- === Schools ===
create type public.school_status as enum ('prospect', 'active', 'inactive');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default '',
  contact_person text not null default '',
  email text not null default '',
  phone text not null default '',
  model text not null default 'School-funded',
  status school_status not null default 'prospect',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.schools to authenticated;
grant all on public.schools to service_role;
alter table public.schools enable row level security;

create policy "admins manage schools"
  on public.schools for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- === Teachers ===
create type public.teacher_status as enum ('active', 'inactive');

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  phone text not null default '',
  school_id uuid references public.schools(id) on delete set null,
  specialization text not null default '',
  status teacher_status not null default 'active',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.teachers to authenticated;
grant all on public.teachers to service_role;
alter table public.teachers enable row level security;

create policy "admins manage teachers"
  on public.teachers for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- === Seed products ===
insert into public.products (name, category, price, stock, features, sort_order) values
('Starter Robotics Kit', 'Robotics kits', '₹6,499', 'In stock', '{"12 build projects","Motor driver + chassis","Grades 3–6"}', 1),
('Advanced Robotics Kit', 'Robotics kits', '₹14,999', 'In stock', '{"Line follower & arm","Bluetooth module","Grades 7–12"}', 2),
('AI Vision Board', 'Electronics', '₹9,250', 'Low stock', '{"On-device inference","Camera module","Python SDK"}', 3),
('Sensor Pack (24 pcs)', 'Electronics', '₹3,199', 'In stock', '{"IR, ultrasonic, DHT","Jumper set","Lab replenishment"}', 4),
('Coding Companion — Grades 1–5', 'Books', '₹499', 'In stock', '{"Full colour workbook","Teacher guide","NEP mapped"}', 5),
('AI & ICT Handbook — Grades 9–12', 'Books', '₹749', 'In stock', '{"CBSE aligned","Project rubrics","Assessment bank"}', 6),
('STEM Workbench', 'Lab equipment', '₹42,000', 'Made to order', '{"Anti-static top","Tool storage","Seats 6 students"}', 7),
('VR Class Set (10 headsets)', 'Lab equipment', '₹1,85,000', 'Made to order', '{"Concept library","Charging case","Teacher console"}', 8);

-- === Seed programmes ===
insert into public.programmes (name, type, summary, features, sort_order) values
('Coding', 'solution', 'Progressive computational thinking from blocks to full-stack projects.', '{"Block coding & Scratch","Python and app building","Web development","Coding competitions"}', 1),
('Robotics Lab', 'solution', 'A complete lab: benches, kits, sensors, controllers and project library.', '{"Lab design & installation","Kits and spares","Teacher certification","Competition mentoring"}', 2),
('AI Lab', 'solution', 'Data, machine learning and responsible AI, taught through build projects.', '{"Vision & speech projects","Datasets and notebooks","AI ethics modules","Capstone showcase"}', 3),
('STEM Labs', 'solution', 'Cross-subject maker spaces for science, maths and design thinking.', '{"Maker equipment","Consumables plan","Activity handbooks","Annual maintenance"}', 4),
('VR Learning', 'solution', 'Immersive concept experiences that make abstract topics concrete.', '{"Headset kits","Concept library","Guided lesson plans","Class management app"}', 5),
('Entrepreneurship', 'solution', 'Finance literacy, critical thinking and student-run venture challenges.', '{"Business basics","Pitch bootcamps","Mentor network","Inter-school demo day"}', 6),
('Primary', 'curriculum', 'Curiosity and logic — Grades 1–5.', '{"Block coding","Simple machines","Sensors play","Digital citizenship","Storytelling with tech"}', 7),
('Middle', 'curriculum', 'Build and iterate — Grades 6–8.', '{"Python foundations","Robotics with microcontrollers","Intro to AI & data","3D design","Team projects"}', 8),
('Senior', 'curriculum', 'Depth and portfolio — Grades 9–12.', '{"Applied machine learning","IoT and automation","App & web development","Entrepreneurship","Capstone research"}', 9);

-- === Seed schools ===
insert into public.schools (name, city, contact_person, email, phone, model, status) values
('Greenwood International', 'Pune', 'Priya Sharma', 'priya@greenwood.edu', '+91 98000 10001', 'School-funded', 'active'),
('Delhi Public School', 'Delhi', 'Rajesh Kumar', 'rajesh@dps.edu', '+91 98000 10002', 'Hybrid', 'active'),
('Bright Future Academy', 'Mumbai', 'Anita Desai', 'anita@brightfuture.edu', '+91 98000 10003', 'Parent-funded', 'prospect'),
('Sunrise Vidyalaya', 'Bengaluru', 'Vikram Reddy', 'vikram@sunrise.edu', '+91 98000 10004', 'School-funded', 'active'),
('Heritage School', 'Jaipur', 'Meena Singh', 'meena@heritage.edu', '+91 98000 10005', 'Hybrid', 'inactive');

-- === Seed teachers ===
insert into public.teachers (name, email, phone, specialization, status) values
('Arjun Mehta', 'arjun@aaklan.example', '+91 98000 20001', 'Robotics & Python', 'active'),
('Sneha Iyer', 'sneha@aaklan.example', '+91 98000 20002', 'AI & Data Science', 'active'),
('Rohit Gupta', 'rohit@aaklan.example', '+91 98000 20003', 'Coding & Web Development', 'active'),
('Kavya Nair', 'kavya@aaklan.example', '+91 98000 20004', 'STEM & 3D Design', 'inactive'),
('Deepak Verma', 'deepak@aaklan.example', '+91 98000 20005', 'Robotics & IoT', 'active');