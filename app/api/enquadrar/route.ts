import { NextResponse } from 'next/server';
import { currentUser, sbAdmin } from '@/lib/supabase';
import { aplicarGeometria, type Geo } from '@/lib/geometria';
import { marcaDagua } from '@/lib/imagem';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Ajuste de prumo/recorte: refeito por código sobre a versão bruta, sem IA e sem custo.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
  const db = sbAdmin();
  const { photo_id, n, geo } = await req.json() as { photo_id: string; n: number; geo: Geo };
  const { data: photo } = await db.from('photos').select('*').eq('id', photo_id).eq('user_id', user.id).single();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  const { data: vs } = await db.from('versions').select('*').eq('photo_id', photo.id).order('n');
  const base = (vs || []).find(v => v.n === n) || (vs || [])[vs!.length - 1];
  if (!base?.raw_path) return NextResponse.json({ error: 'Esta versão não permite reenquadrar. Gere uma nova versão.' }, { status: 400 });
  const raw = Buffer.from(await (await db.storage.from('fotos').download(base.raw_path)).data!.arrayBuffer());
  const an = photo.analysis || {};
  const final = await aplicarGeometria(raw, an.verticais || [], an.foco || null, geo);
  const nn = vs!.length + 1;
  const dir = photo.original_path.replace('/original.jpg', '');
  const path = `${dir}/v${nn}.jpg`;
  await db.storage.from('fotos').upload(path, final, { contentType: 'image/jpeg', upsert: true });
  let view_path = null;
  if (photo.is_trial) { view_path = `${dir}/v${nn}-previa.jpg`; await db.storage.from('fotos').upload(view_path, await marcaDagua(final), { contentType: 'image/jpeg', upsert: true }); }
  await db.from('versions').insert({ photo_id: photo.id, n: nn, path, raw_path: base.raw_path, geo, view_path, prompt: base.prompt, check_result: base.check_result, adjustment: null });
  return NextResponse.json({ ok: true, n: nn });
}
