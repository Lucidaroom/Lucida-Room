// Correção de prumo e enquadramento feita por código (sem IA), para a geometria
// sair exata: as arestas verticais apontadas na análise viram verticais de verdade,
// depois a imagem é recortada para tirar as bordas vazias. Nunca completa bordas.
import sharp from 'sharp';

export type Linha = [number, number, number, number]; // x1,y1,x2,y2 normalizados 0–1
export type Geo = { verticais: boolean; recorte: 'auto' | 'justo'; centralizar: boolean };
export const geoDe = (enq: string): Geo => ({ verticais: enq !== 'manter', recorte: enq === 'justo' ? 'justo' : 'auto', centralizar: enq === 'centralizar' });

type P = [number, number];

// Resolve a homografia que leva src[i] -> dst[i] (4 pontos).
function homografia(src: P[], dst: P[]) {
  const A: number[][] = [], b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  // eliminação de Gauss
  const n = 8;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < n; r++) if (r !== c) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const h = b.map((v, i) => v / A[i][i]);
  return [...h, 1];
}
const aplica = (H: number[], x: number, y: number): P => {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
};
const xNa = (l: Linha, y: number) => {
  const [x1, y1, x2, y2] = l;
  return Math.abs(y2 - y1) < 1e-6 ? x1 : x1 + (x2 - x1) * (y - y1) / (y2 - y1);
};

// Escolhe a aresta mais à esquerda e a mais à direita e monta a correção.
function planejar(linhas: Linha[]) {
  const boas = (linhas || []).filter(l => Array.isArray(l) && l.length === 4 && Math.abs(l[3] - l[1]) > 0.15);
  if (boas.length < 2) return null;
  boas.sort((a, b) => xNa(a, 0.5) - xNa(b, 0.5));
  const L = boas[0], R = boas[boas.length - 1];
  const xl = xNa(L, 0.5), xr = xNa(R, 0.5);
  if (xr - xl < 0.2) return null;
  const src: P[] = [[xNa(L, 0), 0], [xNa(L, 1), 1], [xNa(R, 0), 0], [xNa(R, 1), 1]];
  const dst: P[] = [[xl, 0], [xl, 1], [xr, 0], [xr, 1]];
  // correção exagerada indica linha mal detectada: não mexe
  if (src.some((s, i) => Math.abs(s[0] - dst[i][0]) > 0.3)) return null;
  return { fwd: homografia(src, dst), inv: homografia(dst, src) };
}

// Detecta por código a inclinação das arestas verticais (bordas de móveis, batentes,
// quinas): para cada pixel de borda quase vertical mede o desvio, e ajusta
// desvio = a + b·x (a = giro da câmera, b = câmera apontada para cima/baixo).
// Devolve duas linhas sintéticas (esquerda e direita) para a correção.
export async function detectarVerticais(buf: Buffer): Promise<Linha[] | null> {
  const { data, info } = await sharp(buf).greyscale().resize({ width: 800 }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const xs: number[] = [], ph: number[] = [], ws: number[] = [];
  for (let y = 2; y < H - 2; y += 1) for (let x = 2; x < W - 2; x += 1) {
    const i = y * W + x;
    const gx = -data[i - W - 1] - 2 * data[i - 1] - data[i + W - 1] + data[i - W + 1] + 2 * data[i + 1] + data[i + W + 1];
    const gy = -data[i - W - 1] - 2 * data[i - W] - data[i - W + 1] + data[i + W - 1] + 2 * data[i + W] + data[i + W + 1];
    const m = Math.hypot(gx, gy);
    if (m < 120 || Math.abs(gx) < 3 * Math.abs(gy)) continue;       // só bordas quase verticais e fortes
    const phi = Math.atan(gy / gx);                                   // desvio da vertical (rad)
    if (Math.abs(phi) > 0.26) continue;                               // até ~15°
    xs.push(x / W - 0.5); ph.push(phi); ws.push(m);
  }
  if (xs.length < 400) return null;
  let a = 0, b = 0;
  for (let it = 0; it < 4; it++) {                                    // regressão ponderada com corte de outliers
    let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
    for (let k = 0; k < xs.length; k++) {
      const r = ph[k] - (a + b * xs[k]);
      if (it > 0 && Math.abs(r) > 0.05) continue;
      const w = ws[k];
      S += w; Sx += w * xs[k]; Sy += w * ph[k]; Sxx += w * xs[k] * xs[k]; Sxy += w * xs[k] * ph[k];
    }
    const den = S * Sxx - Sx * Sx;
    if (S === 0 || Math.abs(den) < 1e-9) return null;
    b = (S * Sxy - Sx * Sy) / den; a = (Sy - b * Sx) / S;
  }
  const ar = H / W;
  const linha = (xn: number): Linha => {
    const t = Math.tan(a + b * (xn - 0.5));
    return [xn + t * 0.5 * ar, 0, xn - t * 0.5 * ar, 1];
  };
  return [linha(0.1), linha(0.9)];
}

export async function aplicarGeometria(buf: Buffer, linhasIA: Linha[], foco: number[] | null, geo: Geo) {
  let linhas = linhasIA;
  if (geo.verticais) { try { linhas = (await detectarVerticais(buf)) || linhasIA; } catch {} }
  const img = sharp(buf).removeAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  let out: Buffer = data;
  // retângulo útil em coordenadas normalizadas
  let box = { l: 0, t: 0, r: 1, b: 1 };

  const plano = geo.verticais ? planejar(linhas) : null;
  if (plano) {
    out = Buffer.alloc(W * H * C);
    const inv = plano.inv;
    for (let y = 0; y < H; y++) {
      const ny = (y + 0.5) / H;
      for (let x = 0; x < W; x++) {
        const [sx, sy] = aplica(inv, (x + 0.5) / W, ny);
        const fx = sx * W - 0.5, fy = sy * H - 0.5;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) continue;
        const ax = fx - x0, ay = fy - y0, o = (y * W + x) * C;
        const i00 = (y0 * W + x0) * C, i10 = i00 + C, i01 = i00 + W * C, i11 = i01 + C;
        for (let c = 0; c < C; c++)
          out[o + c] = (data[i00 + c] * (1 - ax) + data[i10 + c] * ax) * (1 - ay) + (data[i01 + c] * (1 - ax) + data[i11 + c] * ax) * ay;
      }
    }
    const [tl, tr, bl, br] = ([[0, 0], [1, 0], [0, 1], [1, 1]] as P[]).map(p => aplica(plano.fwd, p[0], p[1]));
    box = { l: Math.max(0, tl[0], bl[0]), r: Math.min(1, tr[0], br[0]), t: Math.max(0, tl[1], tr[1]), b: Math.min(1, bl[1], br[1]) };
    const m = 0.005; box = { l: box.l + m, r: box.r - m, t: box.t + m, b: box.b - m };
  }
  if (geo.recorte === 'justo') {
    const dx = (box.r - box.l) * 0.06, dy = (box.b - box.t) * 0.06;
    box = { l: box.l + dx, r: box.r - dx, t: box.t + dy, b: box.b - dy };
  }
  if (geo.centralizar && foco && foco.length === 4) {
    // move o recorte para o centro do elemento principal, sem sair da área útil
    const cx = (foco[0] + foco[2]) / 2, w = (box.r - box.l) * 0.85, h = (box.b - box.t) * 0.85;
    const cy = (box.t + box.b) / 2;
    let l = Math.min(Math.max(cx - w / 2, box.l), box.r - w);
    box = { l, r: l + w, t: Math.max(box.t, cy - h / 2), b: Math.min(box.b, cy + h / 2) };
  }
  const left = Math.round(box.l * W), top = Math.round(box.t * H);
  const width = Math.round((box.r - box.l) * W), height = Math.round((box.b - box.t) * H);
  return sharp(out, { raw: { width: W, height: H, channels: C as 3 } })
    .extract({ left, top, width: Math.max(10, width), height: Math.max(10, height) })
    .jpeg({ quality: 95 }).toBuffer();
}

// Imagem de referência com os pontos onde o cliente quer cada item novo.
export async function marcadores(buf: Buffer, pontos: { n: number; x: number; y: number }[]) {
  const m = await sharp(buf).metadata();
  const W = m.width!, H = m.height!, r = Math.round(Math.min(W, H) / 28);
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${pontos.map(p =>
    `<circle cx="${p.x * W}" cy="${p.y * H}" r="${r}" fill="#E0115F" stroke="white" stroke-width="${r / 5}"/>` +
    `<text x="${p.x * W}" y="${p.y * H + r * 0.38}" font-family="Arial" font-weight="bold" font-size="${r * 1.1}" fill="white" text-anchor="middle">${p.n}</text>`).join('')}</svg>`;
  return sharp(buf).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 90 }).toBuffer();
}
