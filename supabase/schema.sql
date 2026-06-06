create table if not exists public.correcoes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null,
  email text not null,
  parlamentar text not null,
  cargo text not null,
  metrica text not null,
  ano text not null,
  valor_informado text not null,
  fonte_url text not null,
  observacoes text,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_analise', 'validado', 'recusado')),
  observacao_interna text,
  observacao_publica text
);

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.metricas_validadas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  validado_em timestamptz not null default now(),
  correcao_id uuid references public.correcoes(id) on delete set null,
  parlamentar text not null,
  cargo text not null,
  metrica text not null,
  ano text not null,
  valor text not null,
  fonte_url text not null,
  observacao_publica text,
  ativo boolean not null default true
);

create table if not exists public.deputado_ano_resumos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ano text not null,
  deputado_id text not null,
  nome text not null,
  partido text,
  uf text,
  total_gasto numeric not null default 0,
  quantidade_despesas integer not null default 0,
  media_mensal numeric not null default 0,
  maior_fornecedor text,
  maior_fornecedor_valor numeric,
  categorias jsonb not null default '[]'::jsonb,
  status text not null default 'available'
    check (status in ('available', 'unavailable', 'partial', 'error')),
  source_name text not null default 'Camara dos Deputados - Dados Abertos',
  source_url text not null,
  fetched_at timestamptz not null,
  calculation_method text not null,
  confidence_level text not null default 'high'
    check (confidence_level in ('high', 'medium', 'low')),
  unique (ano, deputado_id)
);

alter table public.correcoes enable row level security;
alter table public.admin_users enable row level security;
alter table public.metricas_validadas enable row level security;
alter table public.deputado_ano_resumos enable row level security;

create index if not exists metricas_validadas_parlamentar_idx
on public.metricas_validadas (parlamentar, ano, cargo);

create index if not exists deputado_ano_resumos_ano_total_idx
on public.deputado_ano_resumos (ano, total_gasto desc);

create index if not exists deputado_ano_resumos_ano_uf_idx
on public.deputado_ano_resumos (ano, uf, total_gasto desc);

drop policy if exists "Admins podem ver allowlist" on public.admin_users;
create policy "Admins podem ver allowlist"
on public.admin_users
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Visitantes podem enviar correcoes" on public.correcoes;
create policy "Visitantes podem enviar correcoes"
on public.correcoes
for insert
to anon
with check (status = 'pendente');

drop policy if exists "Leitura bloqueada para visitantes" on public.correcoes;
drop policy if exists "Admin anon pode ler correcoes" on public.correcoes;
drop policy if exists "Admin anon pode atualizar status" on public.correcoes;
drop policy if exists "Usuarios autenticados podem ler correcoes" on public.correcoes;
drop policy if exists "Usuarios autenticados podem atualizar correcoes" on public.correcoes;
drop policy if exists "Admins autenticados podem ler correcoes" on public.correcoes;
drop policy if exists "Admins autenticados podem atualizar correcoes" on public.correcoes;

create policy "Leitura bloqueada para visitantes"
on public.correcoes
for select
to anon
using (false);

create policy "Admins autenticados podem ler correcoes"
on public.correcoes
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

create policy "Admins autenticados podem atualizar correcoes"
on public.correcoes
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  status in ('pendente', 'em_analise', 'validado', 'recusado')
  and exists (
    select 1 from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "Visitantes podem ler metricas validadas" on public.metricas_validadas;
drop policy if exists "Admins autenticados podem gerenciar metricas validadas" on public.metricas_validadas;

create policy "Visitantes podem ler metricas validadas"
on public.metricas_validadas
for select
to anon, authenticated
using (ativo = true);

create policy "Admins autenticados podem gerenciar metricas validadas"
on public.metricas_validadas
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "Visitantes podem ler resumos anuais de deputados" on public.deputado_ano_resumos;
drop policy if exists "Admins autenticados podem gerenciar resumos anuais de deputados" on public.deputado_ano_resumos;

create policy "Visitantes podem ler resumos anuais de deputados"
on public.deputado_ano_resumos
for select
to anon, authenticated
using (true);

create policy "Admins autenticados podem gerenciar resumos anuais de deputados"
on public.deputado_ano_resumos
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);
