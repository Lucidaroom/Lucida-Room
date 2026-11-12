import { NextResponse } from 'next/server';
import { currentUser, sbAdmin, isAdmin } from '@/lib/supabase';
import { editImage, nearestAspect } from '@/lib/gemini';
import { FINAL_4K_PROMPT } from '@/lib/motor';
import { recorte } from '@/lib/imagem';
import { aplicarGeometria } from '@/lib/geometria';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
const FMT_N: Record<string, string> = { '4:5': 'feed-4x5', '9:16': 'stories-9x16', '1:1': 'quadrado-1x1', '16:9': 'site-16x9' };

async function links(db: any, paths: { path: string; nome: string }[]) {
  return Promise.all(paths.map(async p => {
    const { data } = await db.storage.from('fotos').createSignedUrl(p.path, 3600, { download: p.nome });
    return { nome: p.nome, url: data?.signedUrl || '' };
  }));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
  const db = sbAdmin();
  const { n } = await req.json();
  const { data: photo } = await db.from('photos').select('*').eq('id', params.id).eq('user_id', user.id).single();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  if (photo.is_trial && !isAdmin(user.email)) return NextResponse.json({ error: 'liberar' }, { status: 402 });

  const dir = photo.original_path.replace('/original.jpg', '');
  const base = `foto-${photo.id.slice(0, 8)}-v${n}`;
  const formatos = (photo.answers?.formatos || []) as string[];
  const arquivos = [{ path: `${dir}/entrega-v${n}-original.jpg`, nome: `${base}.jpg` }, ...formatos.map(f => ({ path: `${dir}/entrega-v${n}-${FMT_N[f]}.jpg`, nome: `${base}-${FMT_N[f]}.jpg` }))];
  if (photo.approved_version === n) return NextResponse.json({ arquivos: await links(db, arquivos) });

  const { data: v } = await db.from('versions').select('*').eq('photo_id', photo.id).eq('n', n).single();
  if (!v) return NextResponse.json({ error: 'Versão não encontrada.' }, { status: 404 });
  const dl = async (p: string) => Buffer.from(await (await db.storage.from('fotos').download(p)).data!.arrayBuffer());

  // 4K sobre a versão bruta (enquadramento da original) e depois o mesmo prumo/recorte da versão
  let final = await dl(v.path);
  if (v.raw_path) {
    try {
      const raw4k = await editImage(FINAL_4K_PROMPT, await dl(v.raw_path), { size: '4K', aspect: nearestAspect(photo.width, photo.height) });
      const an = photo.analysis || {};
      final = await aplicarGeometria(raw4k, an.verticais || [], an.foco || null, v.geo || { verticais: false, recorte: 'auto', centralizar: false });
    } catch (e: any) { console.error('[4k]', e.message); }
  }
  await db.storage.from('fotos').upload(arquivos[0].path, final, { contentType: 'image/jpeg', upsert: true });
  for (let i = 0; i < formatos.length; i++)
    await db.storage.from('fotos').upload(arquivos[i + 1].path, await recorte(final, formatos[i]), { contentType: 'image/jpeg', upsert: true });
  await db.from('photos').update({ approved_version: n, final_path: arquivos[0].path, status: 'aprovado' }).eq('id', photo.id);
  return NextResponse.json({ arquivos: await links(db, arquivos) });
}
