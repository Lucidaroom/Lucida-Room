'use client';
import { useState } from 'react';

// Converte HEIC e reduz a foto no próprio navegador (lado maior 3000 px, JPG),
// para o envio ficar abaixo do limite do servidor.
async function preparar(f: File): Promise<Blob> {
  let blob: Blob = f;
  if (/heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name)) {
    const heic2any = (await import('heic2any')).default as any;
    const out = await heic2any({ blob: f, toType: 'image/jpeg', quality: 0.95 });
    blob = Array.isArray(out) ? out[0] : out;
  }
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' } as any);
  const k = Math.min(1, 3000 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  for (const q of [0.92, 0.85, 0.75]) {
    const b: Blob = await new Promise(r => c.toBlob(x => r(x!), 'image/jpeg', q));
    if (b.size < 4 * 1024 * 1024) return b;
  }
  return await new Promise(r => c.toBlob(x => r(x!), 'image/jpeg', 0.65));
}

export default function NovaForm({ projetos, termoJaAceito }: { projetos: { id: string; name: string }[]; termoJaAceito: boolean }) {
  const [proj, setProj] = useState(projetos[0]?.id || 'novo');
  const [nome, setNome] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [termo, setTermo] = useState(termoJaAceito);
  const [estado, setEstado] = useState(''); const [erro, setErro] = useState('');

  const enviar = async () => {
    setErro('');
    if (proj === 'novo' && !nome.trim()) return setErro('Dê um nome ao projeto.');
    const ids: string[] = [];
    for (const [i, f] of files.entries()) {
      if (f.size > 25 * 1024 * 1024) { setErro(`${f.name} passa de 25 MB.`); return; }
      setEstado(`Preparando ${i + 1} de ${files.length}…`);
      let jpg: Blob;
      try { jpg = await preparar(f); } catch { setEstado(''); setErro(`Não conseguimos abrir ${f.name}. Tente em JPG.`); return; }
      setEstado(`Enviando e analisando ${i + 1} de ${files.length}…`);
      const fd = new FormData();
      fd.append('file', jpg, 'foto.jpg'); fd.append('project_id', proj); fd.append('project_name', nome); fd.append('termo', termo ? '1' : '0');
      let r: Response, j: any;
      try { r = await fetch('/api/analisar', { method: 'POST', body: fd }); j = await r.json(); }
      catch { setEstado(''); setErro('O envio demorou demais ou caiu. Tente de novo em instantes.'); return; }
      if (!r.ok) { setEstado(''); setErro(j.error || 'Falha no envio.'); return; }
      ids.push(j.id);
      if (proj === 'novo') setProj(j.project_id);
    }
    location.href = `/foto/${ids[0]}` + (ids.length > 1 ? `?fila=${ids.slice(1).join(',')}` : '');
  };

  return (
    <div className="stack">
      <div className="mono">Nova foto · passo 1</div>
      <h1>Suba a foto</h1>
      <label className="f">Projeto
        <select value={proj} onChange={e => setProj(e.target.value)}>
          {projetos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value="novo">+ Novo projeto…</option>
        </select>
      </label>
      {proj === 'novo' && <label className="f">Nome do projeto<input type="text" placeholder="ex.: Apto 302 Centro" value={nome} onChange={e => setNome(e.target.value)} /></label>}
      <label className="card" style={{ alignItems: 'center', textAlign: 'center', borderStyle: 'dashed', cursor: 'pointer', padding: 32 }}>
        <b>Toque para escolher ou fotografar</b>
        <small>JPG, PNG ou HEIC · até 25 MB cada · várias de uma vez</small>
        <input type="file" accept="image/jpeg,image/png,image/heic,image/heif" multiple style={{ display: 'none' }} onChange={e => setFiles(Array.from(e.target.files || []))} />
        {files.length > 0 && <span className="mono">{files.length} foto(s) selecionada(s)</span>}
      </label>
      {!termoJaAceito && (
        <label className="row" style={{ alignItems: 'flex-start', fontSize: 14 }}>
          <input type="checkbox" checked={termo} onChange={e => setTermo(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2 }} />
          <span>Declaro que tenho direito de uso das fotos que envio e autorização do proprietário do espaço. Pessoas, rostos e placas de veículos são removidos automaticamente.</span>
        </label>
      )}
      {erro && <div className="erro">{erro}</div>}
      {estado && <div className="ok">{estado}</div>}
      <button className="btn" disabled={!termo || !files.length || !!estado} onClick={enviar}>Continuar</button>
    </div>
  );
}
