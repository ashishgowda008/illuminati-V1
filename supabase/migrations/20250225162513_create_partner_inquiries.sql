-- Create partner inquiries table
create table if not exists public.partner_inquiries (
    id uuid not null default gen_random_uuid() primary key,
    name text not null,
    email text not null,
    brand_name text not null,
    sponsorship_type text not null,
    message text not null,
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Enable RLS
alter table public.partner_inquiries enable row level security;

-- Create policies
create policy "Enable insert access for authenticated users" on public.partner_inquiries
    for insert
    to authenticated
    with check (true);

create policy "Enable read access for authenticated users" on public.partner_inquiries
    for select
    to authenticated
    using (true);

-- Functions
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

-- Triggers
create trigger handle_updated_at
    before update on public.partner_inquiries
    for each row
    execute function public.handle_updated_at();