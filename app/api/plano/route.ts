import { NextResponse } from 'next/server';
import { currentUser, sbAdmin } from '@/lib/supabase';
import { askJSON } from '@/lib/gemini';
import { interpretPrompt } from '@/lib/motor';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const limpo = (s: any, max = 400) => String(s || '').replace(/\s+/g, ' ').replace(/;/g, ',').trim().slice(0, max);

// Lê o texto livre do cliente olhando a foto e devolve ações concretas,
// para o cliente conferir antes de gastar uma geração. Não gera imagem e não cobra.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
  const db = sbAdmin();
  const body = await req.json().catch(() => ({}));
  const { data: photo } = await db.from('photos').select('id,original_path,analysis,service').eq('id', body.photo_id).eq('user_id', user.id).single();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });

  const t = { retirar: limpo(body.retirar), melhorar: limpo(body.melhorar), ajuste: limpo(body.ajuste) };
  const svc = body.svc === 'ambientar' || photo.service === 'ambientar' ? 'ambientar' : 'revelar';
  if (!t.retirar && !t.melhorar && !t.ajuste) return NextResponse.json({ acoes: [] });

  // Se a leitura falhar, o pedido segue como foi escrito.
  const bruto = [
    t.retirar ? { acao: `retirar por completo, sem sombra e sem marca remanescente: ${t.retirar}`, resumo: `Tirar: ${t.retirar}`, tipo: 'retirar' } : null,
    t.melhorar ? { acao: `arrumar ou melhorar, usando só o que já existe: ${t.melhorar}`, resumo: `Arrumar: ${t.melhorar}`, tipo: 'arrumar' } : null,
    t.ajuste ? { acao: t.ajuste, resumo: t.ajuste, tipo: 'outro' } : null
  ].filter(Boolean);

  try {
    const orig = Buffer.from(await (await db.storage.from('fotos').download(photo.original_path)).data!.arrayBuffer());
    const j = await askJSON(interpretPrompt(photo.analysis || {}, svc, t), [orig]);
    const acoes = (Array.isArray(j?.acoes) ? j.acoes : []).filter((x: any) => x && x.acao).slice(0, 8).map((x: any) => ({
      acao: limpo(x.acao), resumo: limpo(x.resumo || x.acao, 200), tipo: ['retirar', 'arrumar', 'outro'].includes(x.tipo) ? x.tipo : 'outro',
      fora: x.fora === true, motivo: x.motivo ? limpo(x.motivo, 200) : null, duvida: x.duvida ? limpo(x.duvida, 200) : null
    }));
    if (!acoes.length) return NextResponse.json({ acoes: bruto, bruto: true });
    return NextResponse.json({ acoes });
  } catch (e: any) {
    console.error('[plano] seguindo com o texto como foi escrito:', e.message);
    return NextResponse.json({ acoes: bruto, bruto: true });
  }
}
