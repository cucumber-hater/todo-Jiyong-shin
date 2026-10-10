-- 6단계: 마감일 칸 추가 (비워도 됨 → null 허용)
alter table public.todos add column due_date date;
