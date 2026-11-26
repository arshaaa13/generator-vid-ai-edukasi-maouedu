-- ============================================================================
-- MaouEdu AI Studio — Self-Upgrading Anime Director & Anti-"Aneh" QC Schema
-- Compatible with Supabase Postgres + Row Level Security (Server-Side Write Only)
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. VT References (Extracted Cinematography, Pacing & Visual DNA from Reference Videos)
create table if not exists public.vt_references (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_notes text default '',
  storage_path text default '',
  avg_cut_duration_sec double precision not null default 2.5,
  hook_structure jsonb not null default '{}'::jsonb,
  camera_patterns jsonb not null default '{}'::jsonb,
  visual_style_dna jsonb not null default '{}'::jsonb,
  subtitle_safe_zone jsonb not null default '{}'::jsonb,
  raw_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vt_references_created_at_idx
  on public.vt_references (created_at desc);

-- 2. Director Playbook (Versioned AI Brain with 1-Click Rollback)
create table if not exists public.director_playbook (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique,
  is_active boolean not null default false,
  pacing_rules jsonb not null default '{}'::jsonb,
  camera_rules jsonb not null default '{}'::jsonb,
  composition_rules jsonb not null default '{}'::jsonb,
  prompt_guidelines text not null default '',
  negative_constraints jsonb not null default '[]'::jsonb,
  shader_presets jsonb not null default '{}'::jsonb,
  changelog text not null default '',
  parent_version integer,
  created_at timestamptz not null default now()
);

create index if not exists director_playbook_active_idx
  on public.director_playbook (version desc)
  where is_active = true;

-- 3. Learned Mistakes (Persistent Anti-"Aneh" Constraint Memory)
create table if not exists public.learned_mistakes (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'anatomy',
      'character_drift',
      'layout_collision',
      'weird_motion',
      'pacing',
      'style_clash'
    )
  ),
  symptom text not null,
  bad_pattern text not null,
  corrective_rule text not null,
  severity integer not null default 3 check (severity between 1 and 5),
  occurrences integer not null default 1 check (occurrences >= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learned_mistakes_category_pattern_key unique (category, bad_pattern)
);

create index if not exists learned_mistakes_active_sev_idx
  on public.learned_mistakes (severity desc, occurrences desc, updated_at desc)
  where is_active = true;

-- 4. Generation Runs (Audit Trail of Which Playbook Version Produced Each Video)
create table if not exists public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  playbook_version integer not null default 1,
  avg_critic_score double precision,
  status text not null default 'in_progress',
  created_at timestamptz not null default now()
);

create index if not exists generation_runs_created_at_idx
  on public.generation_runs (created_at desc);

-- 5. Scene Evaluations (Per-Scene Vision Auto-Critic Scores + Human 👍/👎 Feedback)
create table if not exists public.scene_evaluations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.generation_runs(id) on delete cascade,
  scene_index integer not null check (scene_index >= 0),
  scene_type text not null default 'host' check (scene_type in ('host', 'cutaway')),
  prompt_used text not null default '',
  motion_or_camera_config jsonb not null default '{}'::jsonb,
  critic_score double precision,
  critic_defects jsonb not null default '[]'::jsonb,
  retry_count integer not null default 0 check (retry_count >= 0),
  user_rating text check (user_rating is null or user_rating in ('good', 'weird')),
  user_note text not null default '',
  preview_storage_path text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists scene_evaluations_run_id_idx
  on public.scene_evaluations (run_id);

create index if not exists scene_evaluations_rating_idx
  on public.scene_evaluations (user_rating, created_at desc);

-- ============================================================================
-- STRICT ROW LEVEL SECURITY (Public Clients Blocked; Server Secret Key Only)
-- ============================================================================
alter table public.vt_references enable row level security;
alter table public.director_playbook enable row level security;
alter table public.learned_mistakes enable row level security;
alter table public.generation_runs enable row level security;
alter table public.scene_evaluations enable row level security;

revoke all on table public.vt_references from anon, authenticated;
revoke all on table public.director_playbook from anon, authenticated;
revoke all on table public.learned_mistakes from anon, authenticated;
revoke all on table public.generation_runs from anon, authenticated;
revoke all on table public.scene_evaluations from anon, authenticated;

-- ============================================================================
-- SEED PLAYBOOK V1 BASELINE (Dark 2D Broadcast Anime + mc_default.jpg Lock)
-- ============================================================================
insert into public.director_playbook (
  version,
  is_active,
  pacing_rules,
  camera_rules,
  composition_rules,
  prompt_guidelines,
  negative_constraints,
  shader_presets,
  changelog,
  parent_version
)
values (
  1,
  true,
  '{
    "avg_cut_duration_sec": 2.4,
    "max_static_shot_sec": 3.0,
    "hook_duration_sec": 2.5,
    "host_vs_cutaway_ratio": "45:55",
    "transition_duration_sec": 0.15,
    "motion_cadence_fps": 12
  }'::jsonb,
  '{
    "hook_motion": "slow_push_in",
    "conflict_motion": "dutch_shibuya_shake",
    "explain_motion": "pan_left_to_right",
    "climax_motion": "crash_zoom_impact",
    "preferred_transitions": ["whip_cut", "zoom_punch"]
  }'::jsonb,
  '{
    "aspect_ratio": "9:16",
    "safe_margin_px": 48,
    "subtitle_bottom_zone_pct": 18,
    "character_anchor": "mc_default.jpg",
    "never_flip_asymmetrical_horns": true
  }'::jsonb,
  'Direct dark-action 2D Japanese TV anime cinematography strictly locked to /public/style-anchors/mc_default.jpg (sharp mature male jawline, spiky silver-gray hair with 1 crimson-red center bang, golden-amber eyes, intact curved black left horn, broken magma-cracked right horn, black popped-collar coat with gold trim, crimson diamond lapel brooch, black gloves with silver rings). Alternate dramatic Host shots and full-screen 9:16 dark-anime macro cutaways every 2.2-2.8s. Use ONLY pure Katakana/Kanji SFX.',
  '[
    "no horizontal scanlines across character body",
    "no blinding pure white spotlight diagram boxes",
    "no 3D plastic CGI or chibi drift on Host",
    "no mirrored horns (keep viewer-left intact, viewer-right broken red)",
    "no mixed Katakana-Latin SFX like ズGararara!",
    "no static frozen shots longer than 3.0s"
  ]'::jsonb,
  '{
    "bloomStrength": 0.28,
    "lightWrapStrength": 0.44,
    "ambientHarmonization": 0.22,
    "shadowCrush": 0.14,
    "dofBlur": 0.28,
    "chromaticPeak": 0.012,
    "contrast": 1.10,
    "saturation": 1.14,
    "rimIntensity": 0.80
  }'::jsonb,
  'Baseline v1: Dark-action 2D broadcast cinematography + strict mc_default.jpg identity lock + zero scanlines/white-box rules.',
  null
)
on conflict (version) do nothing;

-- ============================================================================
-- PRIVATE STORAGE BUCKET FOR VT REFERENCE THUMBNAILS & FLAGGED FRAMES
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'director-assets',
  'director-assets',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
