// Chamadas diretas à API do Gemini (sem SDK).
import sharp from 'sharp';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const MODEL_IMAGE = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'; // Nano Banana Pro
export const MODEL_TEXT = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';           // análise e checagem

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

const TEXT_MODELS = [MODEL_TEXT, 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function once(model: string, body: any, ms: number) {
  const r = await fetch(`${BASE}/${model}:generateContent`, {
    signal: AbortSignal.timeout(ms),
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e: any = new Error(j?.error?.message || `Gemini ${r.status}`); e.status = r.status; throw e; }
  return j;
}

// Tenta de novo quando o Google está sobrecarregado (429/500/503) e,
// se o modelo não existir ou continuar indisponível, passa para o próximo da lista.
// budget = tempo máximo total (ms) somando todas as tentativas.
async function call(models: string | string[], body: any, budget = 60000, perTry = 30000) {
  const list = Array.from(new Set(Array.isArray(models) ? models : [models]));
  const end = Date.now() + budget;
  let last: any;
  for (const m of list) {
    for (let t = 0; t < 2; t++) {
      const left = end - Date.now();
      if (left < 3000) throw last || new Error('A IA demorou demais para responder.');
      try { return await once(m, body, Math.min(perTry, left)); }
      catch (e: any) {
        last = e;
        console.error('[gemini]', m, e.status || e.name, e.message);
        if (e.status === 404 || e.status === 400) break;               // modelo inexistente: próximo
        if ([429, 500, 503].includes(e.status)) { await sleep(1500); continue; }
        if (e.name === 'TimeoutError') break;                           // lento: tenta o próximo modelo
        throw e;
      }
    }
  }
  throw last;
}

const img = (buf: Buffer, mime = 'image/jpeg'): Part => ({ inlineData: { mimeType: mime, data: buf.toString('base64') } });

// imagem reduzida para a análise: mais rápida e suficiente para ler a cena
const reduz = (b: Buffer) => sharp(b).resize({ width: 1280, height: 1280, fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();

export async function askJSON(prompt: string, images: Buffer[]) {
  const small = await Promise.all(images.map(reduz));
  const j = await call(TEXT_MODELS, {
    contents: [{ role: 'user', parts: [...small.map(b => img(b)), { text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
  }, 95000, 55000);
  const txt = j.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '{}';
  return JSON.parse(txt);
}

export async function editImage(prompt: string, base: Buffer | Buffer[], opts: { size: '2K' | '4K'; aspect?: string }) {
  const j = await call(MODEL_IMAGE, {
    contents: [{ role: 'user', parts: [...(Array.isArray(base) ? base : [base]).map(b => img(b)), { text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { imageSize: opts.size, ...(opts.aspect ? { aspectRatio: opts.aspect } : {}) }
    }
  }, 150000, 120000);
  const part = j.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
  if (!part) throw new Error('A IA não devolveu imagem. ' + (j.candidates?.[0]?.finishReason || ''));
  return Buffer.from(part.inlineData.data, 'base64');
}

// proporção suportada mais próxima da foto
export function nearestAspect(w: number, h: number) {
  const opts = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
  const r = w / h;
  const val = (o: string) => { const [a, b] = o.split(':').map(Number); return a / b; };
  return opts.reduce((best, o) => (Math.abs(val(o) - r) < Math.abs(val(best) - r) ? o : best), '1:1');
}
