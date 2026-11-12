'use client';
import { useState } from 'react';
import { sbBrowser } from '@/lib/browser';

export default function NovaSenha() {
  const [senha, setSenha] = useState(''); const [msg, setMsg] = useState('');
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await sbBrowser().auth.updateUser({ password: senha });
    if (error) setMsg('O link expirou. Peça um novo em Esqueci a senha.'); else location.href = '/painel';
  };
  return (
    <form className="stack" style={{ maxWidth: 420, margin: '0 auto', width: '100%' }} onSubmit={salvar}>
      <div className="mono">Conta</div>
      <h1>Nova senha</h1>
      <label className="f">Nova senha (mínimo 8 caracteres)<input type="password" required minLength={8} value={senha} onChange={e => setSenha(e.target.value)} /></label>
      <button className="btn" type="submit">Salvar e entrar</button>
      {msg && <div className="alert">{msg}</div>}
    </form>
  );
}
