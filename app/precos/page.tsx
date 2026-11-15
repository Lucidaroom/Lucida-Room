import Link from 'next/link';

export const metadata = { title: 'Preços · Lucida Room', description: 'Plataforma por crédito a partir de R$ 4,74 por foto e sob medida a partir de R$ 26,70. Sem letra miúda.' };

const WPP = `https://wa.me/5548998125929?text=${encodeURIComponent('Oi, Filipe. Vim pela página de preços da Lucida Room e quero um orçamento sob medida.')}`;

const PLANOS: [string, string, string, string, boolean][] = [
  ['Avulso', '4 créditos', 'R$ 19,90', 'Uma foto Ambientar ou duas Revelar.', false],
  ['Pacote', '24 créditos', 'R$ 99', 'Validade de 60 dias. Sem assinatura.', false],
  ['Essencial', '24 créditos por mês', 'R$ 79', 'Para quem entrega uma obra por mês.', false],
  ['Profissional', '60 créditos por mês', 'R$ 169', 'Para escritório e corretor com giro constante.', true],
  ['Imobiliária', '160 créditos por mês', 'R$ 379', 'Para equipe com vários anúncios por semana.', false]
];

const PORFOTO: string[][] = [
  ['Plano', 'Revelar', 'Ambientar', 'Trocar acabamento'],
  ['Avulso', 'R$ 9,95', 'R$ 19,90', '—'],
  ['Pacote', 'R$ 8,25', 'R$ 16,50', 'R$ 24,75'],
  ['Essencial', 'R$ 6,58', 'R$ 13,16', 'R$ 19,75'],
  ['Profissional', 'R$ 5,63', 'R$ 11,27', 'R$ 16,90'],
  ['Imobiliária', 'R$ 4,74', 'R$ 9,48', 'R$ 14,22']
];

const REVELAR: string[][] = [['Pacote', 'Por foto', 'Total'], ['1 foto', 'R$ 34,90', 'R$ 34,90'], ['5 fotos', 'R$ 29,80', 'R$ 149'], ['10 fotos', 'R$ 26,70', 'R$ 267']];
const AMBIENTAR: string[][] = [['Pacote', 'Por imagem', 'Total'], ['1 imagem', 'R$ 64,90', 'R$ 64,90'], ['5 imagens', 'R$ 55,80', 'R$ 279'], ['10 imagens', 'R$ 48,90', 'R$ 489']];

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
        <div className="mono">Preços</div>
        <h1>Dois caminhos, dois preços. Nada misturado.</h1>
        <p className="lead">Um crédito vale em qualquer serviço. Revelar custa 2 créditos, Ambientar 4 e trocar acabamento 6. Os créditos do plano mensal renovam todo mês; os do pacote valem 60 dias.</p>
      </section>

      <section className="stack">
        <div className="mono">Caminho 1 · plataforma</div>
        <h2>Por crédito, você mesmo faz.</h2>
        <div className="grid">
          {PLANOS.map(([nome, cred, preco, txt, dest]) => (
            <div key={nome} className={dest ? 'card dest' : 'card'}>
              {dest && <div className="mono">Mais escolhido</div>}
              <h3>{nome}</h3>
              <b style={{ fontSize: 26 }}>{preco}</b>
              <span className="mono">{cred}</span>
              <small>{txt}</small>
            </div>
          ))}
        </div>
        <h3>Quanto fica por foto</h3>
        <Tabela linhas={PORFOTO} />
        <small>Pix e cartão pelo Mercado Pago. Teste com 3 prévias grátis, sem cartão: as prévias saem com marca d’água e o download é liberado depois da compra.</small>
        <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
      </section>

      <section className="stack">
        <div className="mono">Caminho 2 · sob medida</div>
        <h2>Por foto, conduzido por mim.</h2>
        <div className="split">
          <div className="stack"><h3>Revelar · entrega em 24 h</h3><Tabela linhas={REVELAR} /></div>
          <div className="stack"><h3>Ambientar · entrega em 72 h</h3><Tabela linhas={AMBIENTAR} /></div>
        </div>
        <small>Acabamentos (parede, piso, revestimento, marcenaria): + R$ 30 por imagem. Variação extra da mesma imagem: R$ 29. Urgência: +50%. Uma rodada de ajuste inclusa sobre o que foi combinado. Começou no Revelar? Até 30 dias após a entrega, o Ambientar paga só a diferença: + R$ 30 (decoração) ou + R$ 60 (com acabamentos).</small>
        <div className="row">
          <a className="btn" href={WPP} target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>
          <Link className="btn sec" href="/">Voltar para o início</Link>
        </div>
      </section>
    </>
  );
}
