-- ═══════════════════════════════════════════════════════════════
-- 店播AI Agent - Supabase 数据库迁移脚本
-- 执行方式：在 Supabase 控制台的 SQL Editor 中逐段执行
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. 用户资料表（扩展 auth.users）──────────────────────────
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  industry    TEXT DEFAULT '未分类',  -- 支持自定义行业，不再限制固定选项
  business_name TEXT,
  location    TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 为 profiles 开启行级安全 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能读写自己的 profile
CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 注册时自动创建 profile（触发器）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 2. 服务/项目表 ──────────────────────────────────────────
CREATE TABLE public.services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC NOT NULL DEFAULT 0,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_select_own" ON public.services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "services_all_own"   ON public.services FOR ALL    USING (auth.uid() = user_id);


-- ─── 3. 内容记录表 ──────────────────────────────────────────
CREATE TABLE public.content_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic        TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN (
                 'customer_case', 'knowledge', 'environment_tour',
                 'promotion', 'behind_scenes', 'product_showcase'
               )),
  title        TEXT NOT NULL,
  script_json  JSONB,                  -- 生成的完整脚本
  status       TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'filming', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  metrics      JSONB DEFAULT '{"views":0,"likes":0,"comments":0,"inquiries":0}'::jsonb,
  platform     TEXT,                   -- 'douyin' | 'xiaohongshu' | 'wechat' | ...
  video_url    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_select_own" ON public.content_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "content_all_own"   ON public.content_records FOR ALL    USING (auth.uid() = user_id);

-- 常用查询索引
CREATE INDEX idx_content_user_id     ON public.content_records(user_id);
CREATE INDEX idx_content_created_at  ON public.content_records(created_at DESC);
CREATE INDEX idx_content_status      ON public.content_records(status);


-- ─── 4. 业务指标表（缓存计算结果）─────────────────────────────
CREATE TABLE public.business_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_contents        INTEGER DEFAULT 0,
  avg_views_per_content INTEGER DEFAULT 0,
  avg_inquiries_per_content NUMERIC DEFAULT 0,
  trend                 TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  by_content_type       JSONB DEFAULT '{}'::jsonb,
  best_content_id       UUID REFERENCES public.content_records(id),
  refreshed_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metrics_select_own" ON public.business_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "metrics_all_own"   ON public.business_metrics FOR ALL    USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_metrics_user ON public.business_metrics(user_id);


-- ─── 5. 用户偏好表 ───────────────────────────────────────────
CREATE TABLE public.user_preferences (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_content_types TEXT[] DEFAULT '{}',
  avoided_topics        TEXT[] DEFAULT '{}',
  max_difficulty        TEXT DEFAULT 'medium' CHECK (max_difficulty IN ('easy', 'medium', 'hard')),
  target_customers      TEXT,
  price_range           TEXT,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_select_own" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prefs_all_own"   ON public.user_preferences FOR ALL    USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_prefs_user ON public.user_preferences(user_id);


-- ─── 6. 推荐历史表 ───────────────────────────────────────────
CREATE TABLE public.recommendation_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic           TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  title           TEXT NOT NULL,
  reason          TEXT,
  score           NUMERIC,
  confidence      NUMERIC,
  expected_views  INTEGER,
  expected_inquiries INTEGER,
  difficulty      TEXT,
  estimated_time  NUMERIC,
  user_feedback   TEXT CHECK (user_feedback IN ('good', 'neutral', 'bad', NULL)),
  actual_content_id UUID REFERENCES public.content_records(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rec_hist_select_own" ON public.recommendation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rec_hist_all_own"   ON public.recommendation_history FOR ALL    USING (auth.uid() = user_id);

CREATE INDEX idx_rec_hist_user_id ON public.recommendation_history(user_id);
CREATE INDEX idx_rec_hist_created ON public.recommendation_history(created_at DESC);


-- ─── 7. 自动刷新业务指标的函数 ────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_business_metrics(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total     INTEGER;
  v_avg_views INTEGER;
  v_avg_inq   NUMERIC;
  v_trend     TEXT;
  v_by_type   JSONB;
  v_best_id   UUID;
  v_recent_7  NUMERIC;
  v_prev_7    NUMERIC;
BEGIN
  -- 基础统计
  SELECT
    COUNT(*),
    COALESCE(AVG((metrics->>'views')::int), 0),
    COALESCE(AVG((metrics->>'inquiries')::int), 0)
  INTO v_total, v_avg_views, v_avg_inq
  FROM public.content_records
  WHERE user_id = p_user_id AND status = 'published';

  -- 按内容类型分组
  SELECT jsonb_object_agg(
    content_type,
    jsonb_build_object(
      'count', cnt,
      'avgInquiries', avg_inq
    )
  )
  INTO v_by_type
  FROM (
    SELECT
      content_type,
      COUNT(*) AS cnt,
      COALESCE(AVG((metrics->>'inquiries')::int), 0) AS avg_inq
    FROM public.content_records
    WHERE user_id = p_user_id AND status = 'published'
    GROUP BY content_type
  ) sub;

  -- 趋势：近7天 vs 前7天
  SELECT
    COALESCE(AVG((metrics->>'views')::int) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'), 0),
    COALESCE(AVG((metrics->>'views')::int) FILTER (WHERE created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'), 0)
  INTO v_recent_7, v_prev_7
  FROM public.content_records
  WHERE user_id = p_user_id AND status = 'published';

  IF v_prev_7 = 0 AND v_recent_7 > 0 THEN v_trend := 'up';
  ELSIF v_prev_7 = 0 THEN v_trend := 'stable';
  ELSIF v_recent_7 / v_prev_7 > 1.1 THEN v_trend := 'up';
  ELSIF v_recent_7 / v_prev_7 < 0.9 THEN v_trend := 'down';
  ELSE v_trend := 'stable';
  END IF;

  -- 最佳内容
  SELECT id INTO v_best_id
  FROM public.content_records
  WHERE user_id = p_user_id AND status = 'published'
  ORDER BY (metrics->>'inquiries')::int DESC
  LIMIT 1;

  -- 插入或更新
  INSERT INTO public.business_metrics (user_id, total_contents, avg_views_per_content,
    avg_inquiries_per_content, trend, by_content_type, best_content_id, refreshed_at)
  VALUES (p_user_id, v_total, v_avg_views, v_avg_inq, v_trend,
          COALESCE(v_by_type, '{}'::jsonb), v_best_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_contents          = EXCLUDED.total_contents,
    avg_views_per_content   = EXCLUDED.avg_views_per_content,
    avg_inquiries_per_content = EXCLUDED.avg_inquiries_per_content,
    trend                   = EXCLUDED.trend,
    by_content_type         = EXCLUDED.by_content_type,
    best_content_id         = EXCLUDED.best_content_id,
    refreshed_at            = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
