-- 移除 industry 字段的 CHECK 约束，支持自定义行业类型
-- 执行方式：在 Supabase SQL Editor 中执行此脚本

-- 1. 删除现有的 CHECK 约束（如果存在）
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_industry_check;

-- 2. 修改默认值
ALTER TABLE public.profiles ALTER COLUMN industry SET DEFAULT '未分类';

-- 3. 更新现有数据中的旧行业值为更友好的显示名称（可选）
UPDATE public.profiles SET industry = '美容/美甲' WHERE industry = 'beauty';
UPDATE public.profiles SET industry = '餐饮/奶茶' WHERE industry = 'restaurant';
UPDATE public.profiles SET industry = '健身/瑜伽' WHERE industry = 'fitness';

-- 4. 添加注释说明
COMMENT ON COLUMN public.profiles.industry IS '用户自定义行业类型，支持自由输入';
