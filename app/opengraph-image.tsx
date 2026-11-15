import { ImageResponse } from 'next/og';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Lucida Room — foto de celular, olhar de arquitetura';
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F4F1EC', color: '#23211F', padding: 72 }}>
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 8, color: '#281630' }}>LUCIDA ROOM</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 78, lineHeight: 1.04, letterSpacing: -2 }}>Foto de celular.</div>
          <div style={{ fontSize: 78, lineHeight: 1.04, letterSpacing: -2 }}>Olhar de arquitetura.</div>
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#5c5852' }}>Revelar em 24 h · Ambientar em 72 h · conferida por arquiteto</div>
      </div>
    ),
    { ...size }
  );
}
