// Motor de imagem da Lucida Room: análise, montagem do prompt e checagem.
// As regras seguem o item 13 e o Anexo do prompt v2.

export type Analysis = {
  ambiente: string;
  inventario: { item: string; qtd: number }[];
  materiais: string[];
  texturas: string[];
  cores_principais: string[];
  ponto_neutro: string;
  ponto_neutro_tom: 'branco' | 'bege';
  removiveis: { nome: string; forma_posicao: string }[];
  qualidade: { problema: string | null; dica: string | null };
  elementos?: { nome: string; material: string; cor: string }[];
  verticais?: [number, number, number, number][];
  foco?: number[] | null;
  arrumar?: { nome: string; acao: string }[];
};

export type Answers = {
  svc: 'revelar' | 'ambientar';
  enq: 'manter' | 'verticais' | 'justo' | 'centralizar';
  luz: 'claro' | 'suave' | 'tarde' | 'noite' | 'manter';
  remover: string[];           // nomes vindos de analysis.removiveis
  estilo?: string; paleta?: string; adicionar?: string[]; densidade?: string; quem?: string;
  nao_mudar?: string;
  formatos: string[];          // '4:5' | '9:16' | '1:1' | '16:9'
  posicoes?: Record<string, [number, number]>; // item -> ponto marcado na foto (0–1)
  arrumar?: string[];          // ações de arrumação escolhidas (vindas de analysis.arrumar)
  retirar_txt?: string;        // texto livre: o que tirar
  melhorar_txt?: string;       // texto livre: o que arrumar/melhorar
};

export const ANALYSIS_PROMPT = `Você é um fotógrafo de arquitetura. Analise a foto e responda SOMENTE em JSON com esta forma:
{"ambiente": "ex.: Sala de jantar",
 "inventario": [{"item":"cadeira de madeira com assento de couro","qtd":6}, ...] (tudo que é fixo ou mobiliário, com contagem exata),
 "materiais": ["piso de madeira em réguas", ...],
 "texturas": ["madeira do tampo", "pedra da parede", ...],
 "cores_principais": ["madeira média avermelhada", ...] (até 4),
 "ponto_neutro": "o elemento branco ou bege mais neutro da cena, ex.: forro",
 "ponto_neutro_tom": "branco" ou "bege",
 "removiveis": [{"nome":"Pessoa","forma_posicao":"homem de camiseta azul em pé junto à porta de vidro à esquerda"}, ...] (pessoas, rostos, placas de carro, cabos, objetos soltos, lixeiras, roupas, brinquedos, entulho, celulares, papéis — o que um fotógrafo tiraria),
 "qualidade": {"problema": null ou "escura" | "tremida" | "lente 0,5×" | "muito inclinada", "dica": null ou a dica curta para refazer},
 "elementos": [{"nome":"gavetas inferiores da estante","material":"MDF laqueado","cor":"branco"}, ...] (cada superfície e móvel fixo com material e cor exatos, incluindo paredes, piso, forro, marcenaria, portas e esquadrias),
 "verticais": [[x1,y1,x2,y2], ...] (2 a 4 arestas que no mundo real são verticais e retas — batentes, quinas de parede, laterais de armário, montantes de esquadria —, em coordenadas normalizadas de 0 a 1, com y1 perto do topo e y2 perto da base da aresta; inclua obrigatoriamente a mais próxima da borda esquerda e a mais próxima da borda direita),
 "foco": [x1,y1,x2,y2] (caixa do elemento principal da foto, normalizada 0–1),
 "arrumar": [{"nome":"Geladeira desalinhada","acao":"empurrar a geladeira para trás até alinhar a frente com a marcenaria, porta fechada"}, ...] (tudo o que um produtor de fotografia arrumaria antes do clique usando só o que já existe: eletrodomésticos fora de posição, portas e gavetas abertas, cadeiras desalinhadas, almofadas e cortinas desarrumadas, tapetes tortos, objetos fora do lugar; 'acao' descreve a arrumação exata, sem acrescentar nada novo)}`;

const LUZ: Record<Answers['luz'], string> = {
  claro: 'dia claro, luz natural abundante entrando pelas aberturas existentes, sombras suaves e coerentes com as janelas',
  suave: 'dia suave e difuso, luz natural uniforme, sem manchas estouradas nas janelas',
  tarde: 'fim de tarde, sol baixo e quente entrando apenas pelas aberturas existentes',
  noite: 'noite com as luminárias existentes acesas, sem criar novos pontos de luz',
  manter: 'manter a luz da foto, só equilibrando exposição, cor e contraste'
};

function cameraBlock(_a: Answers) {
  return 'Mesmo tamanho, proporção, ponto de vista e enquadramento da IMAGEM 1, pixel a pixel: não mude a câmera, não gire, não amplie, não recorte e não complete bordas — o prumo e o recorte são feitos depois, fora da IA.';
}

export function buildPrompt(an: Analysis, a: Answers, ajuste?: string, correcao?: string) {
  const inv = an.inventario.map(i => `${i.qtd} ${i.item}`).join('; ');
  const rem = an.removiveis.filter(r => a.remover.includes(r.nome) || /pessoa|rosto|placa/i.test(r.nome))
    .map(r => r.forma_posicao).join('; ') || 'nada além de pessoas, rostos e placas de veículos';
  const amb = a.svc === 'ambientar';
  const itens = a.adicionar || [];
  const pos = a.posicoes || {};
  const marcados = itens.filter(i => pos[i]);
  const lado = (x: number) => x < 0.33 ? 'no terço esquerdo' : x > 0.66 ? 'no terço direito' : 'no centro';
  const prof = (y: number) => y > 0.7 ? 'em primeiro plano' : y < 0.45 ? 'ao fundo' : 'no meio do ambiente';
  const listaItens = itens.map((i, k) => pos[i]
    ? `${i} — exatamente no marcador ${marcados.indexOf(i) + 1} da IMAGEM 2 (${lado(pos[i][0])}, ${prof(pos[i][1])}), apoiado no piso ou na superfície que está sob o marcador`
    : `${i} — em posição coerente com a circulação, sem bloquear portas, gavetas ou passagens`).join('; ');
  const add = amb ? (itens.length
    ? ` 3) Acrescentar SOMENTE estes itens, um de cada, em escala real, no estilo ${a.estilo}, paleta ${a.paleta}, densidade ${a.densidade}, para ${a.quem}: ${listaItens}. Nenhum outro móvel ou objeto entra.`
    : ` 3) Arrumar a cena no estilo ${a.estilo}, paleta ${a.paleta}, sem acrescentar móveis: no máximo objetos pequenos de cena sobre superfícies existentes.`) : '';
  const ajusteTxt = ajuste ? ` ${amb ? 4 : 3}) REGRAS OBRIGATÓRIAS DO CLIENTE, prioridade máxima sobre todo o resto: ${ajuste}.` : '';
  const travas = (an.elementos || []).length ? ` Cores e materiais travados, peça por peça, sem nenhuma troca: ${an.elementos!.map(e => `${e.nome} = ${e.material} ${e.cor}`).join('; ')}.` : '';
  const arr = (an.arrumar || []).filter(x => (a.arrumar || []).includes(x.nome)).map(x => x.acao);
  const pedidos = [a.retirar_txt ? `retirar: ${a.retirar_txt}` : '', a.melhorar_txt ? `arrumar/melhorar: ${a.melhorar_txt}` : ''].filter(Boolean).join('; ');
  const arrTxt = arr.length || pedidos ? ` Arrumação de produção, usando só o que já existe na cena (pode mover, alinhar, fechar e endireitar objetos existentes, sem acrescentar nada): ${[...arr, pedidos].filter(Boolean).join('; ')}.` : '';
  const corr = correcao ? ` A tentativa anterior errou: ${correcao}. Corrija exatamente isso.` : '';
  const neg = an.texturas.length ? ` Nas texturas artesanais (${an.texturas.join(', ')}): sem padrão repetido, sem escamas, sem leques, sem alinhamento, sem direção dominante, mantendo a escala do relevo da IMAGEM 1.` : '';
  const checklist = an.inventario.map(i => `${i.qtd} ${i.item}`).join(', ');
  const revelar = amb ? ' É proibido trocar acabamentos, cores ou materiais do que já existe; só entra o que está listado.' : ' Este é um serviço REVELAR: não acrescente nenhum objeto, móvel, material ou elemento que não exista na IMAGEM 1.';
  const ref2 = amb && marcados.length ? ' A IMAGEM 2 é a mesma foto com marcadores numerados que indicam onde cada item novo deve ficar; use-a só como mapa de posição e não reproduza os marcadores.' : '';

  return `Edite a IMAGEM 1, fotografia de celular de ${an.ambiente}, transformando-a em fotografia profissional de arquitetura. A IMAGEM 1 é a autoridade absoluta da arquitetura, dos materiais, das cores e da quantidade de objetos; tudo o que não estiver listado nas alterações é copiado da IMAGEM 1 sem reprocessamento.${revelar}${ref2}${travas}${corr} Inventário que precisa continuar idêntico: ${inv}. ${cameraBlock(a)} Alterações: 1) Luz: ${LUZ[a.luz]}. 2) Remover, sem sombra e sem marca remanescente: ${rem}; remover também todas as pessoas, rostos (inclusive em reflexos) e placas de veículos.${arrTxt}${add}${ajusteTxt}${neg} Plano de forro único e arestas retas, sem cunhas nem faixas inventadas. Letreiros, placas e textos permanecem como na IMAGEM 1, sem letras novas. Nada entra na foto que não esteja listado. O que não pode mudar de jeito nenhum: ${a.nao_mudar || 'arquitetura, esquadrias, piso, revestimentos e mobiliário fixo'}. Verificação final, responda sim ou não antes de entregar: ${checklist}; nenhuma pessoa, rosto ou placa de veículo visível; enquadramento idêntico ao da IMAGEM 1; nenhum objeto não pedido; texto inalterado. Qualquer não, refaça.

QUALIDADE MÁXIMA: saída com nitidez igual ou superior à IMAGEM 1, sem embaçamento, sem suavização plástica e sem ruído de compressão, com tudo em foco do primeiro plano ao fundo. É de extrema importância que a qualidade não se perca nesta geração. Texturas que precisam sair nítidas e individualizadas: ${[...an.texturas, ...an.materiais].join(', ')}. A cor fica travada na IMAGEM 1 como referência absoluta: ${an.cores_principais.join(', ')}. Ponto neutro declarado: ${an.ponto_neutro} é ${an.ponto_neutro_tom} neutro, sem dominante azul, verde, rosa ou magenta. Teste binário antes de entregar: o ponto neutro está neutro, sim ou não? A cor principal está idêntica à IMAGEM 1, sim ou não? As texturas listadas estão nítidas, sim ou não? Qualquer não, refaça.`;
}

export const FINAL_4K_PROMPT = `Reproduza a IMAGEM 1 em resolução 4K, idêntica em enquadramento, objetos, cores, luz e composição. Não altere, não acrescente e não remova nada. QUALIDADE MÁXIMA: nitidez igual ou superior à IMAGEM 1, sem embaçamento, sem suavização plástica, sem ruído de compressão, texturas individualizadas, cor idêntica à IMAGEM 1, ponto neutro sem dominante azul, verde, rosa ou magenta.`;

export function checkPrompt(an: Analysis, svc: string) {
  return `IMAGEM 1 é a foto original; IMAGEM 2 é o resultado editado (${svc}). Compare e responda SOMENTE em JSON:
{"cor_desviada": true/false (IMAGEM 2 ficou mais rosada, magenta ou amarelada que a original),
 "menos_nitida": true/false,
 "contagem_ok": true/false (inventário esperado: ${an.inventario.map(i => `${i.qtd} ${i.item}`).join('; ')}),
 "objeto_nao_pedido": true/false ${svc === 'revelar' ? '(qualquer objeto novo conta)' : '(só objetos fora da lista de decoração)'},
 "pessoa_visivel": true/false,
 "ponto_fraco": "uma frase curta ou null"}`;
}

export const passed = (c: any) => c && !c.cor_desviada && !c.menos_nitida && c.contagem_ok && !c.objeto_nao_pedido && !c.pessoa_visivel;
