/**
 * 数据库操作封装
 * 封装常用的 CRUD 操作
 */
import { createClient } from './supabase/server';

// ─── Profile ──────────────────────────────────────────────────

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates: {
  full_name?: string;
  industry?: string;
  business_name?: string;
  location?: string;
  phone?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Services ─────────────────────────────────────────────────

export async function getMyServices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addService(service: {
  name: string;
  description?: string;
  price: number;
  category?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('services')
    .insert({ ...service, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Content Records ──────────────────────────────────────────

export async function getMyContents(limit: number = 50) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('content_records')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createContentRecord(content: {
  topic: string;
  content_type: string;
  title: string;
  script_json?: unknown;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('content_records')
    .insert({ ...content, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContentMetrics(
  contentId: string,
  metrics: { views?: number; likes?: number; comments?: number; inquiries?: number },
  status?: 'published' | 'filming' | 'archived'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const updates: {
    metrics: { views?: number; likes?: number; comments?: number; inquiries?: number };
    updated_at: string;
    status?: 'published' | 'filming' | 'archived';
    published_at?: string;
  } = { metrics, updated_at: new Date().toISOString() };
  if (status) {
    updates.status = status;
    if (status === 'published') updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('content_records')
    .update(updates)
    .eq('id', contentId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  // 异步刷新业务指标
  await supabase.rpc('refresh_business_metrics', { p_user_id: user.id });

  return data;
}

// ─── Business Metrics ─────────────────────────────────────────

export async function getMyBusinessMetrics() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('business_metrics')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

// ─── Preferences ──────────────────────────────────────────────

export async function getMyPreferences() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updatePreferences(updates: {
  preferred_content_types?: string[];
  avoided_topics?: string[];
  max_difficulty?: string;
  target_customers?: string;
  price_range?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ ...updates, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Recommendation History ───────────────────────────────────

export async function saveRecommendationHistory(recommendation: {
  topic: string;
  content_type: string;
  title: string;
  reason?: string;
  score?: number;
  confidence?: number;
  expected_views?: number;
  expected_inquiries?: number;
  difficulty?: string;
  estimated_time?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('recommendation_history')
    .insert({ ...recommendation, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMyRecommendationHistory(limit: number = 20) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('recommendation_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function giveRecommendationFeedback(
  recId: string,
  feedback: 'good' | 'neutral' | 'bad',
  actualContentId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('recommendation_history')
    .update({ user_feedback: feedback, actual_content_id: actualContentId })
    .eq('id', recId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
