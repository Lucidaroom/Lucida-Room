import Link from 'next/link';

export const metadata = { title: 'O critério · Lucida Room', description: 'O checklist técnico de seis pontos que reprova uma imagem antes dela ser entregue.' };

const CHECK: [string, string][] = [
  ['Prumo e nível', 'Verticais verticais, piso no horizonte certo.'],
  ['Perspectiva', 'Sem distorção de grande-angular.'],
  ['Escala', 'Sofá de 2,20 m continua com 2,20 m.'],
  ['Materiais', 'No Revelar, o porcelanato não vira mármore; a madeira não muda de tom.'],
  ['Luz plausível', 'Sombra coerente com a janela e com a hora do dia.'],
  ['Elementos construtivos', 'Nenhuma porta, janela, viga ou tomada inventada ou apagada.']
];

const SERVICOS: [string, string, string][] = [
  ['Revelar', 'A mesma foto, com cara de fotografia.', 'Perspectiva, prumo, luz, cor, ruído e nitidez de câmera profissional. Cena limpa: saem pessoas, cabos e objetos soltos, e o que está fora do lugar é arrumado — porta fechada, cadeira alinhada, bancada organizada. Nada entra na foto que não exista no imóvel.'],
  ['Ambientar', 'O mesmo espaço, com outra decoração.', 'Inclui o Revelar, mais mobiliário, decoração e objetos de cena em escala real, no estilo e na paleta que você escolher. A arquitetura, os materiais e a marcenaria continuam exatamente como são. Sempre informado como simulação.'],
  ['Trocar acabamentos', 'Outra cor de parede, outro piso, outra marcenaria.', 'Você marca a superfície e escolhe entre as opções propostas para aquela foto. A troca fica restrita à superfície marcada: o resto da imagem não muda. Sempre informado como simulação.']
];

export default function Criterio() {
  return (
    <>
      <section className="stack">
        <div className="mono">O critério</div>
        <h1>Qualquer um tem a ferramenta. O critério é de arquitetura.</h1>
        <p className="lead">A IA está em todo o processo — não escondemos isso. O que muda é o critério: cada direção é escrita para aquela foto e nada sai sem passar por seis pontos de aprovação. Reprovou em um, refaz.</p>
      </section>

      <section className="stack">
        <h2>O checklist</h2>
        <div className="grid">
          {CHECK.map(([t, d], i) => (
            <div key={t} className="card"><div className="mono">0{i + 1}</div><h3>{t}</h3><small>{d}</small></div>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2>O que é real, o que é simulação</h2>
        {SERVICOS.map(([nome, resumo, txt]) => (
          <div key={nome} className="card"><h3>{nome}</h3><b style={{ fontWeight: 500 }}>{resumo}</b><small>{txt}</small></div>
        ))}
        <small>Toda ambientação e toda troca de acabamento são informadas ao cliente como simulação.</small>
      </section>

      <section className="fecho">
        <h2>Veja nas imagens</h2>
        <div className="row">
          <Link className="btn" href="/#provas">Ver os antes e depois</Link>
          <a className="btn sec" href="https://wa.me/5548998125929?text=Oi%2C%20Filipe.%20Vim%20pelo%20site%20da%20Lucida%20Room%20e%20quero%20tratar%20fotos." target="_blank" rel="noopener">Pedir pelo WhatsApp</a>
        </div>
      </section>
    </>
  );
}
