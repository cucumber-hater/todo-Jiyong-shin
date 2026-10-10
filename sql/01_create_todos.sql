-- 1단계: todos 표 만들기 (Supabase에 이미 실행한 SQL을 기록으로 남겨 둔 파일)

create table public.todos (
  id bigint generated always as identity primary key,           -- 번호 (자동으로 1, 2, 3...)
  title text not null check (char_length(trim(title)) > 0),    -- 할 일 내용 (빈칸 금지)
  done boolean not null default false,                         -- 완료했는지
  created_at timestamptz not null default now()                -- 만든 시각
);

-- RLS(행 단위 보안) 켜기: 정책으로 허락한 것만 할 수 있게 됩니다.
alter table public.todos enable row level security;

-- 예시 할 일 3개 (첫 번째는 완료)
insert into public.todos (title, done, created_at) values
  ('교재 6장 읽기', true,  now() - interval '2 minutes'),
  ('Supabase 표 만들어 보기', false, now() - interval '1 minute'),
  ('할 일 앱 친구에게 보여 주기', false, now());
