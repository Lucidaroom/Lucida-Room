import { NextResponse } from 'next/server';
import { currentUser, sbAdmin } from '@/lib/supabase';
import { normalizar } from '@/lib/imagem';
import { askJSON } from '@/lib/gemini';
import { ANALYSIS_PROMPT } from '@/lib/motor';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
  const db = sbAdmin();
  const fd = await req.formData();
  const file = fd.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Nenhuma foto enviada.' }, { status: 400 });

  const { data: prof } = await db.from('profiles').select('termo_aceito_em').eq('id', user.id).single();
  if (!prof?.termo_aceito_em) {
    if (fd.get('termo') !== '1') return NextResponse.json({ error: 'Confirme o termo de uso das imagens.' }, { status: 400 });
    await db.from('profiles').update({ termo_aceito_em: new Date().toISOString(), termo_versao: '1.0' }).eq('id', user.id);
  }

  let foto;
  try { foto = await normalizar(Buffer.from(await file.arrayBuffer())); }
  catch { return NextResponse.json({ error: 'Não conseguimos ler esse arquivo. Envie em JPG ou PNG (no iPhone: Ajustes › Câmera › Formatos › Mais compatível).' }, { status: 400 }); }

  let projectId = String(fd.get('project_id') || '');
  if (projectId === 'novo' || !projectId) {
    const { data, error } = await db.from('projects').insert({ user_id: user.id, name: String(fd.get('project_name') || 'Projeto') }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    projectId = data.id;
  }

  const path = `${user.id}/${crypto.randomUUID()}/original.jpg`;
  const up = await db.storage.from('fotos').upload(path, foto.buf, { contentType: 'image/jpeg' });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  // Se a análise falhar ou demorar, segue com uma análise vazia: o cliente
  // responde o questionário normalmente e a geração usa só as respostas.
  const vazia = { ambiente: 'Ambiente', inventario: [], materiais: [], texturas: [], cores_principais: [], ponto_neutro: 'o branco mais neutro da cena', ponto_neutro_tom: 'branco', removiveis: [{ nome: 'Pessoas', forma_posicao: 'qualquer pessoa visível' }], qualidade: { problema: null, dica: null } };
  let analysis: any = vazia;
  try { analysis = { ...vazia, ...(await askJSON(ANALYSIS_PROMPT, [foto.buf])) }; }
  catch (e: any) { console.error('[analisar] seguindo sem análise:', e.message); }

  const { data: ph, error } = await db.from('photos').insert({
    user_id: user.id, project_id: projectId, original_path: path, width: foto.width, height: foto.height, analysis, status: 'novo'
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: ph.id, project_id: projectId });
}
