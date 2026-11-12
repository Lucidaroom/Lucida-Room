// Chamadas diretas à API do Gemini (sem SDK).
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const MODEL_IMAGE = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'; // Nano Banana Pro
export const MODEL_TEXT = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';           // análise e checagem

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

const TEXT_MODELS = [MODEL_TEXT, 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function once(model: string, body: any) {
  const r = await fetch(`${BASE}/${model}:generateContent`, {
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
async function call(models: string | string[], body: any) {
  const list = Array.from(new Set(Array.isArray(models) ? models : [models]));
  let last: any;
  for (const m of list) {
    for (let t = 0; t < 3; t++) {
      try { return await once(m, body); }
      catch (e: any) {
        last = e;
        if (e.status === 404 || e.status === 400) break;               // modelo inexistente: próximo
        if ([429, 500, 503].includes(e.status)) { await sleep(1500 * (t + 1)); continue; }
        throw e;
      }
    }
  }
  throw last;
}

const img = (buf: Buffer, mime = 'image/jpeg'): Part => ({ inlineData: { mimeType: mime, data: buf.toString('base64') } });

export async function askJSON(prompt: string, images: Buffer[]) {
  const j = await call(TEXT_MODELS, {
    contents: [{ role: 'user', parts: [...images.map(b => img(b)), { text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
  });
  const txt = j.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '{}';
  return JSON.parse(txt);
}

export async function editImage(prompt: string, base: Buffer, opts: { size: '2K' | '4K'; aspect?: string }) {
  const j = await call(MODEL_IMAGE, {
    contents: [{ role: 'user', parts: [img(base), { text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { imageSize: opts.size, ...(opts.aspect ? { aspectRatio: opts.aspect } : {}) }
    }
  });
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
