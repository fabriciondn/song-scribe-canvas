-- Tabela para histórico de senhas
create table if not exists password_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  password_hash text not null,
  changed_at timestamptz not null default now()
);
