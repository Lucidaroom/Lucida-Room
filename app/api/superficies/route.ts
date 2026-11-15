import { NextResponse } from 'next/server';
import { currentUser, sbAdmin } from '@/lib/supabase';
import { askJSON } from '@/lib/gemini';
import { SURFACE_PROMPT, lerSuperficies } from '@/lib/acabamentos';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// Lê as superfícies da foto e propõe as opções de troca de cor/material.
// O cliente não manda foto de referência: é a plataforma que sugere.
// Roda sob demanda (só quando o serviço "Trocar acabamentos" é escolhido) e
// fica guardada em photos.analysis.superficies — a segunda chamada não gasta nada.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
  const db = sbAdmin();
  const body = await req.json().catch(() => ({}));
  const { data: photo } = await db.from('photos').select('id,original_path,analysis').eq('id', body.photo_id).eq('user_id', user.id).single();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });

  const cache = photo.analysis?.superficies;
  if (Array.isArray(cache) && cache.length && !body.refazer) return NextResponse.json({ superficies: cache, cache: true });

  try {
    const orig = Buffer.from(await (await db.storage.from('fotos').download(photo.original_path)).data!.arrayBuffer());
    const superficies = lerSuperficies(await askJSON(SURFACE_PROMPT, [orig]));
    if (!superficies.length) return NextResponse.json({ superficies: [], erro: 'Não conseguimos identificar superfícies nesta foto. Você pode descrever a troca com as suas palavras.' });
    await db.from('photos').update({ analysis: { ...(photo.analysis || {}), superficies } }).eq('id', photo.id);
    return NextResponse.json({ superficies });
  } catch (e: any) {
    console.error('[superficies]', e.message);
    return NextResponse.json({ superficies: [], erro: 'A leitura das superfícies falhou. Tente de novo ou descreva a troca com as suas palavras.' });
  }
}
