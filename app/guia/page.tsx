import Link from 'next/link';

export const metadata = { title: 'Antes de fotografar · Lucida Room', description: 'Seis cuidados de um minuto que decidem o resultado da foto do seu projeto.' };

const GUIA: [string, string][] = [
  ['Lente 1×, nunca 0,5×', 'A ultra-wide entorta paredes e distorce móveis. Recue com os pés se não couber.'],
  ['Na altura do peito, reto', 'Sem inclinar o celular para cima ou para baixo — é o que faz as verticais convergirem.'],
  ['Ambiente inteiro', 'Do canto, com duas paredes e o piso visíveis.'],
  ['Luz natural, sem flash', 'De dia, cortina aberta. Luzes todas acesas ou todas apagadas, nunca misturado.'],
  ['Três fotos por ambiente', 'Duas gerais de cantos diferentes e um detalhe.'],
  ['Arquivo original', 'Sem filtro, sem recorte, sem compressão. No WhatsApp, envie como documento.']
];

export default function Guia() {
  return (
    <>
      <section className="stack">
        <div className="mono">Antes de fotografar</div>
        <h1>Quanto melhor a base, melhor o resultado.</h1>
        <p className="lead">O que não aparece na sua foto não entra na imagem final. Seis cuidados que levam um minuto e decidem o resto.</p>
      </section>

      <section className="stack">
        <div className="grid">
          {GUIA.map(([t, d], i) => (
            <div key={t} className="card"><div className="mono">0{i + 1}</div><h3>{t}</h3><small>{d}</small></div>
          ))}
        </div>
      </section>

      <section className="fecho">
        <h2>Fotografou? Suba a primeira.</h2>
        <div className="row">
          <Link className="btn" href="/entrar">Testar com 3 fotos grátis</Link>
          <Link className="btn sec" href="/precos">Ver preços</Link>
        </div>
      </section>
    </>
  );
}
