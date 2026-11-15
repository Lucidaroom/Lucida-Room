import './globals.css';
import Link from 'next/link';
import { currentUser } from '@/lib/supabase';

const BASE = 'https://lucida-room.vercel.app';

export const metadata = {
  metadataBase: new URL(BASE),
  title: 'Lucida Room · foto de arquitetura a partir da foto do seu celular',
  description: 'A foto que você já tirou, com cara de fotografia. Pronta em 1 minuto, a partir de R$ 4,74. Feita com IA, conferida por arquiteto — nada entra na foto que não exista no imóvel.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: BASE,
    siteName: 'Lucida Room',
    title: 'Foto de celular. Olhar de arquitetura.',
    description: 'A foto que você já tirou, com cara de fotografia. Em 1 minuto, a partir de R$ 4,74. Feita com IA, conferida por arquiteto.'
  },
  twitter: { card: 'summary_large_image' }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let logado = false;
  try { logado = !!(await currentUser()); } catch { logado = false; }
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="top">
          <Link className="logo" href={logado ? '/painel' : '/'}>LUCIDA ROOM</Link>
          {logado ? (
            <nav className="navtop">
              <Link className="saldo" href="/painel">Painel</Link>
              <Link className="saldo forte" href="/nova">+ Nova foto</Link>
            </nav>
          ) : (
            <nav className="navtop">
              <Link className="saldo" href="/entrar">Entrar</Link>
              <a className="saldo forte" href={`https://wa.me/5548998125929?text=${encodeURIComponent('Oi, Filipe. Vim pelo site da Lucida Room e quero um orçamento sob medida.')}`} target="_blank" rel="noopener">Pedir orçamento</a>
            </nav>
          )}
        </header>
        {!logado && <div style={{ background: '#C97B2D', color: '#23211F', textAlign: 'center', padding: '8px 16px', fontSize: 14 }}>Plataforma de autoatendimento em construção. Por enquanto, o tratamento das fotos é sob medida, feito e conferido por arquiteto.</div>}
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
