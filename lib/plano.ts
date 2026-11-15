// Lista única de pedidos de uma foto. A mesma lista aparece para o cliente
// (resumo antes de gerar), entra numerada no prompt e é conferida item por item
// na checagem. Arquivo sem dependências: pode ser usado na tela e no servidor.

export type Pedido = { tipo: 'retirar' | 'arrumar' | 'decisao' | 'pedido' | 'ajuste'; cliente: string; texto: string };

export const GRUPOS: [string, string][] = [
  ['aberturas', 'Portas, gavetas e janelas'],
  ['moveis', 'Móveis e eletrodomésticos'],
  ['tecidos', 'Cama, almofadas e cortinas'],
  ['superficies', 'Mesas, bancadas e pias'],
  ['objetos', 'Objetos soltos e fios'],
  ['luz', 'Luzes, telas e reflexos'],
  ['limpeza', 'Limpeza'],
  ['externo', 'Área externa'],
  ['defeitos', 'Defeitos e desgaste'],
  ['pessoal', 'Itens pessoais'],
  ['outros', 'Outros']
];

const limpo = (s: any) => String(s || '').replace(/\s+/g, ' ').replace(/;/g, ',').trim();
const fixo = (n: string) => /pessoa|rosto|placa/i.test(n);

export function listaPedidos(an: any, a: any, ajustes?: string): Pedido[] {
  const out: Pedido[] = [];
  for (const r of (an?.removiveis || [])) {
    if (!r?.nome || fixo(r.nome) || !(a?.remover || []).includes(r.nome)) continue;
    out.push({ tipo: 'retirar', cliente: `Tirar: ${limpo(r.nome)}`, texto: `retirar por completo, sem sombra e sem marca remanescente: ${limpo(r.forma_posicao || r.nome)}` });
  }
  for (const x of (an?.arrumar || [])) {
    if (!x?.nome || !(a?.arrumar || []).includes(x.nome)) continue;
    out.push({ tipo: 'arrumar', cliente: `${limpo(x.nome)}: ${limpo(x.acao)}`, texto: `${limpo(x.acao)} (${limpo(x.nome)})` });
  }
  for (const [p, v] of Object.entries(a?.respostas || {})) {
    if (!v) continue;
    out.push({ tipo: 'decisao', cliente: `${limpo(p)} ${limpo(v)}`, texto: `decisão do cliente: ${limpo(p)} → ${limpo(v)}` });
  }
  const interp: any[] = Array.isArray(a?.interpretado) ? a.interpretado : [];
  if (interp.length) {
    for (const i of interp) if (i?.acao) out.push({ tipo: 'pedido', cliente: limpo(i.resumo || i.acao), texto: limpo(i.acao) });
  } else {
    if (limpo(a?.retirar_txt)) out.push({ tipo: 'pedido', cliente: `Tirar: ${limpo(a.retirar_txt)}`, texto: `retirar por completo, sem sombra e sem marca remanescente: ${limpo(a.retirar_txt)}` });
    if (limpo(a?.melhorar_txt)) out.push({ tipo: 'pedido', cliente: `Arrumar: ${limpo(a.melhorar_txt)}`, texto: `arrumar ou melhorar, usando só o que já existe: ${limpo(a.melhorar_txt)}` });
  }
  for (const t of String(ajustes || '').split(';').map(limpo).filter(Boolean))
    out.push({ tipo: 'ajuste', cliente: t, texto: t });
  return out.slice(0, 18);
}
