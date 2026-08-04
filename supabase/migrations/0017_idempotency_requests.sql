create table if not exists idempotency_request (
  id uuid primary key default gen_random_uuid(),
  tai_khoan_id uuid not null references tai_khoan(tai_khoan_id) on delete cascade,
  bai_lam_id uuid not null references bai_lam_thi(bai_lam_id) on delete cascade,
  loai text not null check (loai in ('autosave', 'submit')),
  idempotency_key uuid not null,
  payload_hash text not null,
  response_body jsonb,
  response_status integer,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (tai_khoan_id, bai_lam_id, loai, idempotency_key)
);

alter table idempotency_request enable row level security;
revoke all on idempotency_request from public, anon, authenticated;
grant all on idempotency_request to service_role;

create index if not exists idx_idempotency_request_created_at
  on idempotency_request(created_at);

