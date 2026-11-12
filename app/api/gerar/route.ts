import { NextResponse } from 'next/server';
import { currentUser, sbAdmin, isAdmin } from '@/lib/supabase';
import { editImage, askJSON, nearestAspect } from '@/lib/gemini';
import { buildPrompt, checkPrompt, passed, type Answers } from '@/lib/motor';
import { marcaDagua } from '@/lib/imagem';
import { aplicarGeometria, marcadores, geoDe } from '@/lib/geometria';
import sharp from 'sharp';

export const maxDuration = 300;

// Recorte ampliado de um item da cena, usado como referência de aparência
// para o modelo não trocar a peça quando ela é movida ou alinhada.
async function recorte(buf: Buffer, caixa: [number, number, number, number]) {
  const m = await sharp(buf).metadata();
  const W = m.width || 0, H = m.height || 0;
  if (!W || !H) throw new Error('sem dimensões');
  const [x1, y1, x2, y2] = caixa;
  const folga = 0.04;
  const l = Math.max(0, Math.min(x1, x2) - folga), t = Math.max(0, Math.min(y1, y2) - folga);
  const r = Math.min(1, Math.max(x1, x2) + folga), b = Math.min(1, Math.max(y1, y2) + folga);
  const left = Math.round(l * W), top = Math.round(t * H);
  const width = Math.max(32, Math.round((r - l) * W)), height = Math.max(32, Math.round((b - t) * H));
  if (left + width > W || top + height > H) throw new Error('caixa fora da imagem');
  return sharp(buf).extract({ left, top, width, height }).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: false }).jpeg({ quality: 95 }).toBuffer();
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
  const db = sbAdmin();
  const body = await req.json();
  const { data: photo } = await db.from('photos').select('*').eq('id', body.photo_id).eq('user_id', user.id).single();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  const { data: prof } = await db.from('profiles').select('*').eq('id', user.id).single();
  const admin = isAdmin(user.email);
  const { data: prev } = await db.from('versions').select('n,adjustment').eq('photo_id', photo.id).order('n');
  const first = !prev?.length;

  // ——— cobrança ———
  let answers: Answers = photo.answers;
  let debit = { credits: 0, trial: 0 };
  if (first) {
    answers = body.answers;
    const cost = answers.svc === 'ambientar' ? 2 : 1;
    let isTrial = false;
    if (!admin) {
      if (prof.credits >= cost) debit.credits = cost;
      else if (prof.trial_left > 0) { debit.trial = 1; isTrial = true; }
      else return NextResponse.json({ error: 'sem_creditos' }, { status: 402 });
    }
    await db.from('photos').update({ answers, service: answers.svc, is_trial: isTrial, status: 'gerando' }).eq('id', photo.id);
  } else {
    if (!body.ajuste) return NextResponse.json({ error: 'Descreva o ajuste.' }, { status: 400 });
    const included = photo.service === 'ambientar' ? 2 : 1;
    if (!admin) {
      if (photo.is_trial) return NextResponse.json({ error: 'Ajustes ficam disponíveis depois de liberar a foto.' }, { status: 402 });
      if (photo.adjustments_used >= included) {
        if (prof.credits < 1) return NextResponse.json({ error: 'sem_creditos' }, { status: 402 });
        debit.credits = 1;
      }
    }
    await db.from('photos').update({ status: 'gerando', adjustments_used: photo.adjustments_used + 1 }).eq('id', photo.id);
  }
  if (debit.credits || debit.trial)
    await db.from('profiles').update({ credits: prof.credits - debit.credits, trial_left: prof.trial_left - debit.trial }).eq('id', user.id);

  const refund = async () => {
    if (debit.credits || debit.trial) {
      const { data: p } = await db.from('profiles').select('credits,trial_left').eq('id', user.id).single();
      await db.from('profiles').update({ credits: p!.credits + debit.credits, trial_left: p!.trial_left + debit.trial }).eq('id', user.id);
    }
    if (!first) await db.from('photos').update({ adjustments_used: photo.adjustments_used }).eq('id', photo.id);
  };

  // ——— geração: sempre a partir da original + briefing acumulado (regra 1) ———
  try {
    const orig = Buffer.from(await (await db.storage.from('fotos').download(photo.original_path)).data!.arrayBuffer());
    const ajustes = [...(prev || []).map(v => v.adjustment).filter(Boolean), body.ajuste].filter(Boolean).join('; ');
    const aspect = nearestAspect(photo.width, photo.height);
    const imgs: Buffer[] = [orig];
    const pos = answers.posicoes || {};
    const marc = (answers.adicionar || []).filter(i => pos[i]).map((i, k) => ({ n: k + 1, x: pos[i][0], y: pos[i][1] }));
    if (answers.svc === 'ambientar' && marc.length) imgs.push(await marcadores(orig, marc));

    // recortes de referência dos itens que serão movidos/alinhados
    const refs: string[] = [];
    for (const item of (photo.analysis?.arrumar || [])) {
      if (!item?.caixa || !(answers.arrumar || []).includes(item.nome)) continue;
      if (refs.length >= 4) break;
      try { imgs.push(await recorte(orig, item.caixa)); refs.push(item.nome); }
      catch (e: any) { console.error('[recorte]', item.nome, e.message); }
    }
    answers = { ...answers, refs };

    let best: { buf: Buffer; check: any } | null = null;
    let correcao: string | undefined;
    let prompt = '';
    for (let tentativa = 0; tentativa < 2; tentativa++) {        // 1 candidata + 1 corrigida se reprovar
      prompt = buildPrompt(photo.analysis, answers, ajustes || undefined, correcao);
      const out = await editImage(prompt, imgs, { size: '2K', aspect });
      let check: any = null;
      try { check = await askJSON(checkPrompt(photo.analysis, answers.svc), [orig, out]); } catch {}
      best = { buf: out, check };
      if (passed(check)) break;
      correcao = check?.ponto_fraco || undefined;
    }
    // prumo e recorte por código, sobre a saída da IA (mesmo enquadramento da original)
    const geo = body.geo && typeof body.geo === 'object' ? body.geo : geoDe(answers.enq);
    const an = photo.analysis || {};
    let final = best!.buf;
    try { final = await aplicarGeometria(best!.buf, an.verticais || [], an.foco || null, geo); } catch (e: any) { console.error('[geometria]', e.message); }
    const n = (prev?.length || 0) + 1;
    const dir = photo.original_path.replace('/original.jpg', '');
    const path = `${dir}/v${n}.jpg`, raw_path = `${dir}/v${n}-bruta.jpg`;
    await db.storage.from('fotos').upload(raw_path, best!.buf, { contentType: 'image/jpeg', upsert: true });
    await db.storage.from('fotos').upload(path, final, { contentType: 'image/jpeg', upsert: true });
    let view_path = null;
    if (photo.is_trial || (first && debit.trial)) {
      view_path = `${dir}/v${n}-previa.jpg`;
      await db.storage.from('fotos').upload(view_path, await marcaDagua(final), { contentType: 'image/jpeg', upsert: true });
    }
    await db.from('versions').insert({ photo_id: photo.id, n, path, raw_path, geo, view_path, prompt, check_result: best!.check, adjustment: body.ajuste || null });
    await db.from('photos').update({ status: 'pronto' }).eq('id', photo.id);
    return NextResponse.json({ ok: true, n, passed: passed(best!.check), ponto: best!.check?.ponto_fraco || null });
  } catch (e: any) {
    await refund();
    await db.from('photos').update({ status: first ? 'erro' : 'pronto' }).eq('id', photo.id);
    return NextResponse.json({ error: 'Não conseguimos gerar esta foto. Os créditos voltaram para o seu saldo. (' + e.message + ')' }, { status: 502 });
  }
}
