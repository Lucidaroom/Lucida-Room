import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { currentUser, sbAdmin, isAdmin, signedUrl } from '@/lib/supabase';
import { editImage, nearestAspect } from '@/lib/gemini';
import { FINAL_4K_PROMPT } from '@/lib/motor';
import { recorte } from '@/lib/imagem';

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
  const db = sbAdmin();
  const { n } = await req.json();
  const { data: photo } = await db.from('photos').select('*').eq('id', params.id).eq('user_id', user.id).single();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  if (photo.is_trial && !isAdmin(user.email)) return NextResponse.json({ error: 'liberar' }, { status: 402 });
  if (photo.approved_version === n && photo.final_path) return NextResponse.json({ url: await signedUrl(photo.final_path) });

  const { data: v } = await db.from('versions').select('*').eq('photo_id', photo.id).eq('n', n).single();
  if (!v) return NextResponse.json({ error: 'Versão não encontrada.' }, { status: 404 });
  const base = Buffer.from(await (await db.storage.from('fotos').download(v.path)).data!.arrayBuffer());

  let final = base;
  try { final = await editImage(FINAL_4K_PROMPT, base, { size: '4K', aspect: nearestAspect(photo.width, photo.height) }); }
  catch { /* se o 4K falhar, entrega a versão aprovada como está */ }

  const amb = photo.service === 'ambientar';
  const nome = `foto-${photo.id.slice(0, 8)}-v${n}`;
  const zip = new JSZip();
  zip.file(`${nome}-original.jpg`, final);
  for (const f of (photo.answers?.formatos || []) as string[]) zip.file(`${nome}-${f.replace(':', 'x')}.jpg`, await recorte(final, f));
  const buf = await zip.generateAsync({ type: 'nodebuffer' });

  const final_path = photo.original_path.replace('original.jpg', `${nome}.zip`);
  await db.storage.from('fotos').upload(final_path, buf, { contentType: 'application/zip', upsert: true });
  await db.from('photos').update({ approved_version: n, final_path, status: 'aprovado' }).eq('id', photo.id);
  return NextResponse.json({ url: await signedUrl(final_path) });
}
