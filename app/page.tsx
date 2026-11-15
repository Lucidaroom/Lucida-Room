import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/supabase';
import Provas, { type Par } from './Provas';

export const dynamic = 'force-dynamic';

const WPP = 'https://wa.me/5548998125929';
const MAIL = 'mailto:lucidaroom.ia@gmail.com';
const IG = 'https://instagram.com/lucidaroom.ia';

// Provas antes/depois. Os arquivos ficam em /public/fotos.
// Enquanto a lista estiver vazia, a seção não aparece.
const PARES: Par[] = [
  { id: 'salaverde', titulo: 'Sala verde', tag: 'Revelar', antes: '/fotos/10-sala-verde-antes.jpg', depois: '/fotos/10-sala-verde-depois.jpg',
    mudou: 'verticais corrigidas, luz de LED e spots equilibrada, cor fiel ao verde do projeto.',
    ficou: 'sofá, poltrona, estante, quadro e tapete — exatamente os da sala. Nada entrou, nada saiu.' },
  { id: 'ilha', titulo: 'Cozinha com ilha', tag: 'Ambientar', antes: '/fotos/08-ilha-antes.jpg', depois: '/fotos/08-ilha-depois.jpg',
    mudou: 'prumo e simetria corrigidos, luz de janela recuperada; saíram louça, panela e utensílios; entraram vaso, pão e azeite.',
    ficou: 'marcenaria, pedra, banquetas e eletros — os do projeto.' },
  { id: 'marcenaria', titulo: 'Detalhe de marcenaria', tag: 'Ambientar', antes: '/fotos/05-marcenaria-antes.jpg', depois: '/fotos/05-marcenaria-depois.jpg',
    mudou: 'luz de janela recuperada, cor e nitidez; livros e vasos neutros no lugar dos objetos do morador.',
    ficou: 'painel, muxarabi, palhinha e piso — os do projeto.' },
  { id: 'banheiro', titulo: 'Banheiro', tag: 'Ambientar', antes: '/fotos/07-banheiro-antes.jpg', depois: '/fotos/07-banheiro-depois.jpg',
    mudou: 'verticais corrigidas, fitas de LED equilibradas, reflexos controlados; toalhas, sabonete e planta como objetos de cena.',
    ficou: 'mármore, palhinha, serralheria e louças — os do projeto.' },
  { id: 'lavabo', titulo: 'Lavabo', tag: 'Ambientar', antes: '/fotos/06-lavabo-antes.jpg', depois: '/fotos/06-lavabo-depois.jpg',
    mudou: 'perspectiva e prumo, luz do espelho equilibrada, ruído removido; toalha, saboneteira e planta como objetos de cena.',
    ficou: 'revestimento, bancada, metais e marcenaria — os do imóvel.' },
  { id: 'pergolado', titulo: 'Fachada com pergolado', tag: 'Acabamento', antes: '/fotos/09-fachada-antes.jpg', depois: '/fotos/09-fachada-depois.jpg',
    mudou: 'luz de fim de tarde e vegetação do canteiro — ambientação, informada ao cliente.',
    ficou: 'brise, pergolado, muro de pedra e escada — os construídos.' }
];

const CHECKLIST: [string, string][] = [
  ['Prumo e nível', 'Verticais verticais, piso no horizonte certo.'],
  ['Perspectiva', 'Sem distorção de grande-angular.'],
  ['Escala', 'Sofá de 2,20 m continua com 2,20 m.'],
  ['Materiais', 'No Revelar, o porcelanato não vira mármore; a madeira não muda de tom.'],
  ['Luz plausível', 'Sombra coerente com a janela e com a hora do dia.'],
  ['Elementos construtivos', 'Nenhuma porta, janela, viga ou tomada inventada ou apagada.']
];

const GUIA: [string, string][] = [
  ['Lente 1×, nunca 0,5×', 'A ultra-wide entorta paredes e distorce móveis. Recue com os pés se não couber.'],
  ['Na altura do peito, reto', 'Sem inclinar o celular para cima ou para baixo — é o que faz as verticais convergirem.'],
  ['Ambiente inteiro', 'Do canto, com duas paredes e o piso visíveis.'],
  ['Luz natural, sem flash', 'De dia, cortina aberta. Luzes todas acesas ou todas apagadas, nunca misturado.'],
  ['Três fotos por ambiente', 'Duas gerais de cantos diferentes e um detalhe.'],
  ['Arquivo original', 'Sem filtro, sem recorte, sem compressão. No WhatsApp, envie como documento.']
];

const FAQ: [string, string][] = [
  ['Vocês inventam coisas na foto?', 'No Revelar, nunca: nada entra que não exista no imóvel. No Ambientar, entram mobiliário, decoração e, se pedido, acabamentos — e isso é sempre informado como simulação.'],
  ['A foto fica com cara de IA?', 'É o erro que mais combatemos. Antes de entregar, o resultado é comparado com a sua foto e reprovado se a cor desviou, se perdeu nitidez, se apareceu objeto que ninguém pediu, se um móvel virou outro modelo ou se uma parede mudou de material. Reprovou, refaz.'],
  ['Quanto tempo leva?', 'Na plataforma, cerca de um minuto por foto. No sob medida, Revelar em 24 h e Ambientar em 72 h; com urgência, +50%.'],
  ['E se eu não gostar?', 'Na plataforma, o Revelar inclui um ajuste e o Ambientar inclui dois, pedidos por texto. No sob medida, uma rodada de ajuste está incluída sobre o que foi combinado; mudar a direção depois da entrega conta como variação extra (R$ 29).'],
  ['Posso começar pelo Revelar e ambientar depois?', 'Pode. No sob medida, até 30 dias após a entrega o Ambientar paga só a diferença: + R$ 30 (decoração) ou + R$ 60 (com acabamentos).'],
  ['Serve foto de WhatsApp?', 'Serve, mas rende menos: o WhatsApp comprime a imagem. Envie como documento ou por e-mail, no arquivo original.'],
  ['Posso usar nos anúncios e nas redes?', 'Pode. As imagens são suas. Em anúncio de venda ou locação, indique que a decoração ou o acabamento é ilustrativo quando usar Ambientar ou troca de acabamento.']
];

const SERVICOS: [string, string, string, string][] = [
  ['Revelar', '2 créditos · 24 h no sob medida', 'A mesma foto, com cara de fotografia.',
    'Perspectiva, prumo, luz, cor, ruído e nitidez de câmera profissional. Cena limpa: saem pessoas, cabos e objetos soltos, e o que está fora do lugar é arrumado — porta fechada, cadeira alinhada, bancada organizada. Nada entra na foto que não exista no imóvel.'],
  ['Ambientar', '4 créditos · 72 h no sob medida', 'O mesmo espaço, com outra decoração.',
    'Inclui o Revelar, mais mobiliário, decoração e objetos de cena em escala real, no estilo e na paleta que você escolher. A arquitetura, os materiais e a marcenaria continuam exatamente como são. Sempre informado como simulação.'],
  ['Trocar acabamentos', '6 créditos · + R$ 30 no sob medida', 'Outra cor de parede, outro piso, outra marcenaria.',
    'Você marca a superfície e escolhe entre as opções propostas para aquela foto. A troca fica restrita à superfície marcada: o resto da imagem não muda. Na plataforma, duas superfícies por foto custam 8 créditos. Sempre informado como simulação.']
];

const PLANOS: [string, string, string, string, string][] = [
  ['Avulso', '4 créditos', 'R$ 19,90', 'Uma foto Ambientar ou duas Revelar.', ''],
  ['Pacote', '24 créditos', 'R$ 99', 'Validade de 60 dias. Sem assinatura.', ''],
  ['Essencial', '24 créditos por mês', 'R$ 79', 'Para quem entrega uma obra por mês.', ''],
  ['Profissional', '60 créditos por mês', 'R$ 169', 'Para escritório e corretor com giro constante.', 'destaque'],
  ['Imobiliária', '160 créditos por mês', 'R$ 379', 'Para equipe com vários anúncios por semana.', '']
];

function Secao({ n, titulo, children, id }: { n: string; titulo: string; children: React.ReactNode; id?: string }) {
  return (
    <section className="stack" id={id}>
      <div className="mono">{n}</div>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

export default async function Home() {
  const user = await currentUser();
  if (user) redirect('/painel');

  return (
    <>
      <section className="hero">
        <div className="mono">Lucida Room</div>
        <h1>Foto de celular.<br />Olhar de arquitetura.</h1>
        <p className="lead">Mande a foto que você já tirou. Ela volta com cara de fotografia — feita com IA, conferida por arquiteto, com um checklist técnico que reprova o que não parece o seu espaço.</p>
        <div className="row">
          <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
          <a className="btn sec" href="#sob-medida">Quero que façam por mim</a>
        </div>
        <small className="mono" style={{ textTransform: 'none', letterSpacing: 0 }}>Sem cartão para testar · resultado em cerca de 1 minuto na plataforma · 24 h no sob medida</small>
      </section>

      <Secao n="01 · O problema" titulo="A foto do celular já existe. Falta ela parecer fotografia.">
        <div className="split">
          <div className="card">
            <div className="mono">Fotógrafo · referência de mercado</div>
            <b style={{ fontSize: 26 }}>R$ 800–1.500</b>
            <small>Não é preço da Lucida Room. É quanto custa uma sessão: por imóvel, agenda de dias, deslocamento. Em média R$ 25–45 por foto.</small>
          </div>
          <div className="card dest">
            <div className="mono">Lucida Room</div>
            <b style={{ fontSize: 26 }}>R$ 4,74–34,90</b>
            <small>Por foto, a partir da foto que você já tem. Na plataforma, a partir de R$ 4,74 no plano maior. No sob medida, a partir de R$ 26,70.</small>
          </div>
          <div className="card">
            <div className="mono">App de IA sozinho</div>
            <b style={{ fontSize: 26 }}>Inventa</b>
            <small>Troca o piso, cria janelas, muda a escala do móvel. Fica bonito, mas não é o seu espaço.</small>
          </div>
        </div>
      </Secao>

      {PARES.length > 0 && (
        <Secao n="02 · Provas" titulo="O que mudou está escrito." id="provas">
          <p className="lead">Sempre antes → depois, com a imagem inteira. Arraste a linha; a legenda diz o que mudou e o que ficou igual.</p>
          <Provas pares={PARES} />
          <small>Nada inventado no Revelar · simulação declarada no Ambientar e na troca de acabamentos.</small>
        </Secao>
      )}

      <Secao n="03 · Dois caminhos" titulo="Você faz na plataforma, ou nós fazemos por você." id="caminhos">
        <p className="lead">O mesmo motor de imagem e o mesmo checklist nos dois. A diferença é quem conduz.</p>
        <div className="split">
          <div className="via">
            <div className="mono">Caminho 1 · plataforma</div>
            <h3>Você faz na plataforma</h3>
            <p className="lead">Você sobe a foto, confere a leitura do espaço, escolhe o que muda e recebe o resultado em cerca de um minuto. Ajustes pedidos ali mesmo, por texto.</p>
            <ol className="passos">
              <li>Suba a foto do celular.</li>
              <li>A plataforma lê o espaço e sugere o que arrumar, item por item. Você marca e desmarca.</li>
              <li>Antes de gerar, você vê a lista do que vai ser feito e confirma.</li>
              <li>Recebe a foto, compara com a original e pede ajustes por texto.</li>
              <li>Baixa em 4K, nos formatos de feed, stories, quadrado e site.</li>
            </ol>
            <ul className="marcas">
              <li>Resultado em cerca de 1 minuto</li>
              <li>Ajustes inclusos: 1 no Revelar, 2 no Ambientar</li>
              <li>A partir de R$ 4,74 por foto no plano maior</li>
              <li>3 fotos grátis para testar, sem cartão</li>
            </ul>
            <Link className="btn" href="/entrar">Começar com 3 fotos grátis</Link>
            <small>Melhor para: volume, prazo curto, foto que precisa sair hoje.</small>
          </div>

          <div className="via" id="sob-medida">
            <div className="mono">Caminho 2 · sob medida</div>
            <h3>Sob medida, direto comigo</h3>
            <p className="lead">Você manda as fotos e conversamos sobre o que cada imagem precisa. Eu conduzo a geração, confiro cada resultado e só envio o que passaria no meu próprio portfólio.</p>
            <ol className="passos">
              <li>Mande as fotos pelo WhatsApp ou por e-mail, no arquivo original.</li>
              <li>Responde um questionário curto: perspectiva, luz, tratamento e o que sai da cena. No Ambientar, também estilo, paleta e o que fica, sai ou troca.</li>
              <li>Eu trabalho as imagens e mando as versões para você escolher.</li>
              <li>Uma rodada de ajuste está incluída sobre o que foi combinado.</li>
              <li>Entrega em alta resolução: Revelar em 24 h, Ambientar em 72 h.</li>
            </ol>
            <ul className="marcas">
              <li>Cada imagem conferida por arquiteto, uma a uma</li>
              <li>Revelar a partir de R$ 26,70 por foto</li>
              <li>Ambientar a partir de R$ 48,90 por imagem</li>
              <li>Troca de acabamento e decisão de projeto inclusas na conversa</li>
            </ul>
            <div className="row">
              <a className="btn" href={WPP} target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>
              <a className="btn sec" href={MAIL}>Enviar por e-mail</a>
            </div>
            <small>Melhor para: foto de portfólio, acabamento específico, espaço que pede decisão de projeto.</small>
          </div>
        </div>
      </Secao>

      <Secao n="04 · Dois serviços" titulo="O que é real fica real. O que é simulação, a gente avisa." id="servicos">
        <div className="grid">
          {SERVICOS.map(([nome, custo, resumo, txt]) => (
            <div key={nome} className="card">
              <div className="mono">{custo}</div>
              <h3>{nome}</h3>
              <b style={{ fontWeight: 500 }}>{resumo}</b>
              <small>{txt}</small>
            </div>
          ))}
        </div>
      </Secao>

      <Secao n="05 · Critério de arquitetura" titulo="Qualquer um tem a ferramenta. O critério é de arquitetura.">
        <p className="lead">A IA está em todo o processo — não escondemos isso. O que muda é o critério: cada direção é escrita para aquela foto e nada sai sem passar pelo checklist técnico de aprovação.</p>
        <div className="grid">
          {CHECKLIST.map(([t, d], i) => (
            <div key={t} className="card">
              <div className="mono">{String(i + 1).padStart(2, '0')}</div>
              <b style={{ fontWeight: 500 }}>{t}</b>
              <small>{d}</small>
            </div>
          ))}
        </div>
      </Secao>

      <Secao n="06 · Para quem" titulo="Para quem é." id="publicos">
        <div className="split">
          <div className="card">
            <h3>Arquitetos e designers</h3>
            <b style={{ fontWeight: 500 }}>Toda obra entregue vira portfólio.</b>
            <ul className="marcas">
              <li>Revelar 10 fotos por R$ 267 no sob medida — menos que uma sessão de fotógrafo</li>
              <li>Registro no dia da entrega, antes de o cliente mudar o layout</li>
              <li>Ambientar quando a decoração do morador não representa o projeto</li>
            </ul>
          </div>
          <div className="card">
            <h3>Corretores e imobiliárias</h3>
            <b style={{ fontWeight: 500 }}>A foto é o primeiro clique do anúncio.</b>
            <ul className="marcas">
              <li>Imóvel ocupado: o Revelar tira os objetos do morador sem tocar no imóvel</li>
              <li>Imóvel vazio: o Ambientar mostra o tamanho real com mobiliário em escala</li>
              <li>Toda ambientação é informada como simulação</li>
            </ul>
          </div>
          <div className="card">
            <h3>Restaurantes, cafés e lojas</h3>
            <b style={{ fontWeight: 500 }}>O espaço é bonito. A foto das redes, não.</b>
            <ul className="marcas">
              <li>Revelar 5 fotos por R$ 149 no sob medida: salão, balcão, fachada, vitrine</li>
              <li>Clientes e equipe saem da cena; o espaço fica como é</li>
              <li>Letreiro e cardápio ficam exatamente como estão — nada de texto reescrito</li>
            </ul>
          </div>
        </div>
      </Secao>

      <Secao n="07 · Preços" titulo="Dois caminhos, dois preços. Nada misturado." id="precos">
        <div className="card">
          <div className="mono">Caminho 1 · plataforma · créditos</div>
          <p className="lead">Um crédito vale em qualquer serviço. Os créditos do plano mensal renovam todo mês; os do pacote valem 60 dias.</p>
          <div className="grid">
            {PLANOS.map(([nome, cred, preco, txt, dest]) => (
              <div key={nome} className={`card${dest ? ' dest' : ''}`}>
                {dest ? <div className="mono">Mais escolhido</div> : <div className="mono">&nbsp;</div>}
                <h3>{nome}</h3>
                <b style={{ fontSize: 26 }}>{preco}</b>
                <div className="mono" style={{ textTransform: 'none', letterSpacing: 0 }}>{cred}</div>
                <small>{txt}</small>
              </div>
            ))}
          </div>
          <div className="tabela">
            <div><span>Plano</span><span>Revelar</span><span>Ambientar</span><span>Trocar acabamento</span></div>
            <div><span>Avulso</span><span>R$ 9,95</span><span>R$ 19,90</span><span>—</span></div>
            <div><span>Pacote</span><span>R$ 8,25</span><span>R$ 16,50</span><span>R$ 24,75</span></div>
            <div><span>Essencial</span><span>R$ 6,58</span><span>R$ 13,16</span><span>R$ 19,75</span></div>
            <div><span>Profissional</span><span>R$ 5,63</span><span>R$ 11,27</span><span>R$ 16,90</span></div>
            <div><span>Imobiliária</span><span>R$ 4,74</span><span>R$ 9,48</span><span>R$ 14,22</span></div>
          </div>
          <small>Pix e cartão pelo Mercado Pago. Teste com 3 prévias grátis, sem cartão: as prévias saem com marca d&apos;água e o download é liberado depois da compra.</small>
          <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
        </div>

        <div className="card">
          <div className="mono">Caminho 2 · sob medida · por foto</div>
          <div className="split">
            <div className="stack">
              <b style={{ fontWeight: 500 }}>Revelar · entrega em 24 h</b>
              <div className="tabela">
                <div><span>Pacote</span><span>Por foto</span><span>Total</span><span>&nbsp;</span></div>
                <div><span>1 foto</span><span>R$ 34,90</span><span>R$ 34,90</span><span>&nbsp;</span></div>
                <div><span>5 fotos</span><span>R$ 29,80</span><span>R$ 149</span><span>&nbsp;</span></div>
                <div><span>10 fotos</span><span>R$ 26,70</span><span>R$ 267</span><span>pacote máximo</span></div>
              </div>
              <small>10 fotos por menos que uma sessão de fotógrafo.</small>
            </div>
            <div className="stack">
              <b style={{ fontWeight: 500 }}>Ambientar · entrega em 72 h</b>
              <div className="tabela">
                <div><span>Pacote</span><span>Por imagem</span><span>Total</span><span>&nbsp;</span></div>
                <div><span>1 imagem</span><span>R$ 64,90</span><span>R$ 64,90</span><span>&nbsp;</span></div>
                <div><span>5 imagens</span><span>R$ 55,80</span><span>R$ 279</span><span>&nbsp;</span></div>
                <div><span>10 imagens</span><span>R$ 48,90</span><span>R$ 489</span><span>pacote máximo</span></div>
              </div>
              <small>Acabamentos (parede, piso, revestimento, marcenaria): + R$ 30 por imagem. Variação extra da mesma imagem: R$ 29.</small>
            </div>
          </div>
          <small>Começou no Revelar? Até 30 dias após a entrega, o Ambientar paga só a diferença: + R$ 30 (decoração) ou + R$ 60 (com acabamentos). Urgência: +50%. Uma rodada de ajuste incluída sobre o que foi combinado.</small>
          <div className="row">
            <a className="btn" href={WPP} target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>
            <a className="btn sec" href={MAIL}>Enviar por e-mail</a>
          </div>
        </div>
      </Secao>

      <Secao n="08 · Antes de fotografar" titulo="Quanto melhor a base, melhor o resultado.">
        <p className="lead">O que não aparece na sua foto não entra na imagem final. Seis cuidados que levam um minuto.</p>
        <div className="grid">
          {GUIA.map(([t, d], i) => (
            <div key={t} className="card">
              <div className="mono">{String(i + 1).padStart(2, '0')}</div>
              <b style={{ fontWeight: 500 }}>{t}</b>
              <small>{d}</small>
            </div>
          ))}
        </div>
      </Secao>

      <Secao n="09 · Perguntas frequentes" titulo="Respostas curtas.">
        <div className="stack">
          {FAQ.map(([q, a]) => (
            <div key={q} className="card">
              <b style={{ fontWeight: 500 }}>{q}</b>
              <small>{a}</small>
            </div>
          ))}
        </div>
      </Secao>

      <section className="fecho">
        <h2>Comece pela foto que você já tem</h2>
        <div className="row">
          <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
          <a className="btn sec" href={WPP} target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>
        </div>
        <div className="row">
          <a href={IG} target="_blank" rel="noopener">@lucidaroom.ia</a>
          <a href={MAIL}>lucidaroom.ia@gmail.com</a>
          <span className="mono">(48) 99812-5929</span>
        </div>
        <small>A Lucida Room não esconde a IA: ela está em todo o processo. O que garantimos é o critério de quem aprova. Toda ambientação é informada ao cliente como simulação.</small>
      </section>
    </>
  );
}
