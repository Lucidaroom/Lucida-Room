import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/supabase';
import Provas, { type Par } from './Provas';

export const dynamic = 'force-dynamic';

const TXT = encodeURIComponent('Oi, Filipe. Vim pelo site da Lucida Room e quero um orçamento sob medida. Tenho fotos de ');
const WPP = `https://wa.me/5548998125929?text=${TXT}`;
const MAIL = 'mailto:lucidaroom.ia@gmail.com?subject=Or%C3%A7amento%20Lucida%20Room';

const PARES: Par[] = [
  { id: 'salaverde', titulo: 'Sala verde', tag: 'Revelar', antes: '/10-sala-verde-antes.jpg', depois: '/10-sala-verde-depois.jpg',
    mudou: 'verticais corrigidas, luz de LED e spots equilibrada, cor fiel ao verde do projeto.',
    ficou: 'sofá, poltrona, estante, quadro e tapete — exatamente os da sala. Nada entrou, nada saiu.' },
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

const VELHO = [
  'Esperar a agenda do fotógrafo.',
  'R$ 800–1.500 por sessão, em média R$ 25–45 por foto.',
  'Deslocamento, hora marcada, imóvel arrumado antes.',
  'Ou publicar a foto do celular do jeito que ela saiu.'
];

const PASSOS: [string, string][] = [
  ['Suba a foto', 'A do celular mesmo, no arquivo original.'],
  ['Confira a lista', 'A plataforma lê o espaço e escreve o que vai fazer, item por item. Você marca e desmarca antes de gastar crédito.'],
  ['Baixe em 4K', 'Cerca de um minuto. Ajustes por texto, e os formatos de feed, stories, quadrado e site.']
];

const FAQ: [string, string][] = [
  ['Vocês inventam coisas na foto?', 'No Revelar, nunca: nada entra que não exista no imóvel. No Ambientar, entram mobiliário, decoração e, se pedido, acabamentos — e isso é sempre informado como simulação.'],
  ['A foto fica com cara de IA?', 'É o erro que mais combatemos. Antes de entregar, o resultado é comparado com a sua foto e reprovado se a cor desviou, se perdeu nitidez, se apareceu objeto que ninguém pediu, se um móvel virou outro modelo ou se uma parede mudou de material. Reprovou, refaz.'],
  ['Quanto tempo leva?', 'Na plataforma, cerca de um minuto por foto. No sob medida, Revelar em 24 h e Ambientar em 72 h.'],
  ['E se eu não gostar?', 'Na plataforma, o Revelar inclui um ajuste e o Ambientar inclui dois, pedidos por texto. No sob medida, uma rodada de ajuste está incluída sobre o que foi combinado.'],
  ['Posso usar nos anúncios e nas redes?', 'Pode. As imagens são suas. Em anúncio de venda ou locação, indique que a decoração ou o acabamento é ilustrativo quando usar Ambientar ou troca de acabamento.']
];

export default async function Home() {
  const user = await currentUser();
  if (user) redirect('/painel');
  const destaque = PARES[0];

  return (
    <>
      <section className="hero2">
        <div className="hero2-txt">
          <h1>Foto de celular.<br />Olhar de arquitetura.</h1>
          <p className="lead">A foto que você já tirou, com cara de fotografia. Pronta em cerca de <b>1 minuto</b>, a partir de <b>R$ 4,74</b> — feita com IA e conferida por arquiteto.</p>
          <div className="row">
            <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
            <a className="btn sec" href="#caminhos">Quero que façam por mim</a>
          </div>
          <small className="nota">Sem cartão para testar · nada entra na foto que não exista no imóvel.</small>
        </div>
        <div className="hero2-img">
          <Provas pares={[destaque]} semAbas />
          <small className="nota">Arraste a linha. {destaque.titulo} · {destaque.tag}</small>
        </div>
      </section>

      <section className="stack" id="provas">
        <div className="mono">Provas</div>
        <h2>Antes e depois, com a imagem inteira.</h2>
        <Provas pares={PARES} />
        <small>Nada inventado no Revelar · simulação declarada no Ambientar e na troca de acabamentos.</small>
      </section>

      <section className="stack">
        <div className="mono">Do jeito antigo</div>
        <h2>Uma foto boa custava uma sessão inteira.</h2>
        <ul className="riscado">{VELHO.map(t => <li key={t}>{t}</li>)}</ul>
        <p className="lead virada">Agora é a foto que você já tem, em cerca de 1 minuto, a partir de R$ 4,74.</p>
      </section>

      <section className="stack">
        <div className="mono">Como funciona</div>
        <h2>Três passos.</h2>
        <div className="grid">
          {PASSOS.map(([t, d], i) => (
            <div key={t} className="card"><div className="mono">0{i + 1}</div><h3>{t}</h3><small>{d}</small></div>
          ))}
        </div>
      </section>

      <section className="stack" id="caminhos">
        <div className="mono">Dois caminhos</div>
        <h2>Você faz na plataforma, ou nós fazemos por você.</h2>
        <p className="lead">O mesmo motor de imagem e o mesmo checklist nos dois. A diferença é quem conduz.</p>
        <div className="split">
          <div className="via">
            <div className="mono">Plataforma · por crédito</div>
            <h3>Você faz</h3>
            <p className="lead">Sobe a foto, confere a lista do que vai ser feito e baixa o resultado. Ajustes por texto, ali mesmo.</p>
            <ul className="marcas">
              <li>Cerca de 1 minuto por foto</li>
              <li>A partir de R$ 4,74 por foto no plano maior</li>
              <li>3 fotos grátis para testar, sem cartão</li>
            </ul>
            <Link className="btn" href="/entrar">Começar com 3 fotos grátis</Link>
          </div>
          <div className="via">
            <div className="mono">Sob medida · por foto</div>
            <h3>Nós fazemos</h3>
            <p className="lead">Você manda as fotos, eu conduzo a geração, confiro cada resultado e só envio o que passaria no meu próprio portfólio.</p>
            <ul className="marcas">
              <li>Revelar em 24 h, a partir de R$ 26,70 por foto</li>
              <li>Ambientar em 72 h, a partir de R$ 48,90 por imagem</li>
              <li>Uma rodada de ajuste inclusa</li>
            </ul>
            <div className="row">
              <a className="btn" href={WPP} target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>
              <a className="btn sec" href={MAIL}>Por e-mail</a>
            </div>
          </div>
        </div>
        <p><Link href="/precos">Ver todos os planos e preços →</Link></p>
      </section>

      <section className="stack">
        <div className="mono">Real e simulação</div>
        <h2>O que é real fica real. O que é simulação, a gente avisa.</h2>
        <div className="grid">
          <div className="card"><h3>Revelar</h3><small>A mesma foto, com cara de fotografia: perspectiva, prumo, luz, cor e nitidez. Cena limpa. Nada entra que não exista no imóvel.</small></div>
          <div className="card"><h3>Ambientar</h3><small>O mesmo espaço, com outra decoração em escala real. A arquitetura e os materiais continuam como são. Informado como simulação.</small></div>
          <div className="card"><h3>Trocar acabamentos</h3><small>Outra cor de parede, outro piso, outra marcenaria — restrito à superfície marcada. Informado como simulação.</small></div>
        </div>
      </section>

      <section className="stack" id="paraquem">
        <div className="mono">Para quem é</div>
        <h2>Três usos, o mesmo motor.</h2>
        <div className="grid">
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
              <li>Letreiro e cardápio ficam exatamente como estão</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="stack" id="quem">
        <div className="mono">Quem confere</div>
        <h2>A ferramenta qualquer um tem. O critério é de arquitetura.</h2>
        <div className="perfil">
          <div className="retrato" />
          <div className="stack">
            <b style={{ fontWeight: 500 }}>Filipe Storch · arquiteto e urbanista, CAU ativo</b>
            <p className="lead">Nove anos de projeto, mais de 200 projetos entregues em residencial e comercial. Cada imagem passa por um checklist de seis pontos — prumo, perspectiva, escala, materiais, luz plausível e elementos construtivos. Reprovou em qualquer um, refaz.</p>
            <p><Link href="/criterio">Ver o checklist completo →</Link></p>
          </div>
        </div>
      </section>

      <section className="stack">
        <div className="mono">Perguntas frequentes</div>
        <h2>Respostas curtas.</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="q2"><summary>{q}</summary><p className="lead">{a}</p></details>
        ))}
        <p><Link href="/guia">Antes de fotografar: 6 cuidados que mudam o resultado →</Link></p>
      </section>

      <section className="fecho">
        <h2>Comece pela foto que você já tem</h2>
        <div className="row">
          <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
          <a className="btn sec" href={WPP} target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>
        </div>
        <div className="row mono">
          <a href="https://instagram.com/lucidaroom.ia" target="_blank" rel="noopener">@lucidaroom.ia</a>
          <a href={MAIL}>lucidaroom.ia@gmail.com</a>
          <span>(48) 99812-5929</span>
        </div>
        <small>A Lucida Room não esconde a IA: ela está em todo o processo. O que garantimos é o critério de quem aprova. Toda ambientação é informada ao cliente como simulação.</small>
      </section>
    </>
  );
}
