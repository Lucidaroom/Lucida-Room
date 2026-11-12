'use client';
import { useRef, useState } from 'react';

type Opt = [string, string, string?];
const SVC: Opt[] = [['revelar', 'Revelar', '1 crédito · a mesma foto, com cara de fotografia. Nada entra.'], ['ambientar', 'Ambientar', '2 créditos · o mesmo espaço, com outra decoração']];
const ENQ: Opt[] = [['verticais', 'Verticais retas', 'padrão'], ['justo', 'Verticais retas + recorte justo'], ['centralizar', 'Centralizar no elemento principal'], ['manter', 'Manter como está']];
const GEO: [string, string, any][] = [['Corrigir verticais', 'verticais', { verticais: true, recorte: 'auto', centralizar: false }], ['Recortar mais justo', 'justo', { verticais: true, recorte: 'justo', centralizar: false }], ['Centralizar no principal', 'centralizar', { verticais: true, recorte: 'auto', centralizar: true }], ['Enquadramento original', 'manter', { verticais: false, recorte: 'auto', centralizar: false }]];
const INT: Opt[] = [['editorial', 'Editorial', 'padrão · foto profissional'], ['revista', 'Revista', 'máximo impacto, luzes acesas'], ['sutil', 'Sutil', 'só correção']];
const LUZ: Opt[] = [['claro', 'Dia claro'], ['suave', 'Dia suave'], ['tarde', 'Fim de tarde', 'só se a janela recebe esse sol'], ['noite', 'Noite com luzes acesas', 'só luminárias que existem'], ['manter', 'Manter a luz da foto']];
const ESTILO = ['Contemporâneo', 'Natural/orgânico', 'Escandinavo', 'Industrial', 'Clássico atualizado', 'Praia/litoral', 'Minimalista'];
const PALETA = ['Clara neutra', 'Neutra quente', 'Terrosa', 'Escura sofisticada', 'Com cor de destaque'];
const ADD = ['Sofá', 'Poltrona', 'Mesa', 'Cadeiras', 'Cama', 'Tapete', 'Cortina', 'Luminária', 'Quadros', 'Plantas', 'Objetos de mesa e bancada', 'Mesa posta'];
const DENS = ['Mínima', 'Equilibrada', 'Completa'];
const FMT = ['4:5', '9:16', '1:1', '16:9'];
const FMT_N: Record<string, string> = { '4:5': 'Feed 4:5', '9:16': 'Stories 9:16', '1:1': 'Quadrado 1:1', '16:9': 'Site 16:9' };
const AJ = ['Mais impacto, com cara de revista', 'Acender todas as luzes existentes', 'Mais claro', 'Luz mais quente', 'Luz mais fria', 'Tirar mais objetos', 'Menos decoração', 'Mais decoração'];

function Um({ opts, v, set }: { opts: Opt[]; v: string; set: (x: string) => void }) {
  return <div className="chips">{opts.map(([k, l, d]) => <button key={k} type="button" className="chip" aria-pressed={v === k} onClick={() => set(k)} title={d}>{l}{d ? <small style={{ opacity: .7 }}> · {d}</small> : null}</button>)}</div>;
}
function Varios({ opts, v, set, fixos = [] }: { opts: string[]; v: string[]; set: (x: string[]) => void; fixos?: string[] }) {
  return <div className="chips">{opts.map(o => { const fixo = fixos.includes(o); return <button key={o} type="button" disabled={fixo} className="chip" aria-pressed={fixo || v.includes(o)} onClick={() => set(v.includes(o) ? v.filter(x => x !== o) : [...v, o])}>{o}</button>; })}</div>;
}

function Comparador({ antes, depois }: { antes: string; depois: string }) {
  const [p, setP] = useState(50); const ref = useRef<HTMLDivElement>(null); const drag = useRef(false);
  const mv = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); setP(Math.max(2, Math.min(98, (e.clientX - r.left) / r.width * 100))); };
  return (
    <div ref={ref} className="cmp" onPointerDown={e => { drag.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); mv(e); }} onPointerMove={e => drag.current && mv(e)} onPointerUp={() => (drag.current = false)}>
      <img src={depois} alt="Depois" draggable={false} />
      <div className="over" style={{ clipPath: `inset(0 ${100 - p}% 0 0)` }}><img src={antes} alt="Antes" draggable={false} /><span className="lbl" style={{ left: 10 }}>ANTES</span></div>
      <span className="lbl" style={{ right: 10 }}>DEPOIS</span>
      <div className="bar" style={{ left: `${p}%` }} />
    </div>
  );
}

export default function Foto({ photo, original, versions, saldo, fila }: any) {
  const an = photo.analysis || {};
  const removiveis: string[] = (an.removiveis || []).map((r: any) => r.nome);
  const fixos = removiveis.filter(n => /pessoa|rosto|placa/i.test(n));
  const arrumaveis: string[] = (an.arrumar || []).map((r: any) => r.nome);
  const perguntas: { pergunta: string; opcoes: string[] }[] = (an.perguntas || []).filter((p: any) => p?.pergunta && (p.opcoes || []).length);
  const [a, setA] = useState<any>(photo.answers || {
    svc: 'revelar', enq: 'verticais', luz: 'suave', intensidade: 'editorial', remover: removiveis, estilo: 'Natural/orgânico', paleta: 'Neutra quente',
    arrumar: arrumaveis, retirar_txt: '', melhorar_txt: '', respostas: {}, adicionar: [], posicoes: {}, densidade: 'Equilibrada', nao_mudar: '', formatos: ['4:5', '9:16']
  });
  const up = (k: string) => (v: any) => setA({ ...a, [k]: v });
  // Passo de confirmação da leitura: mostra o que a análise viu antes do questionário.
  const temLeitura = !!(an.inventario?.length || arrumaveis.length || removiveis.length || perguntas.length);
  const [etapa, setEtapa] = useState<'leitura' | 'form'>(temLeitura ? 'leitura' : 'form');
  const [ver, setVer] = useState(versions.length ? versions[versions.length - 1].n : 0);
  const [busy, setBusy] = useState(''); const [erro, setErro] = useState(''); const [aviso, setAviso] = useState('');
  const [aj, setAj] = useState<string[]>([]); const [ajTxt, setAjTxt] = useState(''); const [ajTirar, setAjTirar] = useState(''); const [ajArrumar, setAjArrumar] = useState('');
  const [geoSel, setGeoSel] = useState(''); const [confirmar, setConfirmar] = useState(false);
  const [posItem, setPosItem] = useState(''); const [arquivos, setArquivos] = useState<{ nome: string; url: string }[]>([]);
  const marcar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!posItem) return;
    const r = e.currentTarget.getBoundingClientRect();
    setA({ ...a, posicoes: { ...(a.posicoes || {}), [posItem]: [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] } });
    const prox = (a.adicionar || []).find((i: string) => i !== posItem && !(a.posicoes || {})[i]); setPosItem(prox || '');
  };
  const enquadrar = async (geo: any) => {
    setErro(''); setBusy('Ajustando prumo e recorte… alguns segundos.');
    const r = await fetch('/api/enquadrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_id: photo.id, n: ver, geo }) });
    const j = await r.json().catch(() => ({ error: 'Falha no ajuste.' })); setBusy('');
    if (!r.ok) return setErro(j.error); location.reload();
  };
  const amb = a.svc === 'ambientar';
  const proxima = fila ? fila.split(',') : [];

  const gerar = async (ajuste?: string, geo?: any) => {
    setErro(''); setAviso(''); setBusy(ajuste ? 'Gerando o ajuste… cerca de 1 minuto.' : 'Lendo o espaço, corrigindo prumo e luz, conferindo o resultado… cerca de 1 minuto.');
    const r = await fetch('/api/gerar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_id: photo.id, answers: a, ajuste, geo }) });
    const j = await r.json(); setBusy('');
    if (!r.ok) return setErro(j.error === 'sem_creditos' ? 'Seus créditos e prévias grátis acabaram. A compra de créditos chega na próxima etapa.' : j.error);
    location.reload();
  };
  const baixar = async () => {
    setErro(''); setConfirmar(false); setBusy('Gerando a versão final em 4K e os formatos… cerca de 30 segundos.');
    const r = await fetch(`/api/baixar/${photo.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ n: ver }) });
    const j = await r.json(); setBusy('');
    if (!r.ok) return setErro(j.error === 'liberar' ? 'Esta é uma prévia grátis. Para baixar em alta resolução, libere a foto com créditos (compra disponível na próxima etapa).' : j.error);
    setArquivos(j.arquivos || []);
  };

  // ——— passo 2: confirmação da leitura ———
  if (!versions.length && etapa === 'leitura') {
    const respostas = a.respostas || {};
    const responder = (p: string, o: string) => setA({ ...a, respostas: { ...respostas, [p]: respostas[p] === o ? '' : o } });
    const faltam = perguntas.filter(p => !respostas[p.pergunta]).length;
    return (
      <div className="stack">
        <div className="mono">Nova foto · passo 2</div>
        <h1>{an.ambiente || 'Sua foto'}</h1>
        <div className="split">
          <div><img src={original} alt="Foto enviada" style={{ width: '100%', borderRadius: 8, display: 'block' }} /></div>
          <div className="stack">
            {an.qualidade?.problema && <div className="alert">Essa foto está {an.qualidade.problema}. O resultado pode ter falhas. Para um resultado melhor, refaça {an.qualidade.dica ? `com ${an.qualidade.dica}` : 'a foto'}. Você pode seguir mesmo assim.</div>}
            <div className="mono" style={{ textTransform: 'none', letterSpacing: 0 }}>Isto é o que lemos na sua foto. Se faltou alguma coisa, você escreve no próximo passo.</div>
            <div className="card"><b>O que vimos no espaço</b>
              {an.inventario?.length ? <small>{an.inventario.map((i: any) => `${i.qtd} ${i.item}`).join(' · ')}</small> : <small>Não identificamos o mobiliário em detalhe.</small>}
              {an.materiais?.length ? <small>Materiais: {an.materiais.join(', ')}.</small> : null}
            </div>
            <div className="card"><b>O que está fora do lugar</b>
              {arrumaveis.length ? <ul style={{ margin: 0, paddingLeft: 18 }}>{(an.arrumar || []).map((r: any) => <li key={r.nome}><small>{r.nome} — {r.acao}</small></li>)}</ul> : <small>Nada fora do lugar encontrado.</small>}
            </div>
            <div className="card"><b>O que daria para tirar da cena</b>
              {removiveis.length ? <small>{removiveis.join(' · ')}</small> : <small>Nada solto encontrado.</small>}
            </div>
            {perguntas.length > 0 && <div className="card"><b>Antes de gerar, confirme</b>
              <small>São decisões que mudam o resultado e a foto não responde sozinha. Sem resposta, mantemos o espaço como está.</small>
              {perguntas.map(p => <div className="q" key={p.pergunta}><b>{p.pergunta}</b>
                <div className="chips">{p.opcoes.map(o => <button key={o} type="button" className="chip" aria-pressed={respostas[p.pergunta] === o} onClick={() => responder(p.pergunta, o)}>{o}</button>)}</div>
              </div>)}
              {faltam > 0 && <small>{faltam === 1 ? 'Falta 1 resposta.' : `Faltam ${faltam} respostas.`} Você pode seguir sem responder.</small>}
            </div>}
            <button className="btn" onClick={() => setEtapa('form')}>Confirmar leitura e continuar</button>
          </div>
        </div>
      </div>
    );
  }

  // ——— passo 3: questionário ———
  if (!versions.length) {
    const custo = amb ? 2 : 1;
    return (
      <div className="stack">
        <div className="mono">Nova foto · passo 3</div>
        <h1>{an.ambiente || 'Sua foto'}</h1>
        <div className="split">
          <div style={{ position: 'relative', cursor: posItem ? 'crosshair' : 'default' }} onClick={marcar}>
            <img src={original} alt="Foto enviada" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
            {amb && (a.adicionar || []).filter((i: string) => (a.posicoes || {})[i]).map((i: string, k: number) => { const [x, y] = a.posicoes[i]; return <span key={i} title={i} style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, transform: 'translate(-50%,-50%)', background: '#E0115F', color: '#fff', border: '2px solid #fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{k + 1}</span>; })}
            {posItem && <span className="lbl" style={{ left: 10 }}>TOQUE ONDE VAI: {posItem.toUpperCase()}</span>}
          </div>
          <div className="stack">
            <div className="mono" style={{ textTransform: 'none', letterSpacing: 0 }}>Já marcamos o que a análise sugere. Confirme ou troque.</div>
            <div className="q"><b>Serviço</b><Um opts={SVC} v={a.svc} set={up('svc')} /></div>
            <div className="q"><b>Enquadramento</b><small>O prumo é corrigido com precisão, sem inventar nada nas bordas: a foto é levemente recortada.</small><Um opts={ENQ} v={a.enq} set={up('enq')} /></div>
            <div className="q"><b>Transformação</b><small>Quanto a foto muda em luz, cor e acabamento. Arquitetura e materiais ficam iguais.</small><Um opts={INT} v={a.intensidade || 'editorial'} set={up('intensidade')} /></div>
            <div className="q"><b>Luz</b><Um opts={LUZ} v={a.luz} set={up('luz')} /></div>
            <div className="q"><b>O que sai da foto</b><small>Pessoas, rostos e placas de carro saem sempre.</small>
              {removiveis.length ? <Varios opts={removiveis} v={a.remover} set={up('remover')} fixos={fixos} /> : <small>Nada a remover encontrado.</small>}</div>
            <div className="q"><b>O que arrumar</b><small>Como um produtor de fotografia faria antes do clique: alinhar, fechar, endireitar e reposicionar o que já existe.</small>
              {arrumaveis.length ? <Varios opts={arrumaveis} v={a.arrumar || []} set={up('arrumar')} /> : <small>Nada fora do lugar encontrado.</small>}</div>
            <div className="q"><b>Quer pedir mais alguma coisa?</b><small>Opcional. Escreva do seu jeito.</small>
              <label className="f">O que tirar da foto<input type="text" placeholder="ex.: objetos soltos, itens sobre bancadas e mesas, fios aparentes" value={a.retirar_txt || ''} onChange={e => up('retirar_txt')(e.target.value)} /></label>
              <label className="f">O que arrumar ou melhorar<input type="text" placeholder="ex.: alinhar móveis e eletrodomésticos, fechar portas e gavetas, endireitar o que estiver torto" value={a.melhorar_txt || ''} onChange={e => up('melhorar_txt')(e.target.value)} /></label></div>
            {amb && <>
              <div className="q"><b>Estilo</b><Um opts={ESTILO.map(x => [x, x])} v={a.estilo} set={up('estilo')} /></div>
              <div className="q"><b>Paleta</b><Um opts={PALETA.map(x => [x, x])} v={a.paleta} set={up('paleta')} /></div>
              <div className="q"><b>O que adicionar</b><small>Só entra o que você marcar. Depois toque em cada item abaixo e na foto para dizer onde ele fica.</small><Varios opts={ADD} v={a.adicionar} set={(v: string[]) => { setA({ ...a, adicionar: v }); const novo = v.find(i => !(a.adicionar || []).includes(i)); if (novo) setPosItem(novo); }} />
                {(a.adicionar || []).length > 0 && <div className="chips">{(a.adicionar || []).map((i: string, k: number) => <button key={i} type="button" className="chip" aria-pressed={posItem === i} onClick={() => setPosItem(i)}>{(a.posicoes || {})[i] ? `${k + 1}. ${i} ✓` : `Posicionar ${i}`}</button>)}</div>}</div>
              <div className="q"><b>Quantidade de decoração</b><Um opts={DENS.map(x => [x, x])} v={a.densidade} set={up('densidade')} /></div>
            </>}
            <div className="q"><b>O que não pode mudar</b><small>Opcional.</small><input type="text" placeholder="ex.: o quadro da parede, o tapete" value={a.nao_mudar} onChange={e => up('nao_mudar')(e.target.value)} /></div>
            <div className="q"><b>Formatos de entrega</b><small>O original vai sempre. Os outros saem por recorte.</small>
              <div className="chips">{FMT.map(f => <button key={f} type="button" className="chip" aria-pressed={a.formatos.includes(f)} onClick={() => up('formatos')(a.formatos.includes(f) ? a.formatos.filter((x: string) => x !== f) : [...a.formatos, f])}>{FMT_N[f]}</button>)}</div></div>

            <div className="card"><b>Total: {saldo.admin ? 'administrador (sem custo)' : saldo.credits >= custo ? `${custo} crédito${custo > 1 ? 's' : ''}` : saldo.trial > 0 ? `prévia grátis (${saldo.trial} restante${saldo.trial > 1 ? 's' : ''})` : 'sem saldo'}</b>
              <small>{amb ? 'Inclui 2 ajustes.' : 'Inclui 1 ajuste.'} Os créditos são descontados quando a geração começa.</small></div>
            {erro && <div className="erro">{erro}</div>}
            {busy ? <div className="ok">{busy}</div> : <div className="row">
              {temLeitura && <button className="btn sec" onClick={() => setEtapa('leitura')}>Voltar à leitura</button>}
              <button className="btn" onClick={() => gerar()}>Gerar foto</button>
            </div>}
          </div>
        </div>
      </div>
    );
  }

  // ——— resultado ———
  const atual = versions.find((v: any) => v.n === ver) || versions[versions.length - 1];
  const incluidos = photo.service === 'ambientar' ? 2 : 1;
  const restantes = Math.max(0, incluidos - photo.adjustments_used);
  const ajusteTexto = [...aj, ajTirar.trim() ? `retirar: ${ajTirar.trim()}` : '', ajArrumar.trim() ? `arrumar/melhorar: ${ajArrumar.trim()}` : '', ajTxt.trim()].filter(Boolean).join('; ');
  const geoEscolhido = GEO.find(([, k]) => k === geoSel);
  // Só geometria = refeito por código, sem custo. Com texto = nova geração, já com o enquadramento escolhido.
  const soGeometria = !ajusteTexto && !!geoEscolhido;
  const aplicar = () => { if (soGeometria) return enquadrar(geoEscolhido![2]); return gerar(ajusteTexto, geoEscolhido ? geoEscolhido[2] : undefined); };
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div><div className="mono">{photo.is_trial ? 'Prévia grátis' : 'Resultado'}</div><h1>{an.ambiente || 'Sua foto'}</h1></div>

      </div>
      <div className="split">
        <div className="stack">
          <Comparador antes={original} depois={atual.url} />
          <div className="chips">{versions.map((v: any) => <button key={v.n} className="chip" aria-pressed={v.n === ver} onClick={() => setVer(v.n)}>v{v.n}</button>)}</div>
        </div>
        <div className="stack">
          {atual.check && (atual.check.ponto_fraco && (atual.check.cor_desviada || atual.check.menos_nitida || !atual.check.contagem_ok || atual.check.objeto_nao_pedido || atual.check.modelo_trocado || atual.check.arquitetura_alterada || atual.check.enquadramento_alterado)
            ? <div className="alert">Esta foto teve dificuldade em: {atual.check.ponto_fraco}. Um ajuste pode resolver.</div>
            : <div className="ok">Checagem: cor, nitidez, contagem e arquitetura aprovadas.</div>)}
          <div className="card"><b>Prumo e enquadramento</b><small>Escolha uma opção e clique em “{soGeometria ? 'Aplicar enquadramento' : 'Gerar ajuste'}”, no bloco abaixo. Sozinho, o enquadramento é refeito por código, em segundos e sem custo.</small>
            <div className="chips">{GEO.map(([l, k]) => <button key={k} type="button" className="chip" aria-pressed={geoSel === k} disabled={!!busy} onClick={() => setGeoSel(geoSel === k ? '' : k)}>{l}</button>)}</div>
          </div>
          <div className="card"><b>Ajustar</b>
            <small>{photo.is_trial && !saldo.admin ? 'Ajustes ficam disponíveis depois de liberar a foto.' : restantes ? `${restantes} ajuste${restantes > 1 ? 's' : ''} grátis restante${restantes > 1 ? 's' : ''}.` : 'Ajustes incluídos usados. Cada ajuste a mais gasta 1 crédito.'}</small>
            <Varios opts={AJ} v={aj} set={setAj} />
            <label className="f">O que tirar da foto<textarea rows={2} style={{ font: 'inherit', padding: 12, borderRadius: 6, border: '1px solid #5c5852' }} placeholder="ex.: objetos soltos, itens sobre bancadas e mesas, fios aparentes" value={ajTirar} onChange={e => setAjTirar(e.target.value)} /></label>
            <label className="f">O que arrumar, alinhar ou melhorar<textarea rows={2} style={{ font: 'inherit', padding: 12, borderRadius: 6, border: '1px solid #5c5852' }} placeholder="ex.: alinhar móveis e eletrodomésticos, fechar portas e gavetas, endireitar o que estiver torto" value={ajArrumar} onChange={e => setAjArrumar(e.target.value)} /></label>
            <input type="text" placeholder="Outro detalhe (opcional)" value={ajTxt} onChange={e => setAjTxt(e.target.value)} />
            {geoEscolhido && <small>Enquadramento escolhido: {geoEscolhido[0]}.{ajusteTexto ? ' Entra junto com o ajuste, numa única geração.' : ''}</small>}
            <button className="btn sec" disabled={(!ajusteTexto && !geoEscolhido) || !!busy} onClick={aplicar}>{soGeometria ? 'Aplicar enquadramento (sem custo)' : 'Gerar ajuste'}</button>
          </div>
          <div className="card"><b>Entrega</b>
            <small>Original em 4K{(photo.answers?.formatos || []).length ? ' + ' + photo.answers.formatos.map((f: string) => FMT_N[f]).join(', ') : ''}, cada um em JPG.{photo.service === 'ambientar' ? ' Em anúncio de imóvel, a recomendação é indicar que a decoração é ilustrativa.' : ''}</small>
            {confirmar
              ? <div className="stack" style={{ gap: 8 }}>
                <div className="alert">Vamos gerar a versão final da v{ver} em 4K e os formatos escolhidos. Depois disso, novos ajustes são gerados à parte. Confirma?</div>
                <div className="row"><button className="btn" disabled={!!busy} onClick={baixar}>Confirmar e gerar 4K</button><button className="btn sec" disabled={!!busy} onClick={() => setConfirmar(false)}>Cancelar</button></div>
              </div>
              : <button className="btn" disabled={!!busy} onClick={() => { setErro(''); setConfirmar(true); }}>Aprovar e baixar v{ver}</button>}
            {arquivos.length > 0 && <div className="stack" style={{ gap: 8 }}>{arquivos.map(f => <a key={f.nome} className="btn sec" href={f.url}>Baixar {f.nome}</a>)}</div>}
          </div>
          {erro && <div className="erro">{erro}</div>}
          {busy && <div className="ok">{busy}</div>}
          <div className="row">
            {proxima.length > 0 && <a className="btn sec" href={`/foto/${proxima[0]}${proxima.length > 1 ? `?fila=${proxima.slice(1).join(',')}` : ''}`}>Próxima foto</a>}
            <a className="btn sec" href="/nova">Nova foto</a>
          </div>
        </div>
      </div>
    </div>
  );
}
