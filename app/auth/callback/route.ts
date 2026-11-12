import { NextResponse } from 'next/server';
import { sbUser } from '@/lib/supabase';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/painel';
  if (code) await sbUser().auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next.startsWith('/') ? next : '/painel', url.origin));
}
