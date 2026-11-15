import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const WPP = 'https://wa.me/5548998125929';

// Provas antes/depois. Preencha com as imagens autorizadas (coloque os arquivos em /public).
// Enquanto estiver vazio, a seção não aparece.
const PROVAS: { antes: string; depois: string; legenda: string }[] = [];

const SERVICOS: [string, string, string, string][] = [
  ['Revelar', '2 créditos', 'A mesma foto, com cara de fotografia.',
    'Prumo, luz, cor e nitidez de câmera profissional. Objetos soltos, pessoas e placas saem. O que está fora do lugar é arrumado: porta fechada, cadeira alinhada, bancada organizada. Nada entra na foto que não exista no espaço.'],
  ['Ambientar', '4 créditos', 'O mesmo espaço, com outra decoração.',
    'Tudo do Revelar, mais móveis e objetos novos no estilo e na paleta que você escolher. Você toca na foto para dizer onde cada peça fica. A arquitetura, os materiais e a marcenaria continuam exatamente como são.'],
  ['Trocar acabamentos', '6 créditos', 'Outra cor de parede, outro piso, outra marcenaria.',
    'Você toca na superfície e escolhe entre as opções que a plataforma sugere para aquela foto. A troca fica restrita à superfície marcada: o resto da imagem não muda. Duas superfícies por foto, 8 créditos.']
];

const PLANOS: [string, string, string, string, string][] = [
  ['Avulso', '4 créditos', 'R$ 19,90', 'Uma foto Ambientar ou duas Revelar.', ''],
  ['Pacote', '24 créditos', 'R$ 99', 'Validade de 60 dias. Sem assinatura.', ''],
  ['Essencial', '24 créditos por mês', 'R$ 79', 'Para quem entrega uma obra por mês.', ''],
  ['Profissional', '60 créditos por mês', 'R$ 169', 'Para escritório e corretor com giro constante.', 'destaque'],
  ['Imobiliária', '160 créditos por mês', 'R$ 379', 'Para equipe com vários anúncios por semana.', '']
];

export default async function Home() {
  const user = await currentUser();
  if (user) redirect('/painel');

  return (
    <>
      <section className="hero">
        <div className="mono">Lucida Room</div>
        <h1>Foto de celular.<br />Olhar de arquitetura.</h1>
        <p className="lead">A foto que você já tirou volta com prumo, luz e cor de fotografia profissional — e com o espaço arrumado como um fotógrafo faria antes do clique. Para portfólio de obra entregue e para anúncio de imóvel.</p>
        <div className="row">
          <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
          <a className="btn sec" href="#sob-medida">Quero que vocês façam por mim</a>
        </div>
        <small className="mono" style={{ textTransform: 'none', letterSpacing: 0 }}>Sem cartão para testar. Resultado em cerca de 1 minuto.</small>
      </section>

      {PROVAS.length > 0 && (
        <section className="stack">
          <h2>Antes e depois</h2>
          <div className="grid">
            {PROVAS.map(p => (
              <figure key={p.legenda} className="card" style={{ margin: 0 }}>
                <div className="par">
                  <img src={p.antes} alt="Antes" /><img src={p.depois} alt="Depois" />
                </div>
                <figcaption><small>{p.legenda}</small></figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ——— os dois caminhos ——— */}
      <section className="stack" id="caminhos">
        <h2>Dois jeitos de trabalhar com a gente</h2>
        <p className="lead">O mesmo motor de imagem nos dois. A diferença é quem conduz: você, na plataforma, ou nós dois juntos, por mensagem.</p>
        <div className="split">

          <div className="via">
            <div className="mono">Caminho 1</div>
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
              <li>Você decide tudo, na hora que quiser</li>
            </ul>
            <Link className="btn" href="/entrar">Começar com 3 fotos grátis</Link>
            <small>Melhor para: volume, prazo curto, foto que precisa sair hoje.</small>
          </div>

          <div className="via" id="sob-medida">
            <div className="mono">Caminho 2</div>
            <h3>Sob medida, direto comigo</h3>
            <p className="lead">Você manda as fotos e conversamos sobre o que cada imagem precisa. Eu conduzo a geração, confiro cada resultado e só envio o que passaria no meu próprio portfólio.</p>
            <ol className="passos">
              <li>Você manda as fotos pelo WhatsApp.</li>
              <li>Conversamos sobre ângulo, decoração, acabamentos e o que não pode mudar.</li>
              <li>Eu trabalho as imagens e mando as versões para você escolher.</li>
              <li>Ajustamos até ficar como você quer.</li>
              <li>Entrega em alta resolução, em até 48 h.</li>
            </ol>
            <ul className="marcas">
              <li>Cada imagem conferida por arquiteto, uma a uma</li>
              <li>Ajustes até você aprovar</li>
              <li>R$ 44,90 por foto · 10 fotos por R$ 449</li>
              <li>Troca de acabamento e decisão de projeto inclusas</li>
            </ul>
            <a className="btn" href={WPP} target="_blank" rel="noopener">Falar comigo no WhatsApp</a>
            <small>Melhor para: foto de portfólio, acabamento específico, espaço que pede decisão de projeto.</small>
          </div>

        </div>
      </section>

      <section className="stack" id="servicos">
        <h2>O que a plataforma faz com a sua foto</h2>
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
        <small>Imagens do Ambientar e da troca de acabamentos são simulação. Em anúncio de imóvel, a recomendação é indicar que a decoração ou o acabamento é ilustrativo.</small>
      </section>

      <section className="stack" id="precos">
        <h2>Créditos</h2>
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
        <div className="card">
          <b style={{ fontWeight: 500 }}>Quanto sai cada foto</b>
          <div className="tabela">
            <div><span>Plano</span><span>Revelar</span><span>Ambientar</span><span>Trocar acabamento</span></div>
            <div><span>Avulso</span><span>R$ 9,95</span><span>R$ 19,90</span><span>—</span></div>
            <div><span>Pacote</span><span>R$ 8,25</span><span>R$ 16,50</span><span>R$ 24,75</span></div>
            <div><span>Essencial</span><span>R$ 6,58</span><span>R$ 13,16</span><span>R$ 19,75</span></div>
            <div><span>Profissional</span><span>R$ 5,63</span><span>R$ 11,27</span><span>R$ 16,90</span></div>
            <div><span>Imobiliária</span><span>R$ 4,74</span><span>R$ 9,48</span><span>R$ 14,22</span></div>
          </div>
          <small>Pix e cartão pelo Mercado Pago. Teste com 3 prévias grátis, sem cartão: as prévias saem com marca d'água e o download é liberado depois da compra.</small>
        </div>
      </section>

      <section className="stack" id="publicos">
        <h2>Para quem é</h2>
        <div className="split">
          <div className="card">
            <h3>Arquitetos e designers</h3>
            <small>A foto do dia da entrega vira foto de portfólio. A marcenaria, os materiais e as luminárias saem como foram especificados — a plataforma lê cada peça antes de gerar e trava cor e material um a um. O que muda é a fotografia, não o projeto.</small>
          </div>
          <div className="card">
            <h3>Corretores e imobiliárias</h3>
            <small>Anúncio com foto escura, torta e com objetos soltos some na rolagem. A plataforma corrige o prumo, abre a luz e limpa a cena sem mexer no imóvel. Para apartamento vazio, o Ambientar mostra o espaço mobiliado em escala real.</small>
          </div>
          <div className="card">
            <h3>Comércio e serviços</h3>
            <small>Restaurante, loja, clínica, cafeteria. A foto do salão ou da vitrine volta com luz, cor e cena limpas, com o letreiro e o cardápio exatamente como estão — a plataforma não reescreve texto nenhum.</small>
          </div>
        </div>
      </section>

      <section className="stack">
        <h2>Perguntas</h2>
        <div className="card"><b style={{ fontWeight: 500 }}>A foto fica parecendo IA?</b><small>É o erro que mais combatemos. Antes de entregar, a plataforma compara o resultado com a sua foto e reprova cor desviada, perda de nitidez, objeto que apareceu sem ser pedido, móvel trocado de modelo e parede que mudou de material. Se reprovar, ela refaz.</small></div>
        <div className="card"><b style={{ fontWeight: 500 }}>Preciso mandar foto de referência?</b><small>Não. A plataforma lê a sua foto e sugere as opções. Se você tiver a foto do produto ou o código da tinta, pode enviar, mas é opcional.</small></div>
        <div className="card"><b style={{ fontWeight: 500 }}>Minha foto está escura e tremida. Dá?</b><small>A plataforma avisa quando a foto tem problema e diz o que melhoraria se você refizesse. Você pode seguir assim mesmo.</small></div>
        <div className="card"><b style={{ fontWeight: 500 }}>Posso usar nos anúncios e nas redes?</b><small>Pode. As imagens são suas. Em anúncio de venda ou locação, indique que a decoração ou o acabamento é ilustrativo quando usar Ambientar ou troca de acabamento.</small></div>
      </section>

      <section className="fecho">
        <h2>Comece pela foto que você já tem</h2>
        <div className="row">
          <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
          <a className="btn sec" href={WPP} target="_blank" rel="noopener">Falar comigo no WhatsApp</a>
        </div>
      </section>
    </>
  );
}
