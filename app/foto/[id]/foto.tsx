'use client';
import { useRef, useState } from 'react';
import { listaPedidos, GRUPOS } from '@/lib/plano';
import { TIPOS, grupoDe } from '@/lib/acabamentos';

type Opt = [string, string, string?];
const SVC: Opt[] = [
  ['revelar', 'Revelar', '2 créditos · a mesma foto, com cara de fotografia. Nada entra.'],
  ['ambientar', 'Ambientar', '4 créditos · o mesmo espaço, com outra decoração'],
  ['acabamentos', 'Trocar acabamentos', '6 créditos · outra cor ou material na superfície que você marcar']
];
const SVC_N: Record<string, string> = { revelar: 'Revelar', ambientar: 'Ambientar', acabamentos: 'Trocar acabamentos' };
const CUSTO: Record<string, number> = { revelar: 2, ambientar: 4, acabamentos: 6 };
const AJ_INC: Record<string, number> = { revelar: 1, ambientar: 2, acabamentos: 2 };
const MAX_SUP = 4;
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
const LUZ_N: Record<string, string> = Object.fromEntries(LUZ.map(([k, l]) => [k, l]));
const INT_N: Record<string, string> = Object.fromEntries(INT.map(([k, l]) => [k, l]));
const ENQ_N: Record<string, string> = Object.fromEntries(ENQ.map(([k, l]) => [k, l]));
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
  // sugestões que quase todo fotógrafo faria já vêm marcadas; as que dependem de gosto vêm desmarcadas
  const arrumarPadrao: string[] = (an.arrumar || []).filter((r: any) => r.padrao !== false).map((r: any) => r.nome);
  const perguntas: { pergunta: string; opcoes: string[] }[] = (an.perguntas || []).filter((p: any) => p?.pergunta && (p.opcoes || []).length);
  const [a, setA] = useState<any>(photo.answers || {
    svc: 'revelar', enq: 'verticais', luz: 'suave', intensidade: 'editorial', remover: removiveis, estilo: 'Natural/orgânico', paleta: 'Neutra quente',
    arrumar: arrumarPadrao, retirar_txt: '', melhorar_txt: '', respostas: {}, interpretado: [], adicionar: [], posicoes: {}, densidade: 'Equilibrada', nao_mudar: '', formatos: ['4:5', '9:16']
  });
  const up = (k: string) => (v: any) => setA({ ...a, [k]: v });
  // Passo de confirmação da leitura: mostra o que a análise viu antes do questionário.
  const temLeitura = !!(an.inventario?.length || arrumaveis.length || removiveis.length || perguntas.length);
  const [etapa, setEtapa] = useState<'leitura' | 'form' | 'plano'>(temLeitura ? 'leitura' : 'form');
  const [fora, setFora] = useState<any[]>([]); const [ajPlano, setAjPlano] = useState<any[] | null>(null);
  const [ver, setVer] = useState(versions.length ? versions[versions.length - 1].n : 0);
  const [busy, setBusy] = useState(''); const [erro, setErro] = useState(''); const [aviso, setAviso] = useState('');
  const [aj, setAj] = useState<string[]>([]); const [ajTxt, setAjTxt] = useState(''); const [ajTirar, setAjTirar] = useState(''); const [ajArrumar, setAjArrumar] = useState('');
  const [geoSel, setGeoSel] = useState(''); const [confirmar, setConfirmar] = useState(false);
  const [posItem, setPosItem] = useState(''); const [arquivos, setArquivos] = useState<{ nome: string; url: string }[]>([]);
  // superfícies e opções de troca: a plataforma lê a foto e propõe, o cliente não manda referência
  const [sup, setSup] = useState<any[]>(an.superficies || []);
  const [supBusy, setSupBusy] = useState(false); const [supErro, setSupErro] = useState('');
  const [ajAcab, setAjAcab] = useState('');
  const lerSup = async (refazer = false) => {
    setSupBusy(true); setSupErro('');
    try {
      const r = await fetch('/api/superficies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_id: photo.id, refazer }) });
      const j = await r.json();
      setSup(Array.isArray(j.superficies) ? j.superficies : []);
      if (j.erro) setSupErro(j.erro);
    } catch { setSupErro('A leitura das superfícies falhou. Tente de novo.'); }
    setSupBusy(false);
  };
  const trocarSvc = (v: string) => { setA({ ...a, svc: v }); if (v === 'acabamentos' && !sup.length && !supBusy) lerSup(); };
  const escolhas: { superficie: string; opcao: string }[] = a.acabamentos || [];
  const escolha = (nome: string) => escolhas.find(x => x.superficie === nome)?.opcao || '';
  const setEscolha = (nome: string, opcao: string) => setA({ ...a, acabamentos: opcao ? [...escolhas.filter(x => x.superficie !== nome), { superficie: nome, opcao }] : escolhas.filter(x => x.superficie !== nome) });
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
  // Lê o texto livre olhando a foto e devolve ações concretas para o cliente conferir. Não gera imagem.
  const interpretar = async (t: { retirar?: string; melhorar?: string; ajuste?: string }) => {
    try {
      const r = await fetch('/api/plano', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_id: photo.id, svc: a.svc, ...t }) });
      const j = await r.json(); return Array.isArray(j.acoes) ? j.acoes : [];
    } catch { return []; }
  };
  const revisar = async () => {
    setErro(''); let acoes: any[] = [];
    const t = { retirar: (a.retirar_txt || '').trim(), melhorar: (a.melhorar_txt || '').trim() };
    if (t.retirar || t.melhorar) { setBusy('Lendo o seu pedido na foto… alguns segundos.'); acoes = await interpretar(t); setBusy(''); }
    setFora(acoes.filter((x: any) => x.fora)); setA({ ...a, interpretado: acoes.filter((x: any) => !x.fora) }); setEtapa('plano'); window.scrollTo(0, 0);
  };
  const amb = a.svc === 'ambientar';
  const acab = a.svc === 'acabamentos';
  const proxima = fila ? fila.split(',') : [];

  const gerar = async (ajuste?: string, geo?: any, ajuste_acab?: string) => {
    const acabServ = (photo.service || a.svc) === 'acabamentos';
    setErro(''); setAviso(''); setBusy(ajuste || ajuste_acab ? 'Gerando o ajuste… cerca de 1 minuto.' : acabServ ? 'Revelando a foto e trocando o acabamento da superfície marcada… cerca de 2 minutos.' : 'Lendo o espaço, corrigindo prumo e luz, conferindo o resultado… cerca de 1 minuto.');
    const r = await fetch('/api/gerar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_id: photo.id, answers: a, ajuste, geo, ajuste_acab }) });
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
            <div className="card"><b>Sugestões para a foto</b>
              {arrumaveis.length ? <>
                <small>É o que um fotógrafo arrumaria antes do clique, usando só o que já existe no espaço. Deixe marcado o que você quer que seja feito.</small>
                {GRUPOS.filter(([g]) => (an.arrumar || []).some((r: any) => (GRUPOS.some(([k]) => k === r.grupo) ? r.grupo : 'outros') === g)).map(([g, titulo]) => <div className="q" key={g}><b style={{ fontSize: 13 }}>{titulo}</b>
                  {g === 'defeitos' && <small>Vem desmarcado. Em anúncio de venda ou locação, a foto precisa corresponder ao estado real do imóvel: corrigir rachadura, infiltração ou mofo na imagem é responsabilidade de quem publica.</small>}
                  {(an.arrumar || []).filter((r: any) => (GRUPOS.some(([k]) => k === r.grupo) ? r.grupo : 'outros') === g).map((r: any) => { const on = (a.arrumar || []).includes(r.nome); return (
                    <label key={r.nome} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '6px 0' }}>
                      <input type="checkbox" checked={on} style={{ marginTop: 4, width: 18, height: 18, flex: '0 0 auto' }} onChange={() => setA({ ...a, arrumar: on ? (a.arrumar || []).filter((x: string) => x !== r.nome) : [...(a.arrumar || []), r.nome] })} />
                      <span><b style={{ fontWeight: 500 }}>{r.nome}</b><small style={{ display: 'block' }}>{r.acao}{r.motivo ? ` — ${r.motivo}` : ''}</small></span>
                    </label>); })}
                </div>)}
              </> : <small>Nada fora do lugar encontrado.</small>}
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

  // ——— passo 4: resumo do que será feito ———
  if (!versions.length && etapa === 'plano') {
    const pedidos = listaPedidos(an, a);
    const itens: string[] = (a.adicionar || []);
    const tirarInterp = (k: number) => setA({ ...a, interpretado: (a.interpretado || []).filter((_: any, i: number) => i !== k) });
    const duvidas = (a.interpretado || []).filter((x: any) => x.duvida);
    return (
      <div className="stack">
        <div className="mono">Nova foto · passo 4</div>
        <h1>O que vamos fazer</h1>
        <div className="split">
          <div><img src={original} alt="Foto enviada" style={{ width: '100%', borderRadius: 8, display: 'block' }} /></div>
          <div className="stack">
            <div className="mono" style={{ textTransform: 'none', letterSpacing: 0 }}>Confira a lista. É exatamente isto que vai para a geração, e o resultado é conferido item por item.</div>
            <div className="card"><b>{SVC_N[a.svc] || 'Revelar'} · {INT_N[a.intensidade || 'editorial']} · {LUZ_N[a.luz]}</b>
              <small>Enquadramento: {ENQ_N[a.enq]}. Pessoas, rostos e placas de carro saem sempre.</small>
            </div>
            {acab && <div className="card"><b>Troca de acabamento</b>
              <small>Feita como um passe separado, depois do Revelar, e restrita às superfícies abaixo. O resto da imagem não muda.</small>
              <ol style={{ margin: 0, paddingLeft: 20 }}>{escolhas.slice(0, MAX_SUP).map(t => {
                const s = sup.find((x: any) => x.nome === t.superficie);
                const o = (s?.opcoes || []).find((x: any) => x.rotulo === t.opcao);
                return <li key={t.superficie} style={{ padding: '3px 0' }}><small style={{ color: 'inherit' }}><b style={{ fontWeight: 500 }}>{t.superficie}</b>: {o ? o.descricao : t.opcao}{s ? ` (hoje: ${s.material_atual}, ${s.cor_atual})` : ''}</small></li>;
              })}</ol>
              <small>Isto é uma simulação: a imagem mostra um acabamento que não é o do imóvel hoje. Em anúncio de venda ou locação, informe que o acabamento é ilustrativo.</small>
            </div>}
            <div className="card"><b>Mudanças na cena</b>
              {pedidos.length ? <ol style={{ margin: 0, paddingLeft: 20 }}>{pedidos.map((p, i) => { const k = p.tipo === 'pedido' && (a.interpretado || []).length ? (a.interpretado || []).findIndex((x: any) => (x.resumo || x.acao) === p.cliente) : -1; return (
                <li key={i} style={{ padding: '3px 0' }}><small style={{ color: 'inherit' }}>{p.cliente}{k >= 0 && <> <button type="button" onClick={() => tirarInterp(k)} style={{ border: 0, background: 'none', color: '#8a2be2', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>tirar da lista</button></>}</small></li>); })}</ol>
                : <small>Nenhuma mudança na cena: só luz, cor e acabamento fotográfico.</small>}
              {amb && <small>{itens.length ? `Entram na foto: ${itens.map((i: string) => (a.posicoes || {})[i] ? `${i} (posição marcada)` : `${i} (posição livre)`).join(', ')}. Estilo ${a.estilo}, paleta ${a.paleta}, decoração ${String(a.densidade || '').toLowerCase()}.` : `Nenhum móvel novo: só objetos pequenos de cena, no estilo ${a.estilo}, paleta ${a.paleta}.`}</small>}
            </div>
            {duvidas.length > 0 && <div className="alert">Lemos assim o que você escreveu. Se não for isso, volte e reescreva: {duvidas.map((x: any) => x.duvida).join(' ')}</div>}
            {fora.length > 0 && <div className="alert">Ficou de fora, porque muda material, cor ou modelo do que existe{amb ? '' : ' ou acrescenta algo que não está na foto'}: {fora.map((x: any) => `${x.resumo}${x.motivo ? ` (${x.motivo})` : ''}`).join('; ')}.</div>}
            <div className="card"><b>O que não muda</b>
              <small>Arquitetura, materiais, cores e os móveis que já existem{a.nao_mudar ? `; e também: ${a.nao_mudar}` : ''}. O que for movido continua sendo a mesma peça.</small>
            </div>
            {erro && <div className="erro">{erro}</div>}
            {busy ? <div className="ok">{busy}</div> : <div className="row">
              <button className="btn sec" onClick={() => setEtapa('form')}>Voltar e corrigir</button>
              <button className="btn" onClick={() => gerar()}>Confirmar e gerar</button>
            </div>}
          </div>
        </div>
      </div>
    );
  }

  // ——— passo 3: questionário ———
  if (!versions.length) {
    const custo = CUSTO[a.svc] ?? 2;
    const faltaSup = acab && !escolhas.length;
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
            <div className="q"><b>Serviço</b><Um opts={SVC} v={a.svc} set={trocarSvc} /></div>
            {acab && <div className="q"><b>Superfícies e acabamentos</b>
              <small>Lemos a foto e propomos as opções: você marca a superfície e escolhe. A troca fica restrita à superfície marcada — o resto da imagem não muda. Até {MAX_SUP} superfícies por geração.</small>
              {supBusy && <small>Lendo as superfícies da foto… alguns segundos.</small>}
              {supErro && <div className="alert">{supErro}</div>}
              {!supBusy && !sup.length && <button type="button" className="btn sec" onClick={() => lerSup(true)}>Ler as superfícies da foto</button>}
              {TIPOS.filter(([t]) => sup.some((s: any) => grupoDe(s.tipo) === t)).map(([t, titulo]) => <div className="q" key={t}><b style={{ fontSize: 13 }}>{titulo}</b>
                {sup.filter((s: any) => grupoDe(s.tipo) === t).map((s: any) => {
                  const sel = escolha(s.nome);
                  const outra = sel && !(s.opcoes || []).some((o: any) => o.rotulo === sel) ? sel : '';
                  const cheio = !sel && escolhas.length >= MAX_SUP;
                  return (
                    <div key={s.nome} style={{ padding: '8px 0', borderTop: '1px solid #3a3733' }}>
                      <b style={{ fontWeight: 500 }}>{s.nome}</b>
                      <small style={{ display: 'block' }}>Hoje: {s.material_atual}, {s.cor_atual}.</small>
                      <div className="chips">{(s.opcoes || []).map((o: any) => <button key={o.rotulo} type="button" className="chip" disabled={cheio} aria-pressed={sel === o.rotulo} title={o.descricao} onClick={() => setEscolha(s.nome, sel === o.rotulo ? '' : o.rotulo)}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: o.cor, border: '1px solid rgba(0,0,0,.25)', marginRight: 7, verticalAlign: '-1px' }} />{o.rotulo}
                      </button>)}</div>
                      {sel && !outra && <small>{(s.opcoes || []).find((o: any) => o.rotulo === sel)?.descricao}</small>}
                      <label className="f">Outra cor ou material para esta superfície (opcional)
                        <input type="text" placeholder="ex.: tinta fosca verde-musgo" value={outra} onChange={e => setEscolha(s.nome, e.target.value)} />
                      </label>
                      {cheio && <small>Desmarque uma superfície para escolher esta.</small>}
                    </div>);
                })}
              </div>)}
              {sup.length > 0 && <small>Não achou a superfície? <button type="button" onClick={() => lerSup(true)} style={{ border: 0, background: 'none', color: '#8a2be2', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>ler a foto de novo</button>.</small>}
            </div>}
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
              <small>{(AJ_INC[a.svc] ?? 1) > 1 ? `Inclui ${AJ_INC[a.svc]} ajustes.` : 'Inclui 1 ajuste.'} Os créditos são descontados quando a geração começa.</small></div>
            {erro && <div className="erro">{erro}</div>}
            {faltaSup && <small>Marque pelo menos uma superfície e escolha a opção de cor ou material para continuar.</small>}
            {busy ? <div className="ok">{busy}</div> : <div className="row">
              {temLeitura && <button className="btn sec" onClick={() => setEtapa('leitura')}>Voltar à leitura</button>}
              <button className="btn" disabled={faltaSup || supBusy} onClick={revisar}>Revisar e gerar</button>
            </div>}
          </div>
        </div>
      </div>
    );
  }

  // ——— resultado ———
  const atual = versions.find((v: any) => v.n === ver) || versions[versions.length - 1];
  const acabServ = photo.service === 'acabamentos';
  const incluidos = AJ_INC[photo.service] ?? 1;
  const restantes = Math.max(0, incluidos - photo.adjustments_used);
  const ajusteTexto = [...aj, ajTirar.trim() ? `retirar: ${ajTirar.trim()}` : '', ajArrumar.trim() ? `arrumar/melhorar: ${ajArrumar.trim()}` : '', ajTxt.trim()].filter(Boolean).join('; ');
  const acabTexto = acabServ ? ajAcab.trim() : '';
  const geoEscolhido = GEO.find(([, k]) => k === geoSel);
  // Só geometria = refeito por código, sem custo. Com texto = nova geração, já com o enquadramento escolhido.
  const soGeometria = !ajusteTexto && !acabTexto && !!geoEscolhido;
  const temLivre = !!(ajTirar.trim() || ajArrumar.trim() || ajTxt.trim());
  // Ajuste escrito à mão passa pela leitura na foto e o cliente confirma antes de gerar.
  const aplicar = async () => {
    if (soGeometria) return enquadrar(geoEscolhido![2]);
    if (!temLivre) return gerar(ajusteTexto, geoEscolhido ? geoEscolhido[2] : undefined, acabTexto || undefined);
    setErro(''); setBusy('Lendo o seu pedido na foto… alguns segundos.');
    const acoes = await interpretar({ retirar: ajTirar.trim(), melhorar: ajArrumar.trim(), ajuste: ajTxt.trim() }); setBusy('');
    if (!acoes.length) return gerar(ajusteTexto, geoEscolhido ? geoEscolhido[2] : undefined, acabTexto || undefined);
    setAjPlano(acoes);
  };
  const ajValidos = (ajPlano || []).filter((x: any) => !x.fora);
  const confirmarAjuste = () => { const txt = [...aj, ...ajValidos.map((x: any) => x.acao)].join('; '); setAjPlano(null); return gerar(txt, geoEscolhido ? geoEscolhido[2] : undefined, acabTexto || undefined); };
  const pendentes: string[] = atual.check?.pedidos_pendentes || [];
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
            : pendentes.length ? null : <div className="ok">Checagem: cor, nitidez, contagem, arquitetura e pedidos aprovados.</div>)}
          {pendentes.length > 0 && <div className="alert">Nesta versão não saiu como pedido: {pendentes.join('; ')}. Um ajuste dizendo exatamente isso costuma resolver.</div>}
          {acabServ && (atual.check?.trocas || []).length > 0 && <div className="card"><b>Acabamento trocado nesta versão</b>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{(atual.check.trocas || []).map((t: string) => <li key={t}><small style={{ color: 'inherit' }}>{t}</small></li>)}</ul>
            <small>Simulação: informe como ilustrativo em anúncio de venda ou locação.</small>
          </div>}
          <div className="card"><b>Prumo e enquadramento</b><small>Escolha uma opção e clique em “{soGeometria ? 'Aplicar enquadramento' : 'Gerar ajuste'}”, no bloco abaixo. Sozinho, o enquadramento é refeito por código, em segundos e sem custo.</small>
            <div className="chips">{GEO.map(([l, k]) => <button key={k} type="button" className="chip" aria-pressed={geoSel === k} disabled={!!busy} onClick={() => setGeoSel(geoSel === k ? '' : k)}>{l}</button>)}</div>
          </div>
          <div className="card"><b>Ajustar</b>
            <small>{photo.is_trial && !saldo.admin ? 'Ajustes ficam disponíveis depois de liberar a foto.' : restantes ? `${restantes} ajuste${restantes > 1 ? 's' : ''} grátis restante${restantes > 1 ? 's' : ''}.` : 'Ajustes incluídos usados. Cada ajuste a mais gasta 1 crédito.'}</small>
            <Varios opts={AJ} v={aj} set={setAj} />
            <label className="f">O que tirar da foto<textarea rows={2} style={{ font: 'inherit', padding: 12, borderRadius: 6, border: '1px solid #5c5852' }} placeholder="ex.: objetos soltos, itens sobre bancadas e mesas, fios aparentes" value={ajTirar} onChange={e => setAjTirar(e.target.value)} /></label>
            <label className="f">O que arrumar, alinhar ou melhorar<textarea rows={2} style={{ font: 'inherit', padding: 12, borderRadius: 6, border: '1px solid #5c5852' }} placeholder="ex.: alinhar móveis e eletrodomésticos, fechar portas e gavetas, endireitar o que estiver torto" value={ajArrumar} onChange={e => setAjArrumar(e.target.value)} /></label>
            <input type="text" placeholder="Outro detalhe (opcional)" value={ajTxt} onChange={e => setAjTxt(e.target.value)} />
            {acabServ && <label className="f">Ajuste no acabamento trocado<input type="text" placeholder="ex.: o piso um tom mais escuro, a marcenaria mais fosca" value={ajAcab} onChange={e => setAjAcab(e.target.value)} />
              <small>Vale só dentro das superfícies que você marcou. Para trocar de superfície, comece uma foto nova.</small></label>}
            {geoEscolhido && <small>Enquadramento escolhido: {geoEscolhido[0]}.{ajusteTexto ? ' Entra junto com o ajuste, numa única geração.' : ''}</small>}
            {ajPlano
              ? <div className="stack" style={{ gap: 8 }}>
                <div className="alert"><b>Lemos o seu pedido assim:</b>
                  <ol style={{ margin: '6px 0 0', paddingLeft: 20 }}>{[...aj, ...ajValidos.map((x: any) => x.resumo)].map((t: string, i: number) => <li key={i}>{t}</li>)}</ol>
                  {ajValidos.filter((x: any) => x.duvida).map((x: any, i: number) => <div key={i}>{x.duvida}</div>)}
                  {(ajPlano || []).filter((x: any) => x.fora).length > 0 && <div>Ficou de fora, porque muda material, cor ou modelo do que existe: {(ajPlano || []).filter((x: any) => x.fora).map((x: any) => x.resumo).join('; ')}.</div>}
                </div>
                <div className="row"><button className="btn" disabled={!!busy || (!aj.length && !ajValidos.length && !acabTexto)} onClick={confirmarAjuste}>Confirmar e gerar ajuste</button><button className="btn sec" disabled={!!busy} onClick={() => setAjPlano(null)}>Reescrever</button></div>
              </div>
              : <button className="btn sec" disabled={(!ajusteTexto && !acabTexto && !geoEscolhido) || !!busy} onClick={aplicar}>{soGeometria ? 'Aplicar enquadramento (sem custo)' : temLivre ? 'Revisar ajuste' : 'Gerar ajuste'}</button>}
          </div>
          <div className="card"><b>Entrega</b>
            <small>Original em 4K{(photo.answers?.formatos || []).length ? ' + ' + photo.answers.formatos.map((f: string) => FMT_N[f]).join(', ') : ''}, cada um em JPG.{photo.service === 'ambientar' ? ' Em anúncio de imóvel, a recomendação é indicar que a decoração é ilustrativa.' : acabServ ? ' O acabamento desta imagem é simulação: em anúncio de venda ou locação, informe que é ilustrativo.' : ''}</small>
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
