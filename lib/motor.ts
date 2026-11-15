// Motor de imagem da Lucida Room: análise, montagem do prompt e checagem.
// As regras seguem o item 13 e o Anexo do prompt v2.

import { listaPedidos } from './plano';

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
  arrumar?: { nome: string; acao: string; grupo?: string; motivo?: string; padrao?: boolean; caixa?: [number, number, number, number] }[];
  perguntas?: { pergunta: string; opcoes: string[] }[];
};

export type Answers = {
  svc: 'revelar' | 'ambientar';
  enq: 'manter' | 'verticais' | 'justo' | 'centralizar';
  luz: 'claro' | 'suave' | 'tarde' | 'noite' | 'manter';
  remover: string[];           // nomes vindos de analysis.removiveis
  estilo?: string; paleta?: string; adicionar?: string[]; densidade?: string;
  nao_mudar?: string;
  formatos: string[];          // '4:5' | '9:16' | '1:1' | '16:9'
  posicoes?: Record<string, [number, number]>; // item -> ponto marcado na foto (0–1)
  intensidade?: 'sutil' | 'editorial' | 'revista';
  arrumar?: string[];          // ações de arrumação escolhidas (vindas de analysis.arrumar)
  retirar_txt?: string;        // texto livre: o que tirar
  melhorar_txt?: string;       // texto livre: o que arrumar/melhorar
  respostas?: Record<string, string>; // pergunta da análise -> opção escolhida pelo cliente
  refs?: string[];             // nomes dos itens que vão como recorte de referência, na ordem
  interpretado?: { acao: string; resumo?: string; tipo?: string }[]; // texto livre já convertido em ações concretas e confirmado pelo cliente
};

export const ANALYSIS_PROMPT = `Você é um fotógrafo de arquitetura e um produtor de cena. Analise a foto e responda SOMENTE em JSON com esta forma:
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
 "arrumar": [{"nome":"Geladeira fora do nicho","acao":"empurrar a geladeira para dentro do nicho até a frente alinhar com a marcenaria, porta fechada","grupo":"moveis","motivo":"o eletrodoméstico saliente quebra a linha da marcenaria","padrao":true,"caixa":[x1,y1,x2,y2]}, ...],
 "perguntas": [{"pergunta":"A geladeira deve ficar embutida no nicho?","opcoes":["Sim, embutir no nicho","Não, manter onde está"]}, ...]}

Regras para "arrumar": são as sugestões de produção da foto — tudo o que um produtor de fotografia de arquitetura faria antes do clique usando só o que já existe na cena, sem acrescentar, trocar ou inventar nada. Percorra obrigatoriamente o catálogo abaixo, grupo por grupo, e só deixe de fora o que de fato não existe na foto. Cada sugestão é um item separado (uma porta, uma mesa, uma cama), nunca um resumo genérico.
"aberturas": porta de entrada ou porta de ambiente aberta ou entreaberta (fechar por completo, folha alinhada ao batente); portas de armário, gavetas, tampas, box e tampa do vaso sanitário abertos (fechar); janelas entreabertas de forma desigual (igualar); portão ou porta de garagem aberto (fechar).
"moveis": eletrodoméstico ou móvel saliente, recuado, torto ou fora do nicho/vão onde deveria estar embutido ou alinhado com a marcenaria; cadeiras e banquetas desalinhadas (encostar na mesa ou bancada, espaçamento igual, todas na mesma direção); tapete torto, dobrado ou com ponta levantada; sofá, poltronas, mesa de centro e mesas laterais fora de esquadro; cama fora do eixo da cabeceira; quadros e espelhos tortos.
"tecidos": cama desarrumada (esticar lençol e colcha, travesseiros alinhados e simétricos); almofadas amassadas ou caídas (afofar e distribuir); mantas jogadas (dobrar); cortinas e persianas desiguais, tortas ou meio abertas (igualar a altura e a abertura dos dois lados); toalhas penduradas tortas ou usadas (dobrar e alinhar).
"superficies": mesa, escrivaninha, aparador, bancada de cozinha, pia ou bancada de banheiro com muitos objetos (organizar: dizer na "acao" quais peças ficam, no máximo três agrupadas, e que todo o restante sai, deixando o tampo livre e limpo); louça na pia ou no escorredor; detergente, esponja, panos e produtos de limpeza à vista; escovas, cosméticos e frascos na bancada do banheiro; papéis e correspondência; eletroportáteis em excesso; ímãs e papéis na geladeira.
"objetos": cabos, carregadores, extensões e fios soltos; controles remotos; lixeiras, baldes, vassouras e rodos; roupas, sapatos, bolsas e mochilas; brinquedos; potes e caminha de animal; caixas, sacolas e embalagens; ferramentas, escada, lona, fita e material de obra; etiquetas e adesivos de fábrica em vidros, eletrodomésticos e louças.
"luz": luminária apagada ou com lâmpada queimada ao lado de outras acesas (igualar); lâmpadas de cor diferente no mesmo ambiente (igualar a temperatura); televisão ou monitor ligado (tela apagada); reflexo do fotógrafo, do celular ou do flash em espelho, vidro, inox ou tela (eliminar o reflexo, mantendo o que o espelho mostraria do ambiente).
"limpeza": marcas de água, pegadas, poeira de obra e respingos no piso; espelho ou vidro manchado; bancada molhada ou com migalhas. Limpeza nunca troca material, cor nem desenho.
"defeitos": desgaste e defeito de acabamento que a foto mostra — furos de prego e buchas, riscos e marcas de móvel na parede, pintura manchada, descascada ou com retoque aparente, rejunte encardido, silicone escurecido, tomada ou interruptor sem espelho, lâmpada pendurada sem luminária, rodapé solto, peça de piso lascada, gramado falhado; e também defeito permanente do imóvel — rachadura, trinca, infiltração, mancha de umidade, mofo. A "acao" recompõe a superfície com o mesmo material, a mesma cor e a mesma textura do entorno, sem trocar o acabamento. Todo item deste grupo tem "padrao" false, e o "nome" de rachadura, trinca, infiltração, umidade e mofo começa com "Defeito do imóvel:".
"externo": veículos, lixeiras, mangueiras, ferramentas de jardim e brinquedos no quintal; folhas e sujeira na piscina, capa ou limpador de piscina à vista; móveis de área externa desalinhados e almofadas fora do lugar; guarda-sol torto; folhas secas sobre piso e gramado. Fios, postes e vizinhos fazem parte do lugar e ficam.
"pessoal": fotos de família, documentos, remédios, calendários, recados e telas com informação pessoal.
Cada item traz "nome" (curto, o que é e o que há de errado), "acao" (a arrumação exata, com verbo no infinitivo, dizendo o que fica e o que sai quando for o caso), "grupo" (uma das chaves acima), "motivo" (uma frase curta, sem jargão, dizendo por que isso melhora a fotografia), "padrao" e "caixa" (caixa delimitadora do item na foto, normalizada de 0 a 1, [x1,y1,x2,y2], canto superior esquerdo e canto inferior direito).
"padrao" é true quando praticamente todo fotógrafo faria (fechar porta e gaveta, alinhar cadeira, esticar cama, tirar louça e produto de limpeza, apagar reflexo do fotógrafo) e false quando depende do gosto ou do uso da foto (todo o grupo "defeitos", itens do grupo "pessoal", objetos de decoração que talvez sejam parte do projeto, porta aberta que mostra de propósito a ligação com outro ambiente, televisão). Nunca repita em "arrumar" o que já está em "removiveis". Limite: até 16 sugestões, as de maior efeito na foto primeiro.

Regras para "perguntas": até 4 dúvidas cuja resposta muda o resultado da edição — sempre sobre decisões que você não consegue deduzir sozinho da foto (se um elemento fora de posição deve ser reposicionado, se algo aparentemente provisório fica ou sai, se uma abertura fica aberta ou fechada, se objetos de decoração e itens pessoais ficam ou saem). Cada pergunta é curta, em português, e traz de 2 a 3 opções objetivas e excludentes. Se não houver dúvida real, devolva lista vazia.`;

const LUZ: Record<Answers['luz'], string> = {
  claro: 'dia claro, luz natural abundante entrando pelas aberturas existentes, sombras suaves e coerentes com as janelas',
  suave: 'dia suave e difuso, luz natural uniforme, sem manchas estouradas nas janelas',
  tarde: 'fim de tarde, sol baixo e quente entrando apenas pelas aberturas existentes',
  noite: 'noite com as luminárias existentes acesas, sem criar novos pontos de luz',
  manter: 'manter a luz da foto, só equilibrando exposição, cor e contraste'
};

const TRAT: Record<string, string> = {
  sutil: 'correção discreta de exposição, cor e nitidez, mantendo o clima da foto',
  editorial: 'tratamento de fotografia profissional de arquitetura, com diferença evidente à primeira vista: exposição equilibrada como um HDR bem feito (janelas com detalhe e sombras abertas), brancos limpos e neutros, contraste e microcontraste de revista, cores ricas e fiéis aos materiais, luz com direção e profundidade, reflexos naturais em pedras, metais e vidros, aspecto de câmera full-frame com lente de arquitetura',
  revista: 'look editorial de revista de arquitetura, para impressionar ao lado da original: luz natural marcante entrando pelas aberturas existentes, todas as luminárias, pendentes e fitas de LED existentes acesas e equilibradas com a luz do dia, profundidade com primeiro plano levemente mais escuro e fundo luminoso, contraste rico, brancos limpos, cor sofisticada levemente quente, reflexos e brilhos naturais nos materiais, aspecto de câmera full-frame com lente de arquitetura'
};

function cameraBlock(_a: Answers) {
  return 'Mesmo tamanho, proporção, ponto de vista e enquadramento da IMAGEM 1, pixel a pixel: não mude a câmera, não gire, não amplie, não recorte e não complete bordas — o prumo e o recorte são feitos depois, fora da IA.';
}

// Índice da primeira imagem de referência (recortes), na mesma ordem que a rota monta as imagens.
export function refBase(a: Answers) {
  const marcados = (a.adicionar || []).filter(i => (a.posicoes || {})[i]);
  return a.svc === 'ambientar' && marcados.length ? 3 : 2;
}

export function buildPrompt(an: Analysis, a: Answers, ajuste?: string, correcao?: string) {
  const inv = an.inventario.map(i => `${i.qtd} ${i.item}`).join('; ');
  const amb = a.svc === 'ambientar';
  const itens = a.adicionar || [];
  const pos = a.posicoes || {};
  const marcados = itens.filter(i => pos[i]);
  const lado = (x: number) => x < 0.33 ? 'no terço esquerdo' : x > 0.66 ? 'no terço direito' : 'no centro';
  const prof = (y: number) => y > 0.7 ? 'em primeiro plano' : y < 0.45 ? 'ao fundo' : 'no meio do ambiente';
  const listaItens = itens.map(i => pos[i]
    ? `${i} — exatamente no marcador ${marcados.indexOf(i) + 1} da IMAGEM 2 (${lado(pos[i][0])}, ${prof(pos[i][1])}), apoiado no piso ou na superfície que está sob o marcador`
    : `${i} — em posição coerente com a circulação, sem bloquear portas, gavetas ou passagens`).join('; ');
  const add = amb ? (itens.length
    ? ` 4) Acrescentar SOMENTE estes itens, um de cada, em escala real, no estilo ${a.estilo}, paleta ${a.paleta}, densidade ${a.densidade}: ${listaItens}. Nenhum outro móvel ou objeto entra.`
    : ` 4) Arrumar a cena no estilo ${a.estilo}, paleta ${a.paleta}, sem acrescentar móveis: no máximo objetos pequenos de cena sobre superfícies existentes.`) : '';
  const travas = (an.elementos || []).length ? ` Cores e materiais travados, peça por peça, sem nenhuma troca: ${an.elementos!.map(e => `${e.nome} = ${e.material} ${e.cor}`).join('; ')}.` : '';
  const pedidos = listaPedidos(an, a, ajuste);
  const temAjuste = pedidos.some(p => p.tipo === 'ajuste');
  const pedTxt = pedidos.length
    ? ` 3) Pedidos numerados do cliente, todos obrigatórios e conferidos um a um no final. Eles são executados usando só o que já existe na cena (pode retirar, mover, alinhar, fechar, endireitar, dobrar e organizar objetos existentes, sem acrescentar nada) e valem mais que qualquer interpretação sua da foto: ${pedidos.map((p, i) => `P${i + 1}) ${p.tipo === 'ajuste' ? '[AJUSTE] ' : ''}${p.texto}`).join('; ')}.${temAjuste ? ' Os pedidos marcados [AJUSTE] são os mais recentes: têm prioridade máxima e, se contradisserem um pedido anterior, vale o [AJUSTE].' : ''} Execute cada pedido exatamente no objeto indicado, sem estender a ação a outros objetos e sem tocar na arquitetura. Fechar ou alinhar porta, gaveta, janela ou cortina não é alterar a arquitetura: é a mesma peça, com o mesmo material e desenho, em outra posição.`
    : '';
  const base = refBase(a);
  const refs = (a.refs || []);
  const refTxt = refs.length ? ` ${refs.map((nome, k) => `A IMAGEM ${base + k} é um recorte ampliado de "${nome}" na própria IMAGEM 1`).join('; ')}. Esses recortes existem só como referência de aparência: ao mover, alinhar ou reposicionar esses itens, o modelo, a cor, o acabamento, os puxadores, as alças, as proporções e os detalhes precisam continuar idênticos ao recorte. É proibido substituir a peça por outra parecida.` : '';
  const corr = correcao ? ` A tentativa anterior errou: ${correcao}. Corrija exatamente isso.` : '';
  const neg = an.texturas.length ? ` Nas texturas artesanais (${an.texturas.join(', ')}): sem padrão repetido, sem escamas, sem leques, sem alinhamento, sem direção dominante, mantendo a escala do relevo da IMAGEM 1.` : '';
  const checklist = an.inventario.map(i => `${i.qtd} ${i.item}`).join(', ');
  const revelar = amb ? ' É proibido trocar acabamentos, cores ou materiais do que já existe; só entra o que está listado.' : ' Este é um serviço REVELAR: não acrescente nenhum objeto, móvel, material ou elemento que não exista na IMAGEM 1.';
  const ref2 = amb && marcados.length ? ' A IMAGEM 2 é a mesma foto com marcadores numerados que indicam onde cada item novo deve ficar; use-a só como mapa de posição e não reproduza os marcadores.' : '';
  const arquitetura = ' A arquitetura é intocável: paredes, painéis, portas, janelas, forro, piso e revestimentos nunca mudam de material, de cor, de desenho nem de posição, e nenhum deles ganha ou perde elementos — nenhuma parede lisa vira painel ripado ou de madeira, nenhum painel vira parede lisa, nenhuma porta, nicho, prateleira, viga ou moldura é criada ou apagada. Nenhum móvel, eletrodoméstico, luminária, louça ou metal é substituído por outro modelo: o que for movido ou alinhado continua sendo exatamente a mesma peça da IMAGEM 1, com o mesmo formato, a mesma cor, o mesmo acabamento e os mesmos puxadores.';

  return `Edite a IMAGEM 1, fotografia de celular de ${an.ambiente}, transformando-a em fotografia profissional de arquitetura. A IMAGEM 1 é a autoridade absoluta da arquitetura, dos materiais, das cores e da quantidade de objetos; arquitetura, móveis, objetos e materiais são mantidos da IMAGEM 1, mas a luz, a cor e o acabamento fotográfico devem ser refeitos por inteiro: o resultado precisa parecer uma fotografia profissional de arquitetura, nitidamente superior à foto de celular.${revelar}${arquitetura}${ref2}${refTxt}${travas}${corr} Inventário que precisa continuar idêntico: ${inv}. ${cameraBlock(a)} Alterações: 1) Luz: ${LUZ[a.luz]}. Tratamento fotográfico: ${TRAT[a.intensidade || 'editorial']}. 2) Remover, sem sombra e sem marca remanescente, todas as pessoas, rostos (inclusive em reflexos) e placas de veículos.${pedTxt}${add}${neg} Plano de forro único e arestas retas, sem cunhas nem faixas inventadas. Letreiros, placas e textos permanecem como na IMAGEM 1, sem letras novas. Nada entra na foto que não esteja listado. O que não pode mudar de jeito nenhum: ${a.nao_mudar || 'arquitetura, esquadrias, piso, revestimentos e mobiliário fixo'}. Verificação final, responda sim ou não antes de entregar: ${checklist}; nenhuma pessoa, rosto ou placa de veículo visível; enquadramento idêntico ao da IMAGEM 1; nenhum objeto não pedido;${pedidos.length ? ` cada pedido de P1 a P${pedidos.length} foi executado e está visível no resultado;` : ''} nenhum móvel ou eletrodoméstico trocado de modelo; nenhuma parede, painel, porta, janela, forro ou piso com material, desenho ou elementos diferentes da IMAGEM 1; texto inalterado. Qualquer não, refaça.

QUALIDADE MÁXIMA: saída com nitidez igual ou superior à IMAGEM 1, sem embaçamento, sem suavização plástica e sem ruído de compressão, com tudo em foco do primeiro plano ao fundo. É de extrema importância que a qualidade não se perca nesta geração. Texturas que precisam sair nítidas e individualizadas: ${[...an.texturas, ...an.materiais].join(', ')}. A cor fica travada na IMAGEM 1 como referência absoluta: ${an.cores_principais.join(', ')}. Ponto neutro declarado: ${an.ponto_neutro} é ${an.ponto_neutro_tom} neutro, sem dominante azul, verde, rosa ou magenta. Teste binário antes de entregar: o ponto neutro está neutro, sim ou não? A cor principal está idêntica à IMAGEM 1, sim ou não? As texturas listadas estão nítidas, sim ou não? Qualquer não, refaça.`;
}

export const FINAL_4K_PROMPT = `Reproduza a IMAGEM 1 em resolução 4K, idêntica em enquadramento, objetos, cores, luz e composição. Não altere, não acrescente e não remova nada. QUALIDADE MÁXIMA: nitidez igual ou superior à IMAGEM 1, sem embaçamento, sem suavização plástica, sem ruído de compressão, texturas individualizadas, cor idêntica à IMAGEM 1, ponto neutro sem dominante azul, verde, rosa ou magenta.`;

export function checkPrompt(an: Analysis, svc: string, pedidos: string[] = []) {
  const ped = pedidos.length ? `\n Atenção: o que foi pedido na lista de pedidos (objeto retirado, porta ou gaveta fechada, móvel alinhado, superfície organizada) não conta como erro em nenhum dos campos acima.`+`\n "pedidos": [{"n":1,"feito":true/false}, ...] (um item para cada pedido abaixo, na ordem; "feito" é true só quando a IMAGEM 2 mostra o pedido executado por inteiro no objeto indicado; se o objeto continua como na IMAGEM 1, é false): ${pedidos.map((p, i) => `P${i + 1}) ${p}`).join('; ')},` : '';
  return `IMAGEM 1 é a foto original; IMAGEM 2 é o resultado editado (${svc}). Compare as duas com rigor e responda SOMENTE em JSON:
{"cor_desviada": true/false (IMAGEM 2 ficou mais rosada, magenta ou amarelada que a original),
 "menos_nitida": true/false,
 "contagem_ok": true/false (inventário esperado: ${an.inventario.map(i => `${i.qtd} ${i.item}`).join('; ')}),
 "objeto_nao_pedido": true/false ${svc === 'revelar' ? '(qualquer objeto novo conta)' : '(só objetos fora da lista de decoração)'},
 "pessoa_visivel": true/false,
 "modelo_trocado": true/false (algum móvel, eletrodoméstico, luminária, louça ou metal da IMAGEM 1 virou outro modelo, outro formato, outra cor, outro acabamento ou outros puxadores na IMAGEM 2, inclusive quando a peça foi movida de lugar),
 "arquitetura_alterada": true/false (alguma parede, painel, porta, janela, forro, piso ou revestimento mudou de material, cor ou desenho, ou ganhou/perdeu elementos como ripado, painel de madeira, nicho, prateleira, viga ou moldura; também conta se parte de um móvel fixo ou da marcenaria sumiu ou foi cortada),
 "enquadramento_alterado": true/false (a IMAGEM 2 tem outro ponto de vista, outro recorte, outro zoom ou bordas completadas em relação à IMAGEM 1),${ped}
 "ponto_fraco": "uma frase curta dizendo o erro mais grave, ou null"}`;
}

export const naoFeitos = (c: any): number[] => (Array.isArray(c?.pedidos) ? c.pedidos : []).filter((p: any) => p && p.feito === false).map((p: any) => Number(p.n)).filter((n: number) => n > 0);

// Quantidade de falhas de uma checagem: serve para escolher a melhor entre duas tentativas.
export const falhas = (c: any) => !c ? 99 : [c.cor_desviada, c.menos_nitida, c.contagem_ok === false, c.objeto_nao_pedido, c.pessoa_visivel, c.modelo_trocado, c.arquitetura_alterada, c.enquadramento_alterado].filter(Boolean).length * 2 + naoFeitos(c).length;

export const passed = (c: any) => c && !c.cor_desviada && !c.menos_nitida && c.contagem_ok && !c.objeto_nao_pedido
  && !c.pessoa_visivel && !c.modelo_trocado && !c.arquitetura_alterada && !c.enquadramento_alterado && naoFeitos(c).length === 0;

// Converte o texto livre do cliente em ações concretas, olhando a foto.
export function interpretPrompt(an: Analysis, svc: string, t: { retirar?: string; melhorar?: string; ajuste?: string }) {
  const linhas = [t.retirar ? `O que tirar: "${t.retirar}"` : '', t.melhorar ? `O que arrumar ou melhorar: "${t.melhorar}"` : '', t.ajuste ? `Outro pedido: "${t.ajuste}"` : ''].filter(Boolean).join('\n');
  return `Você é produtor de fotografia de arquitetura. A imagem é a foto original de ${an?.ambiente || 'um ambiente'} e o cliente escreveu, com as palavras dele, o que quer na edição (serviço ${svc}):
${linhas}
Inventário lido na foto: ${(an?.inventario || []).map(i => `${i.qtd} ${i.item}`).join('; ') || 'não disponível'}.
Converta o que o cliente escreveu em ações concretas e verificáveis, olhando a foto, e responda SOMENTE em JSON:
{"acoes":[{"acao":"instrução exata para o editor, com verbo no infinitivo, dizendo qual objeto (forma, cor e posição na foto) e o que acontece com ele","resumo":"a mesma ação em uma frase curta e simples, para o cliente conferir","tipo":"retirar" | "arrumar" | "outro","fora":false,"motivo":null,"duvida":null}]}
Regras: 1) Não amplie o pedido além do que foi escrito e não invente pedidos. 2) Pedido vago (por exemplo "tirar a bagunça", "organizar a mesa") vira a lista dos objetos concretos que ele cobre nesta foto, dizendo o que fica e o que sai. 3) Se o pedido cita algo que não aparece na foto, devolva a ação com "duvida" explicando que o item não foi encontrado. 4) Se houver duas leituras possíveis, escolha a mais conservadora — a que mexe em menos coisas e nunca na arquitetura — e escreva em "duvida" a outra leitura, como pergunta curta. 5) "fora" é true, com "motivo" curto, quando o pedido exige trocar material, cor ou desenho de parede, piso, forro, porta, janela, revestimento ou móvel fixo, trocar um móvel ou eletrodoméstico por outro modelo${svc === 'revelar' ? ', ou acrescentar qualquer objeto que não existe na foto' : ''}. 6) Reposicionar um objeto é sempre a mesma peça mudando de lugar: diga de onde sai e onde fica. 7) No máximo 8 ações, uma por objeto ou grupo de objetos iguais, sem ponto e vírgula dentro do texto.`;
}
