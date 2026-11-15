import Link from 'next/link';

export const metadata = { title: 'Preços · Lucida Room', description: 'Revelar a partir de R$ 26,70 por foto e Ambientar a partir de R$ 39,90 por imagem. Tratado e conferido por arquiteto. Sem letra miúda.' };

const WPP = `https://wa.me/5548998125929?text=${encodeURIComponent('Oi, Filipe. Vim pela página de preços da Lucida Room e quero tratar fotos.')}`;

const REVELAR: string[][] = [['Pacote', 'Por foto', 'Total'], ['1 foto', 'R$ 34,90', 'R$ 34,90'], ['5 fotos', 'R$ 29,80', 'R$ 149'], ['10 fotos', 'R$ 26,70', 'R$ 267']];
const AMBIENTAR: string[][] = [['Pacote', 'Por imagem', 'Total'], ['1 imagem', 'R$ 54,90', 'R$ 54,90'], ['5 imagens', 'R$ 45,80', 'R$ 229'], ['10 imagens', 'R$ 39,90', 'R$ 399']];

function Tabela({ linhas }: { linhas: string[][] }) {
  return (
    <div className="tab3">
      {linhas.map((l, i) => <div key={i} className={i === 0 ? 'cab' : ''}>{l.map((c, j) => <span key={j}>{c}</span>)}</div>)}
    </div>
  );
}

export default function Precos() {
  return (
    <>
      <section className="stack">
        <div className="mono">Preços de lançamento</div>
        <h1>Por foto, sem assinatura.</h1>
        <p className="lead">Você manda as fotos, combinamos o que muda em cada uma e eu trato e confiro imagem por imagem. Mesmo preço para todos; quanto mais fotos no pedido, menor o valor por foto.</p>
      </section>

      <section className="stack">
        <div className="split">
          <div className="stack"><h3>Revelar · entrega em 24 h</h3><p className="lead">A mesma foto, com cara de fotografia. Nada entra que não exista no imóvel.</p><Tabela linhas={REVELAR} /></div>
          <div className="stack"><h3>Ambientar · entrega em 72 h</h3><p className="lead">O mesmo espaço, com outra decoração. Informado como simulação.</p><Tabela linhas={AMBIENTAR} /></div>
        </div>
        <small>Troca de acabamento (parede, piso, revestimento, marcenaria): + R$ 30 por imagem. Variação extra da mesma imagem: R$ 29. Urgência: +50%. Uma rodada de ajuste inclusa sobre o que foi combinado. Começou no Revelar? Até 30 dias após a entrega, o Ambientar paga só a diferença.</small>
        <small>Pagamento por Pix ou cartão (link do Mercado Pago), depois de combinarmos o pedido pelo WhatsApp.</small>
        <div className="row">
          <a className="btn" href={WPP} target="_blank" rel="noopener">Pedir pelo WhatsApp</a>
          <Link className="btn sec" href="/">Voltar para o início</Link>
        </div>
      </section>

      <section className="stack">
        <div className="mono">Em breve</div>
        <h2>Uma plataforma para você fazer sozinho.</h2>
        <p className="lead">O mesmo critério, direto no site. Está em construção; enquanto isso, todo pedido é feito comigo.</p>
      </section>
    </>
  );
}
