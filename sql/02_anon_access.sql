-- 4단계: 로그인하지 않은 사람(anon)도 읽기·추가·고치기·지우기를 할 수 있게 하기
-- RLS는 켜 둔 채로, "누구나 해도 된다"는 정책을 하나씩 만듭니다.

-- GRANT: anon 역할이 이 표를 다룰 수 있는 기본 권한
grant select, insert, update, delete on table public.todos to anon;

-- RLS 정책: 어떤 줄(행)을 다룰 수 있는지 정합니다. true = 모든 줄
create policy "anon can read todos" on public.todos
  for select to anon using (true);

create policy "anon can add todos" on public.todos
  for insert to anon with check (true);

create policy "anon can edit todos" on public.todos
  for update to anon using (true) with check (true);

create policy "anon can delete todos" on public.todos
  for delete to anon using (true);
