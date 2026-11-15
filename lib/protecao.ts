import sharp from 'sharp';

// Composição protegida: onde a cena NÃO deveria mudar, a textura (alta frequência) e a cor
// (crominância) voltam da foto de referência; da saída da IA fica só a luz em baixa frequência.
// Onde houve mudança de verdade (objeto retirado, item novo, superfície trocada), fica a saída da IA.
// Resultado: nitidez igual à original e sem deriva de cor entre versões, para qualquer foto.

type Opts = { travarCor?: boolean };

const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

async function rgb(buf: Buffer, w: number, h: number, blur?: number) {
  let p = sharp(buf).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).removeAlpha().toColourspace('srgb');
  if (blur) p = p.blur(blur);
  return (await p.raw().toBuffer());
}

export async function protegerComposicao(saida: Buffer, referencia: Buffer, opts: Opts = {}): Promise<{ buf: Buffer; protegido: number }> {
  const meta = await sharp(saida).metadata();
  const W = meta.width!, H = meta.height!;
  const rm = await sharp(referencia).metadata();
  // proporção diferente = o modelo mudou o enquadramento; não há como alinhar, não mexe
  if (Math.abs(W / H - rm.width! / rm.height!) > 0.02) return { buf: saida, protegido: 0 };

  const [O, R, Ob, Rb, Ob2, Rb2] = await Promise.all([
    rgb(saida, W, H), rgb(referencia, W, H),
    rgb(saida, W, H, 4), rgb(referencia, W, H, 4),     // baixa frequência (luz)
    rgb(saida, W, H, 1.2), rgb(referencia, W, H, 1.2)  // para detectar mudança de estrutura
  ]);
  const N = W * H;
  const Y = (b: Buffer, i: number) => 0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2];

  // ajuste global de luminância (a IA clareia a foto inteira de propósito): só para medir mudança
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let k = 0; k < N; k += 7) { const i = k * 3; const x = Y(Rb, i), y = Y(Ob, i); sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const m = Math.ceil(N / 7); const g = (m * sxy - sx * sy) / Math.max(1e-6, m * sxx - sx * sx); const o = (sy - g * sx) / m;

  // máscara de mudança: 255 = mudou (fica a IA), 0 = protegido (volta textura e cor da referência)
  const mask = Buffer.alloc(N);
  for (let k = 0; k < N; k++) {
    const i = k * 3;
    const dy = Math.abs(Y(Ob2, i) - (g * Y(Rb2, i) + o));
    const dc = Math.abs((Ob[i] - Ob[i + 2]) - (Rb[i] - Rb[i + 2])) + Math.abs((Ob[i + 1] - Ob[i]) - (Rb[i + 1] - Rb[i]));
    mask[k] = Math.round(255 * Math.max(ss(14, 34, dy), ss(40, 80, dc)));
  }
  // espalha a máscara (o limiar baixo funciona como dilatação) e suaviza a borda para não deixar costura
  const M = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(6).extractChannel(0).raw().toBuffer();

  const out = Buffer.alloc(N * 3);
  let prot = 0;
  for (let k = 0; k < N; k++) {
    const i = k * 3, a = M[k] / 255; prot += 1 - a;
    // luminância: luz da IA (baixa frequência) + textura da referência (alta frequência)
    const yo = Y(O, i), ylow = Y(Ob, i), yref = Y(R, i), yrefLow = Y(Rb, i);
    const yP = ylow + (yref - yrefLow) * (yrefLow > 1 ? Math.min(2, ylow / yrefLow) : 1);
    // cor: da referência (travada) ou da IA (quando o cliente pediu luz mais quente/fria)
    const src = opts.travarCor === false ? O : R;
    const ys = Y(src, i);
    for (let c = 0; c < 3; c++) {
      const prot = yP + (src[i + c] - ys);
      out[i + c] = Math.max(0, Math.min(255, Math.round(a * O[i + c] + (1 - a) * prot)));
    }
    void yo;
  }
  const buf = await sharp(out, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
  return { buf, protegido: prot / N };
}
