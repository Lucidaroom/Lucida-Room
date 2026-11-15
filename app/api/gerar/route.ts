import { protegerComposicao } from '@/lib/protecao';
import { NextResponse } from 'next/server';
import { currentUser, sbAdmin, isAdmin } from '@/lib/supabase';
import { editImage, askJSON, nearestAspect } from '@/lib/gemini';
import { buildPrompt, checkPrompt, passed, falhas, naoFeitos, type Answers } from '@/lib/motor';
import { listaPedidos } from '@/lib/plano';
import { buildSwapPrompt, swapCheckPrompt, trocasEscolhidas, falhasTroca, trocaPassed, trocasNaoFeitas, resumoTroca } from '@/lib/acabamentos';
import { marcaDagua } from '@/lib/imagem';
import { aplicarGeometria, marcadores, geoDe } from '@/lib/geometria';
import sharp from 'sharp';

export const maxDuration = 300;

// Preço em créditos, igual ao que está publicado em /precos.
const CUSTO: Record<string, number> = { revelar: 2, ambientar: 4, acabamentos: 6 };
const AJUSTES_INCLUSOS: Record<string, number> = { revelar: 1, ambientar: 2, acabamentos: 2 };
// Ajuste de acabamento é guardado na mesma coluna do ajuste comum, nesta linha separada.
const SEP_ACAB = '\n[acab] ';

const servico = (s: any) => (s === 'ambientar' || s === 'acabamentos' ? s : 'revelar');

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

  let answers: Answers = first ? body.answers : photo.answers;
  const svc = servico(first ? answers?.svc : photo.service);
  const acab = svc === 'acabamentos';

  // ——— troca de acabamentos: a superfície e a opção vêm da lista, antes de cobrar ———
  const trocas = acab ? trocasEscolhidas(photo.analysis?.superficies || [], answers?.acabamentos || []) : [];
  if (acab && !trocas.length)
    return NextResponse.json({ error: 'Marque pelo menos uma superfície e escolha a opção de cor ou material.' }, { status: 400 });

  // ——— cobrança ———
  let debit = { credits: 0, trial: 0 };
  if (first) {
    const cost = CUSTO[svc];
    let isTrial = false;
    if (!admin) {
      if (prof.credits >= cost) debit.credits = cost;
      else if (prof.trial_left > 0) { debit.trial = 1; isTrial = true; }
      else return NextResponse.json({ error: 'sem_creditos' }, { status: 402 });
    }
    await db.from('photos').update({ answers, service: svc, is_trial: isTrial, status: 'gerando' }).eq('id', photo.id);
  } else {
    if (!body.ajuste && !body.ajuste_acab) return NextResponse.json({ error: 'Descreva o ajuste.' }, { status: 400 });
    const included = AJUSTES_INCLUSOS[svc] ?? 1;
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
  const t0 = Date.now();
  const passados = (ms: number) => Date.now() - t0 > ms;
  try {
    const orig = Buffer.from(await (await db.storage.from('fotos').download(photo.original_path)).data!.arrayBuffer());
    // o ajuste de acabamento viaja na mesma coluna, em linha própria, e é separado aqui
    const estaVez = [body.ajuste || '', body.ajuste_acab ? SEP_ACAB.trimStart() + body.ajuste_acab : ''].filter(Boolean).join('\n');
    const partes = [...(prev || []).map(v => v.adjustment).filter(Boolean), estaVez || null].filter(Boolean)
      .flatMap((t: string) => t.split('\n').map(l => l.trim()).filter(Boolean));
    const ajustes = partes.filter(l => !l.startsWith('[acab]')).join('; ');
    const ajustesAcab = partes.filter(l => l.startsWith('[acab]')).map(l => l.replace('[acab]', '').trim()).join('; ');

    const aspect = nearestAspect(photo.width, photo.height);
    // a base do "Trocar acabamentos" é o Revelar: o passe de troca vem depois, isolado
    let answersBase: Answers = { ...answers, svc: svc === 'ambientar' ? 'ambientar' : 'revelar' };
    const imgs: Buffer[] = [orig];
    const pos = answersBase.posicoes || {};
    const marc = (answersBase.adicionar || []).filter(i => pos[i]).map((i, k) => ({ n: k + 1, x: pos[i][0], y: pos[i][1] }));
    if (answersBase.svc === 'ambientar' && marc.length) imgs.push(await marcadores(orig, marc));

    // recortes de referência dos itens que serão movidos/alinhados
    const refs: string[] = [];
    for (const item of (photo.analysis?.arrumar || [])) {
      if (!item?.caixa || !(answersBase.arrumar || []).includes(item.nome)) continue;
      if (refs.length >= 4) break;
      try { imgs.push(await recorte(orig, item.caixa)); refs.push(item.nome); }
      catch (e: any) { console.error('[recorte]', item.nome, e.message); }
    }
    answersBase = { ...answersBase, refs };

    // a mesma lista numerada vai para o prompt e para a checagem
    const pedidos = listaPedidos(photo.analysis, answersBase, ajustes || undefined);
    let best: { buf: Buffer; check: any } | null = null;
    let correcao: string | undefined;
    let prompt = '', promptBest = '';
    // com troca de acabamentos são duas gerações numa requisição: a base vai de uma tentativa
    const tentativasBase = acab ? 1 : 2;
    for (let tentativa = 0; tentativa < tentativasBase; tentativa++) {   // 1 candidata + 1 corrigida se reprovar
      if (tentativa && passados(110000)) break;
      prompt = buildPrompt(photo.analysis, answersBase, ajustes || undefined, correcao);
      const out = await editImage(prompt, imgs, { size: '2K', aspect, ...(acab ? { budget: 110000, perTry: 100000 } : {}) });
      let check: any = null;
      try { check = await askJSON(checkPrompt(photo.analysis, answersBase.svc, pedidos.map(p => p.texto)), [orig, out], acab ? 45000 : 95000, acab ? 40000 : 55000); } catch {}
      // fica a melhor das duas tentativas, não necessariamente a última
      if (!best || falhas(check) <= falhas(best.check)) { best = { buf: out, check }; promptBest = prompt; }
      if (passed(check)) break;
      const faltou = naoFeitos(check).map(n => pedidos[n - 1] ? `P${n} (${pedidos[n - 1].texto})` : '').filter(Boolean);
      correcao = [check?.ponto_fraco, faltou.length ? `pedidos que não foram executados: ${faltou.join('; ')}` : ''].filter(Boolean).join('. ') || undefined;
    }
    prompt = promptBest || prompt;
    const check: any = { ...(best!.check || {}) };
    // guarda, junto da checagem, o texto dos pedidos que não saíram — a tela avisa o cliente
    check.pedidos_pendentes = naoFeitos(check).map(n => pedidos[n - 1]?.cliente).filter(Boolean);

    const n = (prev?.length || 0) + 1;
    const dir = photo.original_path.replace('/original.jpg', '');

    // ——— passe isolado de troca de acabamento, sobre a saída do Revelar ———
    // composição protegida: textura e cor voltam da original onde a cena não deveria mudar
    const travarCor = !/quente|fria|warm|cool/i.test(`${ajustes} ${answersBase.luz || ''}`);
    try {
      const p = await protegerComposicao(best!.buf, orig, { travarCor });
      best = { ...best!, buf: p.buf }; check.protegido = Math.round(p.protegido * 100);
    } catch (e: any) { console.error('[protecao]', e.message); }
    let bruta = best!.buf;
    if (acab) {
      const base_path = `${dir}/v${n}-base.jpg`;
      await db.storage.from('fotos').upload(base_path, best!.buf, { contentType: 'image/jpeg', upsert: true });
      let bestT: { buf: Buffer; check: any } | null = null;
      let corrT: string | undefined, promptT = '', promptTBest = '';
      for (let t = 0; t < 2; t++) {
        if (t && passados(215000)) break;
        promptT = buildSwapPrompt(photo.analysis, trocas, corrT, ajustesAcab || undefined);
        const out = await editImage(promptT, bruta, { size: '2K', aspect, budget: 100000, perTry: 95000 });
        let c: any = null;
        try { c = await askJSON(swapCheckPrompt(trocas), [bruta, out], 40000, 35000); } catch {}
        if (!bestT || falhasTroca(c) <= falhasTroca(bestT.check)) { bestT = { buf: out, check: c }; promptTBest = promptT; }
        if (trocaPassed(c)) break;
        const faltou = trocasNaoFeitas(c).map(i => trocas[i - 1] ? resumoTroca(trocas[i - 1]) : '').filter(Boolean);
        corrT = [c?.ponto_fraco, faltou.length ? `trocas que não foram aplicadas: ${faltou.join('; ')}` : ''].filter(Boolean).join('. ') || undefined;
      }
      try { bruta = (await protegerComposicao(bestT!.buf, bruta, { travarCor: true })).buf; }
      catch (e: any) { console.error('[protecao-troca]', e.message); bruta = bestT!.buf; }
      prompt = `${prompt}\n\n=== PASSE DE TROCA DE ACABAMENTOS ===\n${promptTBest || promptT}`;
      check.troca = bestT!.check;
      check.base_path = base_path;
      check.trocas = trocas.map(resumoTroca);
      // o aviso na tela usa a mesma lista de pendências dos pedidos
      check.pedidos_pendentes = [...check.pedidos_pendentes, ...trocasNaoFeitas(bestT!.check).map(i => trocas[i - 1] ? resumoTroca(trocas[i - 1]) : '').filter(Boolean)];
      const ct = bestT!.check || {};
      if (ct.menos_nitida) check.menos_nitida = true;
      if (ct.enquadramento_alterado) check.enquadramento_alterado = true;
      if (ct.objeto_alterado) check.modelo_trocado = true;
      if (ct.vazou || ct.geometria_alterada) check.arquitetura_alterada = true;
      if (ct.ponto_fraco) check.ponto_fraco = ct.ponto_fraco;
    }

    // prumo e recorte por código, sobre a saída da IA (mesmo enquadramento da original)
    const geo = body.geo && typeof body.geo === 'object' ? body.geo : geoDe(answersBase.enq);
    const an = photo.analysis || {};
    let final = bruta;
    try { final = await aplicarGeometria(bruta, an.verticais || [], an.foco || null, geo); } catch (e: any) { console.error('[geometria]', e.message); }
    const path = `${dir}/v${n}.jpg`, raw_path = `${dir}/v${n}-bruta.jpg`;
    await db.storage.from('fotos').upload(raw_path, bruta, { contentType: 'image/jpeg', upsert: true });
    await db.storage.from('fotos').upload(path, final, { contentType: 'image/jpeg', upsert: true });
    let view_path = null;
    if (photo.is_trial || (first && debit.trial)) {
      view_path = `${dir}/v${n}-previa.jpg`;
      await db.storage.from('fotos').upload(view_path, await marcaDagua(final), { contentType: 'image/jpeg', upsert: true });
    }
    await db.from('versions').insert({ photo_id: photo.id, n, path, raw_path, geo, view_path, prompt, check_result: check, adjustment: estaVez || null });
    await db.from('photos').update({ status: 'pronto' }).eq('id', photo.id);
    const ok = passed(best!.check) && (!acab || trocaPassed(check.troca));
    return NextResponse.json({ ok: true, n, passed: ok, ponto: check.ponto_fraco || null });
  } catch (e: any) {
    await refund();
    await db.from('photos').update({ status: first ? 'erro' : 'pronto' }).eq('id', photo.id);
    console.error('[gerar]', e.message);
    const cota = /prepay|quota|billing|exhausted|429|RESOURCE_EXHAUSTED/i.test(e.message || '');
    return NextResponse.json({ error: cota ? 'O serviço de geração está temporariamente indisponível. Os créditos voltaram para o seu saldo; tente de novo em alguns minutos.' : 'Não conseguimos gerar esta foto. Os créditos voltaram para o seu saldo.' }, { status: 502 });
  }
}
