import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/supabase';
import Provas, { type Par } from './Provas';

export const dynamic = 'force-dynamic';

const TXT = encodeURIComponent('Oi, Filipe. Vim pelo site da Lucida Room e quero tratar fotos de ');
const WPP = `https://wa.me/5548998125929?text=${TXT}`;
const MAIL = 'mailto:lucidaroom.ia@gmail.com?subject=Pedido%20Lucida%20Room';

const PARES: Par[] = [
  { id: 'salaverde', titulo: 'Sala verde', tag: 'Revelar', antes: '/10-sala-verde-antes.jpg', depois: '/10-sala-verde-depois.jpg',
    mudou: 'verticais corrigidas, luz de LED e spots equilibrada, cor fiel ao verde do projeto.',
    ficou: 'sofá, poltrona, estante, quadro e tapete — exatamente os da sala. Nada entrou, nada saiu.' },
  { id: 'jantar', titulo: 'Sala de jantar', tag: 'Ambientar', antes: '/11-jantar-antes.jpg', depois: '/11-jantar-depois.jpg',
    mudou: 'prumo e luz equilibrados; saíram os objetos de uso do dia a dia; estante composta com livros, cerâmicas e plantas; mesa posta.',
    ficou: 'mesa, cadeiras de palhinha, pendentes, painel de madeira e estante — os do projeto.' },
  { id: 'quarto', titulo: 'Quarto', tag: 'Ambientar', antes: '/12-quarto-antes.jpg', depois: '/12-quarto-depois.jpg',
    mudou: 'enquadramento, luz da sanca e das arandelas; saiu a cadeira de apoio com objetos; entraram mesas de cabeceira, quadros e roupa de cama.',
    ficou: 'cabeceira estofada, arandelas, cortina e piso — os do projeto.' },
  { id: 'ilha', titulo: 'Cozinha com ilha', tag: 'Ambientar', antes: '/08-ilha-antes.jpg', depois: '/08-ilha-depois.jpg',
    mudou: 'prumo e simetria corrigidos, luz de janela recuperada; saíram louça, panela e utensílios; entraram vaso, pão e azeite.',
    ficou: 'marcenaria, pedra, banquetas e eletros — os do projeto.' },
  { id: 'marcenaria', titulo: 'Detalhe de marcenaria', tag: 'Ambientar', antes: '/05-marcenaria-antes.jpg', depois: '/05-marcenaria-depois.jpg',
    mudou: 'luz de janela recuperada, cor e nitidez; livros e vasos neutros no lugar dos objetos do morador.',
    ficou: 'painel, muxarabi, palhinha e piso — os do projeto.' },
  { id: 'banheiro', titulo: 'Banheiro', tag: 'Ambientar', antes: '/07-banheiro-antes.jpg', depois: '/07-banheiro-depois.jpg',
    mudou: 'verticais corrigidas, fitas de LED equilibradas, reflexos controlados; toalhas, sabonete e planta como objetos de cena.',
    ficou: 'mármore, palhinha, serralheria e louças — os do projeto.' },
  { id: 'lavabo', titulo: 'Lavabo', tag: 'Ambientar', antes: '/06-lavabo-antes.jpg', depois: '/06-lavabo-depois.jpg',
    mudou: 'perspectiva e prumo, luz do espelho equilibrada, ruído removido; toalha, saboneteira e planta como objetos de cena.',
    ficou: 'revestimento, bancada, metais e marcenaria — os do imóvel.' },
  { id: 'pergolado', titulo: 'Fachada com pergolado', tag: 'Acabamento', antes: '/09-fachada-antes.jpg', depois: '/09-fachada-depois.jpg',
    mudou: 'luz de fim de tarde e vegetação do canteiro — ambientação, informada ao cliente.',
    ficou: 'brise, pergolado, muro de pedra e escada — os construídos.' }
];

const PASSOS: [string, string][] = [
  ['Mande as fotos', 'Pelo WhatsApp ou por e-mail, no arquivo original do celular. Várias de uma vez.'],
  ['Combinamos o que muda', 'Eu olho cada foto e digo o que dá para fazer: enquadramento, luz, o que sai da cena e, no Ambientar, a decoração.'],
  ['Receba no prazo', 'Revelar em 24 h, Ambientar em 72 h. Cada imagem conferida por mim antes de sair.'],
  ['Ajuste e use', 'Uma rodada de ajuste inclusa. Entrega em alta resolução, pronta para portfólio, anúncio e redes.']
];

const CHECK: [string, string][] = [
  ['Prumo', 'Verticais retas, sem parede caindo.'],
  ['Perspectiva', 'Ponto de vista de fotografia de arquitetura, sem distorção de grande-angular.'],
  ['Escala', 'Móvel e objeto no tamanho real do espaço.'],
  ['Materiais', 'Piso, pedra e marcenaria continuam os do imóvel.'],
  ['Luz plausível', 'Luz que poderia existir naquele lugar e naquela hora.'],
  ['Elementos construtivos', 'Nenhuma janela, porta ou parede inventada.']
];

const FAQ: [string, string][] = [
  ['É feito com IA?', 'Sim, e não escondemos. A IA está na execução; o critério é de arquiteto. Cada imagem é comparada com a sua foto original e só sai se passar no checklist de seis pontos.'],
  ['Vocês inventam coisas na foto?', 'No Revelar, nunca: nada entra que não exista no imóvel. No Ambientar, entram mobiliário, decoração e, se pedido, acabamentos — e isso é sempre informado como simulação.'],
  ['Quanto tempo leva?', 'Revelar em até 24 h e Ambientar em até 72 h, contados da confirmação do pedido. Precisa antes? Pergunte pela urgência.'],
  ['E se eu não gostar?', 'Uma rodada de ajuste está incluída sobre o que foi combinado. Se a foto não permitir o resultado pedido, eu aviso antes de começar.'],
  ['Como pago?', 'Por Pix ou link de pagamento do Mercado Pago (cartão), depois de combinarmos o pedido pelo WhatsApp.'],
  ['Posso usar nos anúncios e nas redes?', 'Pode. As imagens são suas. Em anúncio de venda ou locação, indique que a decoração ou o acabamento é ilustrativo quando usar Ambientar.'],
  ['E as pessoas que aparecem na foto?', 'Saem da cena, junto com rostos, placas de carro e objetos pessoais.'],
  ['E a plataforma automática?', 'Está em construção. Quando abrir, você vai poder fazer tudo sozinho, direto no site. Por enquanto, todo pedido é feito comigo.']
];

export default async function Home() {
  const user = await currentUser();
  if (user) redirect('/painel');
  const destaque = PARES[1];

  return (
    <>
      <section className="lr-band lr-dark lr-hero">
        <div className="lr-in lr-cols">
          <div className="lr-col">
            <h1 className="lr-h1">Foto de celular.<br />Olhar de arquitetura.</h1>
            <p className="lr-lead">Você manda a foto que já tirou. Eu, arquiteto, trato e confiro cada imagem até ela parecer fotografia — sem inventar o que não existe no imóvel.</p>
            <div className="row">
              <a className="lr-btn claro" href={WPP} target="_blank" rel="noopener">Pedir pelo WhatsApp</a>
              <a className="lr-btn contorno" href="#precos">Ver preços</a>
            </div>
            <div className="lr-mono claro">Revelar em 24 h · Ambientar em 72 h · ajuste incluído</div>
          </div>
          <div className="lr-col">
            <Provas pares={[destaque]} semAbas />
            <div className="row"><span className="lr-tag amb">{destaque.tag}</span><small className="lr-sub">{destaque.titulo} · arraste a linha</small></div>
          </div>
        </div>
      </section>

      <section className="lr-band">
        <div className="lr-in lr-col lg">
          <div className="lr-mono">01 · O problema</div>
          <h2 className="lr-h2">A foto do celular já existe. Falta ela parecer fotografia.</h2>
          <div className="lr-tres">
            <div className="lr-num tracejado">
              <span className="lr-selo">Fotógrafo · referência de mercado</span>
              <b className="riscar">R$ 800–2.000</b>
              <p>Não é preço da Lucida Room. É quanto custa uma sessão de fotógrafo: por imóvel, com agenda e deslocamento.</p>
            </div>
            <div className="lr-num">
              <b>R$ 26,70</b>
              <p>Lucida Room · Revelar, por foto no pacote de 10. A partir da foto que você já tem, entregue em 24 h.</p>
            </div>
            <div className="lr-num">
              <b>Inventa</b>
              <p>App de IA sozinho. Troca o piso, cria janelas, muda a escala do móvel. Fica bonito, mas não é o seu espaço.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lr-band sem-topo" id="provas">
        <div className="lr-in lr-col lg">
          <div className="lr-mono">02 · Provas</div>
          <h2 className="lr-h2">O que mudou está escrito.</h2>
          <p className="lr-lead escuro">Sempre antes → depois, com a imagem inteira. Arraste a linha; a legenda diz o que mudou e o que ficou igual.</p>
          <Provas pares={PARES} />
          <div className="lr-centro">
            <a className="lr-btn" href={WPP} target="_blank" rel="noopener">Quero isso nas minhas fotos</a>
            <div className="lr-mono">Nada inventado no Revelar · simulação declarada no Ambientar</div>
          </div>
        </div>
      </section>

      <section className="lr-band lr-dark" id="como">
        <div className="lr-in lr-col lg">
          <div className="lr-mono lilas">03 · Como funciona</div>
          <h2 className="lr-h2">Quatro passos. Nenhum agendamento.</h2>
          <div className="lr-quatro">
            {PASSOS.map(([t, d], i) => (
              <div key={t} className="lr-passo"><div className="lr-mono lilas">0{i + 1}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lr-band">
        <div className="lr-in lr-col lg">
          <div className="lr-mono">04 · Dois serviços</div>
          <h2 className="lr-h2">O que é real fica real. O que é simulação, a gente avisa.</h2>
          <div className="lr-dois">
            <div className="lr-serv">
              <span className="lr-tag">Revelar</span>
              <h3>A mesma foto, com cara de fotografia.</h3>
              <ul>
                <li><b>O espaço fica exatamente como está.</b> Corrijo perspectiva, prumo, luz, cor, ruído e nitidez.</li>
                <li><b>Cena limpa.</b> Saem pessoas, rostos, placas de carro, cabos e objetos soltos.</li>
              </ul>
              <div className="lr-mono">Nada entra na foto que não exista no espaço.</div>
            </div>
            <div className="lr-serv roxo">
              <span className="lr-tag amb">Ambientar</span>
              <h3>O mesmo espaço, com outra decoração.</h3>
              <ul>
                <li><b>Decoração.</b> Inclui o Revelar + mobiliário, decoração e objetos de cena em escala real.</li>
                <li><b>Acabamentos.</b> Se quiser, também cor de parede, piso, revestimento e marcenaria.</li>
              </ul>
              <div className="lr-mono lilas">Sempre informado como simulação.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="lr-band lr-grafite" id="quem">
        <div className="lr-in lr-cols">
          <div className="lr-col">
            <div className="lr-mono lilas">05 · Quem confere</div>
            <h2 className="lr-h2">Qualquer um tem a ferramenta. <span className="lilas">O critério é de arquitetura.</span></h2>
            <div className="lr-perfil">
              <div className="retrato" />
              <div className="lr-col sm">
                <b>Filipe Storch</b>
                <p>Arquiteto e urbanista, CAU ativo. Nove anos de projeto, mais de 200 projetos entregues em residencial e comercial. Cada imagem sai das minhas mãos, não de uma fila automática.</p>
              </div>
            </div>
          </div>
          <div className="lr-col">
            <div className="lr-mono lilas">Checklist de cada imagem</div>
            <div>
              {CHECK.map(([t, d], i) => (
                <div key={t} className="lr-check"><span className="lr-mono lilas">0{i + 1}</span><div><b>{t}</b><p>{d}</p></div></div>
              ))}
            </div>
            <Link href="/criterio" className="lr-link">Ver o critério completo →</Link>
          </div>
        </div>
      </section>

      <section className="lr-band" id="paraquem">
        <div className="lr-in lr-col lg">
          <div className="lr-mono">06 · Para quem</div>
          <h2 className="lr-h2">Para quem é.</h2>
          <div className="lr-tres">
            <div className="lr-publico">
              <div className="lr-mono">Arquitetos e designers</div>
              <h3>Toda obra entregue vira portfólio.</h3>
              <ul>
                <li>10 fotos Revelar por R$ 267 — menos que uma sessão de fotógrafo.</li>
                <li>Registro no dia da entrega, antes de o cliente mudar o layout.</li>
                <li>Ambientar quando a decoração do morador não representa o projeto.</li>
              </ul>
            </div>
            <div className="lr-publico">
              <div className="lr-mono">Corretores e imobiliárias</div>
              <h3>A foto é o primeiro clique do anúncio.</h3>
              <ul>
                <li>Imóvel ocupado: o Revelar tira os objetos do morador sem tocar no imóvel.</li>
                <li>Imóvel vazio: o Ambientar mostra o tamanho real com mobiliário em escala.</li>
                <li>Toda ambientação é informada como simulação.</li>
              </ul>
            </div>
            <div className="lr-publico">
              <div className="lr-mono">Restaurantes, cafés e lojas</div>
              <h3>O espaço é bonito. A foto das redes, não.</h3>
              <ul>
                <li>5 fotos Revelar por R$ 149: salão, balcão, fachada, vitrine.</li>
                <li>Clientes e equipe saem da cena; o espaço fica como é.</li>
                <li>Letreiro e cardápio ficam exatamente como estão.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lr-band linha" id="precos">
        <div className="lr-in lr-col lg">
          <div className="lr-mono">07 · Preços de lançamento</div>
          <h2 className="lr-h2">Por foto, sem assinatura.</h2>
          <p className="lr-lead escuro">Mesmo preço para todos. Quanto mais fotos no pedido, menor o valor por foto.</p>
          <div className="lr-dois">
            <div className="lr-preco">
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="lr-tag">Revelar</span><span className="lr-mono">Entrega em 24 h</span></div>
              <div className="lr-linhas">
                <span>1 foto</span><b>R$ 34,90</b>
                <span>5 fotos <small>R$ 29,80 cada</small></span><b>R$ 149</b>
                <span>10 fotos <small>R$ 26,70 cada</small></span><b>R$ 267</b>
              </div>
              <a className="lr-btn" href={WPP} target="_blank" rel="noopener">Pedir Revelar</a>
              <div className="lr-pagar"><span>Já combinou? Pagar:</span><a href="https://mpago.la/11J9GvU" target="_blank" rel="noopener">1 foto</a><a href="https://mpago.la/2wu6F8w" target="_blank" rel="noopener">5 fotos</a><a href="https://mpago.la/1hMZXow" target="_blank" rel="noopener">10 fotos</a></div>
            </div>
            <div className="lr-preco">
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="lr-tag amb">Ambientar</span><span className="lr-mono">Entrega em 72 h</span></div>
              <div className="lr-linhas">
                <span>1 imagem</span><b>R$ 54,90</b>
                <span>5 imagens <small>R$ 45,80 cada</small></span><b>R$ 229</b>
                <span>10 imagens <small>R$ 39,90 cada</small></span><b>R$ 399</b>
              </div>
              <a className="lr-btn" href={WPP} target="_blank" rel="noopener">Pedir Ambientar</a>
              <div className="lr-pagar"><span>Já combinou? Pagar:</span><a href="https://mpago.la/1neCWqS" target="_blank" rel="noopener">1 imagem</a><a href="https://mpago.la/2ehcZgH" target="_blank" rel="noopener">5 imagens</a><a href="https://mpago.la/1qToUHX" target="_blank" rel="noopener">10 imagens</a></div>
            </div>
          </div>
          <ul className="lr-regras">
            <li>Troca de acabamento (parede, piso, revestimento, marcenaria): + R$ 30 por imagem.</li>
            <li>Uma rodada de ajuste inclusa sobre o que foi combinado.</li>
            <li>Pix ou cartão pelo Mercado Pago. Combine o pedido no WhatsApp antes de pagar.</li>
            <li>Valores de lançamento.</li>
          </ul>
        </div>
      </section>

      <section className="lr-band lr-breve">
        <div className="lr-in lr-cols">
          <div className="lr-col sm">
            <div className="lr-mono">Em breve</div>
            <h2 className="lr-h2 menor">Uma plataforma para você fazer sozinho.</h2>
          </div>
          <p className="lr-lead escuro">O mesmo critério, direto no site: você sobe a foto, marca o que muda e recebe o resultado. Está em construção. Enquanto isso, cada pedido é feito comigo, foto por foto.</p>
        </div>
      </section>

      <section className="lr-band">
        <div className="lr-in lr-col lg">
          <div className="lr-mono">08 · Perguntas</div>
          <h2 className="lr-h2">Respostas curtas.</h2>
          <div>
            {FAQ.map(([q, a]) => (
              <details key={q} className="lr-faq"><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
          <Link href="/guia" className="lr-link">Antes de fotografar: 6 cuidados que mudam o resultado →</Link>
        </div>
      </section>

      <section className="lr-band lr-dark">
        <div className="lr-in lr-col lg lr-fim">
          <h2 className="lr-h2">Entre em contato para transformar as fotos que você já tem.</h2>
          <div className="row">
            <a className="lr-btn claro" href={WPP} target="_blank" rel="noopener">Pedir pelo WhatsApp</a>
            <a className="lr-btn contorno" href={MAIL}>Por e-mail</a>
          </div>
          <div className="row lr-mono claro">
            <a href="https://instagram.com/lucidaroom.ia" target="_blank" rel="noopener">@lucidaroom.ia</a>
            <a href={MAIL}>lucidaroom.ia@gmail.com</a>
            <span>(48) 99812-5929</span>
            <Link href="/entrar">Entrar</Link>
          </div>
          <small className="lr-sub">A Lucida Room não esconde a IA: ela está em todo o processo. O que garantimos é o critério de quem aprova. Toda ambientação é informada ao cliente como simulação.</small>
        </div>
      </section>
    </>
  );
}
