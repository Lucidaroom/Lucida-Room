import { ImageResponse } from 'next/og';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#281630', color: '#F4F1EC', fontSize: 38, fontWeight: 600, letterSpacing: -2 }}>LR</div>
    ),
    { ...size }
  );
}
