create or replace function match_ai_faqs(
  query_embedding vector(768),
  match_hotel_id uuid,
  match_language text,
  match_threshold double precision default 0.75,
  match_count integer default 5
)
returns table (
  id uuid,
  question text,
  answer text,
  category text,
  language text,
  keywords jsonb,
  score double precision
)
language sql
stable
as $$
  select
    ai_faqs.id,
    ai_faqs.question,
    ai_faqs.answer,
    ai_faqs.category,
    ai_faqs.language,
    ai_faqs.keywords,
    1 - (ai_faqs.embedding <=> query_embedding) as score
  from ai_faqs
  where ai_faqs.hotel_id = match_hotel_id
    and ai_faqs.is_active = true
    and ai_faqs.embedding is not null
    and ai_faqs.language in (match_language, 'all')
    and 1 - (ai_faqs.embedding <=> query_embedding) >= match_threshold
  order by ai_faqs.embedding <=> query_embedding
  limit least(match_count, 20);
$$;

grant execute on function match_ai_faqs(vector(768), uuid, text, double precision, integer) to authenticated, service_role;
