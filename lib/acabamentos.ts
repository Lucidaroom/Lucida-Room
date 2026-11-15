// Serviço "Trocar acabamentos": leitura das superfícies da foto com opções de troca
// propostas pela plataforma (o cliente não manda foto de referência) e o passe
// isolado que aplica a troca somente na superfície marcada, sobre a saída do Revelar.

export type OpcaoAcab = {
  rotulo: string;        // nome curto para o chip, ex.: "Porcelanato amadeirado claro"
  descricao: string;     // descrição completa do material, usada no prompt
  cor: string;           // hex aproximado, só para a amostra na tela
};

export type Superficie = {
  nome: string;          // ex.: "Piso da sala", "Parede do fundo", "Marcenaria da cozinha"
  tipo: string;          // piso | parede | forro | marcenaria | bancada | revestimento | esquadria | porta | outro
  material_atual: string;
  cor_atual: string;
  caixa?: [number, number, number, number];
  opcoes: OpcaoAcab[];
};

export type Troca = { superficie: string; opcao: string };

export const TIPOS: [string, string][] = [
  ['piso', 'Piso'],
  ['parede', 'Paredes'],
  ['marcenaria', 'Marcenaria e armários'],
  ['bancada', 'Bancadas'],
  ['revestimento', 'Revestimentos'],
  ['esquadria', 'Esquadrias e portas'],
  ['forro', 'Forro e teto'],
  ['outro', 'Outras superfícies']
];

export const grupoDe = (t: string) => (TIPOS.some(([k]) => k === t) ? t : 'outro');

const limpo = (s: any, max = 300) => String(s || '').replace(/\s+/g, ' ').replace(/;/g, ',').trim().slice(0, max);
const hex = (s: any) => (/^#[0-9a-fA-F]{6}$/.test(String(s || '')) ? String(s) : '#8a8378');

// Posição da superfície na foto, dita em palavras — o modelo recebe a lista, não um clique.
export function ondeNaFoto(caixa?: [number, number, number, number]) {
  if (!caixa || caixa.length !== 4 || caixa.some(n => typeof n !== 'number')) return '';
  const [x1, y1, x2, y2] = caixa;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const larga = Math.abs(x2 - x1) > 0.8, alta = Math.abs(y2 - y1) > 0.8;
  const h = larga ? 'em toda a largura da imagem' : cx < 0.34 ? 'no terço esquerdo' : cx > 0.66 ? 'no terço direito' : 'no centro';
  const v = alta ? 'em toda a altura da imagem' : cy < 0.34 ? 'na faixa superior' : cy > 0.66 ? 'na faixa inferior' : 'na faixa central';
  return ` (${h}, ${v})`;
}

export const SURFACE_PROMPT = `Você é arquiteto de interiores e especialista em acabamentos do mercado brasileiro. Olhe a foto e devolve SOMENTE JSON com as superfícies cuja cor ou material poderiam ser trocados nesta imagem, e com as opções de troca que você proporia para cada uma:
{"superficies":[{"nome":"Piso da sala","tipo":"piso","material_atual":"porcelanato acetinado bege 60x60","cor_atual":"bege claro","caixa":[x1,y1,x2,y2],"opcoes":[{"rotulo":"Porcelanato amadeirado claro","descricao":"porcelanato que imita madeira em réguas de 20x120 cm, tom carvalho claro levemente acinzentado, acabamento acetinado, assentado no sentido do maior comprimento do ambiente, juntas mínimas da mesma cor da régua","cor":"#c9ae8c"}, ...]}]}

Regras:
1) "tipo" é uma destas chaves: piso, parede, marcenaria, bancada, revestimento, esquadria, porta, forro, outro.
2) Uma entrada por superfície contínua e realmente visível, com "nome" curto que qualquer pessoa identifica na foto ("Parede do fundo", "Armários superiores da cozinha", "Bancada da pia"). Se duas paredes têm o mesmo acabamento e aparecem como um conjunto, podem ser uma entrada só; se uma parede tem acabamento próprio (painel, meia parede pintada), ela é uma entrada separada. Máximo de 7 superfícies, as de maior área e maior efeito na foto primeiro.
3) "caixa" é a caixa delimitadora da superfície na foto, normalizada de 0 a 1, [x1,y1,x2,y2].
4) "material_atual" e "cor_atual" descrevem o que existe hoje, com o máximo de precisão que a foto permite (material, formato da peça, acabamento, sentido de assentamento).
5) "opcoes": de 3 a 4 trocas plausíveis para aquela superfície, que funcionem com o restante do ambiente desta foto (as outras superfícies continuam como estão) e que existam no mercado brasileiro. Sempre em faixas de preço e estilos diferentes entre si, nunca quatro variações do mesmo tom. Para piso: porcelanato amadeirado, porcelanato tipo cimento, porcelanato tipo mármore, laminado. Para parede: tinta fosca com o nome da cor, revestimento ripado de madeira, revestimento 3D, meia parede pintada. Para marcenaria: laca fosca colorida, MDF amadeirado, ripado vertical. Para bancada: quartzo, granito, mármore, porcelanato. Para revestimento: subway tile, pastilha, zellige, cimentício. Para esquadria e porta: alumínio preto, alumínio branco, madeira natural, laca.
6) "descricao" é a instrução que vai para o editor de imagem: material, cor, formato e tamanho da peça, acabamento (fosco, acetinado, polido), sentido de assentamento e como fica a junta ou o rejunte. Uma frase, sem ponto e vírgula.
7) "rotulo" tem no máximo 4 palavras. "cor" é o hexadecimal aproximado da cor predominante da opção, só para mostrar uma amostra na tela.
8) Não proponha mudança de geometria, de posição nem de desenho: nada de criar nicho, prateleira, viga, porta ou janela, nada de mudar o tamanho de um armário. Só cor, material e textura da superfície.
9) Não inclua móveis soltos, estofados, tapetes, cortinas, objetos, louças, metais nem luminárias: esta lista é só de superfícies e marcenaria fixa.`;

export function lerSuperficies(j: any): Superficie[] {
  const lista = Array.isArray(j?.superficies) ? j.superficies : [];
  const out: Superficie[] = [];
  for (const s of lista) {
    if (!s?.nome) continue;
    const opcoes = (Array.isArray(s.opcoes) ? s.opcoes : [])
      .filter((o: any) => o?.rotulo && o?.descricao)
      .slice(0, 4)
      .map((o: any) => ({ rotulo: limpo(o.rotulo, 60), descricao: limpo(o.descricao, 300), cor: hex(o.cor) }));
    if (!opcoes.length) continue;
    const c = Array.isArray(s.caixa) && s.caixa.length === 4 && s.caixa.every((n: any) => typeof n === 'number')
      ? (s.caixa.map((n: number) => Math.max(0, Math.min(1, n))) as [number, number, number, number]) : undefined;
    out.push({
      nome: limpo(s.nome, 60), tipo: grupoDe(limpo(s.tipo, 20).toLowerCase()),
      material_atual: limpo(s.material_atual, 160) || 'material atual da foto',
      cor_atual: limpo(s.cor_atual, 60) || 'cor atual da foto',
      caixa: c, opcoes
    });
    if (out.length >= 7) break;
  }
  return out;
}

// Trocas escolhidas pelo cliente, já casadas com a leitura das superfícies.
export type TrocaResolvida = { nome: string; tipo: string; de: string; para: string; onde: string };

export function trocasEscolhidas(superficies: Superficie[], trocas: Troca[] = []): TrocaResolvida[] {
  const out: TrocaResolvida[] = [];
  for (const t of trocas) {
    if (!t?.superficie || !t?.opcao) continue;
    const s = superficies.find(x => x.nome === t.superficie);
    if (!s) continue;
    const o = s.opcoes.find(x => x.rotulo === t.opcao);
    const para = o ? o.descricao : limpo(t.opcao, 300);   // opção escrita à mão entra como foi escrita
    if (!para) continue;
    out.push({ nome: s.nome, tipo: s.tipo, de: `${s.material_atual}, ${s.cor_atual}`, para, onde: ondeNaFoto(s.caixa) });
    if (out.length >= 4) break;                            // até 4 superfícies por geração
  }
  return out;
}

export const resumoTroca = (t: TrocaResolvida) => `${t.nome}: ${t.para}`;

// ——— passe isolado de troca, aplicado sobre a saída do Revelar ———
export function buildSwapPrompt(an: any, trocas: TrocaResolvida[], correcao?: string, ajuste?: string) {
  const lista = trocas.map((t, i) => `${i + 1}) ${t.nome}${t.onde}: hoje é ${t.de} e passa a ser ${t.para}`).join('; ')
    + (ajuste ? `. Ajuste pedido pelo cliente sobre o acabamento, com prioridade máxima e válido só dentro das superfícies listadas acima: ${ajuste}` : '');
  const nomes = trocas.map(t => t.nome).join(', ');
  const texturas = [...(an?.texturas || []), ...(an?.materiais || [])].join(', ');
  const corr = correcao ? ` A tentativa anterior errou: ${correcao}. Corrija exatamente isso e nada além disso.` : '';
  return `Edite a IMAGEM 1, fotografia profissional de ${an?.ambiente || 'um ambiente'}, trocando o acabamento somente das superfícies listadas abaixo. A IMAGEM 1 é a autoridade absoluta de enquadramento, geometria, perspectiva, iluminação, mobiliário e objetos: este é um passe isolado de acabamento, não uma nova fotografia.${corr} Alterações, e nenhuma outra: ${lista}. Cada troca fica restrita à superfície nomeada, do limite ao limite dela, sem invadir um milímetro das superfícies vizinhas: ao trocar um piso, o rodapé, a soleira, a base dos móveis e o degrau continuam idênticos; ao trocar uma parede, o forro, o rodapé, os espelhos de tomada e interruptor, as esquadrias e os batentes continuam idênticos; ao trocar marcenaria, os puxadores, as dobradiças, o desenho das portas, a quantidade de gavetas e o formato do móvel continuam idênticos. O material novo acompanha a perspectiva da superfície na IMAGEM 1: o sentido do assentamento, a paginação, as juntas e o relevo seguem o plano e o ponto de fuga que já existem, com a escala da peça coerente com o tamanho real do ambiente, e as peças continuam retas e paralelas às arestas da superfície. A luz da IMAGEM 1 é mantida por inteiro: as mesmas fontes, a mesma direção, as mesmas sombras projetadas, os mesmos reflexos e o mesmo contato de sombra onde móveis e paredes encontram a superfície trocada, apenas com a reflexão e o brilho ajustados ao novo material (fosco reflete pouco, polido reflete o ambiente que já aparece na foto). Tudo o que não está na lista é copiado 1:1 da IMAGEM 1, sem reprocessamento, sem reenquadrar, sem redesenhar e sem melhorar: mesmo tamanho, mesma proporção, mesmo ponto de vista, pixel a pixel. É proibido acrescentar, remover ou trocar qualquer móvel, eletrodoméstico, louça, metal, luminária, tapete, cortina, quadro ou objeto; é proibido criar ou apagar nicho, prateleira, viga, moldura, porta, janela, ripado ou painel que não exista na IMAGEM 1; é proibido mudar a geometria, o tamanho ou a posição de qualquer superfície, inclusive das que trocam de acabamento. Letreiros, placas e textos permanecem como na IMAGEM 1, sem letras novas. Verificação final, responda sim ou não antes de entregar: as superfícies ${nomes} estão com o acabamento novo descrito, sim ou não? Alguma outra superfície mudou de cor, material ou desenho, sim ou não? Algum móvel, objeto, louça, metal ou luminária entrou, saiu ou mudou, sim ou não? A geometria, a perspectiva e o enquadramento continuam idênticos aos da IMAGEM 1, sim ou não? As sombras e os reflexos continuam coerentes com a luz da IMAGEM 1, sim ou não? Qualquer resposta errada, refaça.

QUALIDADE MÁXIMA: saída com nitidez igual ou superior à IMAGEM 1, sem embaçamento, sem suavização plástica e sem ruído de compressão, com tudo em foco do primeiro plano ao fundo. É de extrema importância que a qualidade não se perca nesta geração. Texturas que precisam sair nítidas e individualizadas, inclusive o relevo do material novo: ${texturas || 'todas as texturas visíveis da cena'}. A cor fica travada na IMAGEM 1 como referência absoluta em tudo o que não está na lista de trocas: ${(an?.cores_principais || []).join(', ') || 'as cores da própria IMAGEM 1'}. Ponto neutro declarado: ${an?.ponto_neutro || 'o branco mais neutro da cena'} é ${an?.ponto_neutro_tom || 'branco'} neutro, sem dominante azul, verde, rosa ou magenta. Teste binário antes de entregar: o ponto neutro está neutro, sim ou não? As superfícies fora da lista estão com a cor idêntica à IMAGEM 1, sim ou não? As texturas listadas estão nítidas, sim ou não? Qualquer não, refaça.`;
}

export function swapCheckPrompt(trocas: TrocaResolvida[]) {
  return `IMAGEM 1 é a fotografia antes da troca de acabamento; IMAGEM 2 é a mesma fotografia depois da troca. Compare as duas com rigor e responda SOMENTE em JSON:
{"trocas":[{"n":1,"feito":true/false}, ...] (um item para cada troca abaixo, na ordem; "feito" é true só quando a IMAGEM 2 mostra aquela superfície com o acabamento novo descrito, aplicado em toda a superfície): ${trocas.map((t, i) => `${i + 1}) ${t.nome}${t.onde} passa a ser ${t.para}`).join('; ')},
 "vazou": true/false (alguma superfície fora da lista — outra parede, forro, rodapé, soleira, esquadria, bancada, marcenaria — mudou de cor, material ou desenho),
 "objeto_alterado": true/false (algum móvel, eletrodoméstico, louça, metal, luminária, tapete, cortina, quadro ou objeto entrou, saiu, mudou de modelo ou mudou de lugar),
 "geometria_alterada": true/false (mudou a geometria, o tamanho ou a posição de alguma superfície, ou apareceu/desapareceu nicho, prateleira, viga, moldura, porta, janela, ripado ou painel),
 "enquadramento_alterado": true/false (a IMAGEM 2 tem outro ponto de vista, outro recorte, outro zoom ou bordas completadas),
 "luz_incoerente": true/false (as sombras, os reflexos ou o contato de sombra da superfície trocada não combinam com a luz da IMAGEM 1),
 "menos_nitida": true/false,
 "ponto_fraco": "uma frase curta dizendo o erro mais grave, ou null"}`;
}

export const trocasNaoFeitas = (c: any): number[] =>
  (Array.isArray(c?.trocas) ? c.trocas : []).filter((t: any) => t && t.feito === false).map((t: any) => Number(t.n)).filter((n: number) => n > 0);

export const falhasTroca = (c: any) => !c ? 99
  : [c.vazou, c.objeto_alterado, c.geometria_alterada, c.enquadramento_alterado, c.luz_incoerente, c.menos_nitida].filter(Boolean).length * 2
  + trocasNaoFeitas(c).length;

export const trocaPassed = (c: any) => c && !c.vazou && !c.objeto_alterado && !c.geometria_alterada
  && !c.enquadramento_alterado && !c.luz_incoerente && !c.menos_nitida && trocasNaoFeitas(c).length === 0;
