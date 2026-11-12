'use client';
import { useState } from 'react';
import { sbBrowser } from '@/lib/browser';

export default function Entrar() {
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState(''); const [modo, setModo] = useState<'entrar' | 'criar' | 'esqueci'>('entrar');
  const sb = sbBrowser();
  const google = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/auth/callback' } });
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    if (modo === 'esqueci') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/auth/callback?next=/nova-senha' });
      setMsg(error ? error.message : 'Se este e-mail tiver conta, enviamos um link para criar uma nova senha.');
      return;
    }
    if (modo === 'criar') {
      const { error } = await sb.auth.signUp({ email, password: senha, options: { emailRedirectTo: location.origin + '/auth/callback' } });
      setMsg(error ? (/registered/i.test(error.message) ? 'Este e-mail já tem conta. Use Entrar ou Esqueci a senha.' : error.message) : 'Conta criada. Confirme pelo link que enviamos para o seu e-mail.');
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password: senha });
      if (error) setMsg(/confirm/i.test(error.message) ? 'Confirme seu e-mail pelo link que enviamos antes de entrar.' : 'E-mail ou senha incorretos.'); else location.href = '/painel';
    }
  };
  return (
    <div className="stack" style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
      <div className="mono">Conta</div>
      <h1>{modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Esqueci a senha'}</h1>
      <p style={{ margin: 0 }}>3 prévias grátis, sem cartão.</p>
      <button className="btn sec" onClick={google}>Continuar com Google</button>
      <div className="mono" style={{ textAlign: 'center' }}>ou</div>
      <form className="stack" onSubmit={enviar}>
        <label className="f">E-mail<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        {modo !== 'esqueci' && <label className="f">Senha<input type="password" required minLength={8} value={senha} onChange={e => setSenha(e.target.value)} /></label>}
        <button className="btn" type="submit">{modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Enviar link'}</button>
      </form>
      {msg && <div className="alert">{msg}</div>}
      <div className="row" style={{ justifyContent: 'center' }}>
        {modo !== 'entrar' && <button className="chip" onClick={() => { setModo('entrar'); setMsg(''); }}>Já tenho conta</button>}
        {modo !== 'criar' && <button className="chip" onClick={() => { setModo('criar'); setMsg(''); }}>Ainda não tenho conta</button>}
        {modo !== 'esqueci' && <button className="chip" onClick={() => { setModo('esqueci'); setMsg(''); }}>Esqueci a senha</button>}
      </div>
    </div>
  );
}
