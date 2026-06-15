/**
 * 认证 API 路由
 * POST /api/auth — 注册 / 登录
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, full_name } = await request.json();
    const supabase = await createClient();

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: full_name || email },
        },
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: '注册成功！请查收验证邮件（如未收到可忽略，系统会自动创建账号）',
        user: data.user,
      });
    }

    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 401 });
      }

      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === 'signout') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('[Auth API] 错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
