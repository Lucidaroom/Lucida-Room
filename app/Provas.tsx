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
        <span className="lbl" style={{ left: 10 }}>Antes · celular</span>
      </div>
      <span className="lbl" style={{ right: 10 }}>Depois</span>
      <div className="bar" style={{ left: `${x}%` }}><i /></div>
    </div>
  );
}

export default function Provas({ pares }: { pares: Par[] }) {
  const [filtro, setFiltro] = useState<string | null>(null);
  const filtros: [string, string | null][] = [['Todos', null], ['Revelar', 'Revelar'], ['Ambientar', 'Ambientar'], ['Acabamento', 'Acabamento']];
  const lista = filtro ? pares.filter(p => p.tag === filtro) : pares;
  return (
    <>
      <div className="chips">
        {filtros.map(([rot, v]) => (
          <button key={rot} type="button" className="chip" aria-pressed={filtro === v} onClick={() => setFiltro(v)}>{rot}</button>
        ))}
      </div>
      <div className="split">
        {lista.map(p => (
          <figure key={p.id} className="card" style={{ margin: 0 }}>
            <Slider p={p} />
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b style={{ fontWeight: 500 }}>{p.titulo}</b>
              <span className="mono">{p.tag}</span>
            </div>
            <figcaption className="stack" style={{ gap: 4 }}>
              <small><b style={{ fontWeight: 500 }}>Mudou:</b> {p.mudou}</small>
              <small><b style={{ fontWeight: 500 }}>Ficou igual:</b> {p.ficou}</small>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
