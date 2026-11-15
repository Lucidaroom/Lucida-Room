'use client';
import { useRef, useState } from 'react';

export type Par = { id: string; titulo: string; tag: string; antes: string; depois: string; mudou: string; ficou: string };

function Slider({ p }: { p: Par }) {
  const [x, setX] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const mover = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    setX(Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className="cmp"
      onPointerDown={e => { drag.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); mover(e); }}
      onPointerMove={e => drag.current && mover(e)}
      onPointerUp={() => (drag.current = false)}
      onPointerCancel={() => (drag.current = false)}
    >
      <img src={p.depois} alt={`${p.titulo} — depois`} draggable={false} loading="lazy" />
      <div className="over" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}>
        <img src={p.antes} alt={`${p.titulo} — antes`} draggable={false} loading="lazy" />
        <span className="lbl" style={{ left: 10 }}>ANTES</span>
      </div>
      <span className="lbl" style={{ right: 10 }}>DEPOIS</span>
      <div className="bar" style={{ left: `${x}%` }}><i><svg width="18" height="11" viewBox="0 0 20 12" fill="none" stroke="#281630" strokeWidth="2"><path d="M6 1 L1 6 L6 11 M14 1 L19 6 L14 11" /></svg></i></div>
    </div>
  );
}

export default function Provas({ pares, semAbas = false }: { pares: Par[]; semAbas?: boolean }) {
  const [filtro, setFiltro] = useState<string | null>(null);
  const filtros: [string, string | null][] = [['Todos', null], ['Revelar', 'Revelar'], ['Ambientar', 'Ambientar'], ['Ambientar + acabamento', 'Acabamento']];
  const lista = filtro ? pares.filter(p => p.tag === filtro) : pares;
  if (semAbas) return <Slider p={pares[0]} />;
  return (
    <>
      <div className="chips">
        {filtros.map(([rot, v]) => (
          <button key={rot} type="button" className="chip" aria-pressed={filtro === v} onClick={() => setFiltro(v)}>{rot}</button>
        ))}
      </div>
      <div className="lr-grade">
        {lista.map(p => (
          <figure key={p.id} className="prova" style={{ margin: 0 }}>
            <Slider p={p} />
            <div className="row">
              <b className="lr-tit">{p.titulo}</b>
              <span className={p.tag === 'Revelar' ? 'lr-tag' : 'lr-tag amb'}>{p.tag === 'Acabamento' ? 'Ambientar + acabamento' : p.tag}</span>
            </div>
            <figcaption className="lr-leg">
              <div><b>Mudou:</b> {p.mudou}</div>
              <div><b>Ficou igual:</b> {p.ficou}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
