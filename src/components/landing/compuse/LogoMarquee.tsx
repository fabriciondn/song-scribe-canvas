import React from 'react';
import deezer from '@/assets/logos/deezer.svg';
import amazon from '@/assets/logos/amazon.svg';
import tidal from '@/assets/logos/tidal.svg';
import appleMusic from '@/assets/logos/apple-music.svg';
import soundcloud from '@/assets/logos/soundcloud.svg';
import facebook from '@/assets/logos/facebook.svg';
import kwai from '@/assets/logos/kwai.svg';
import tiktok from '@/assets/logos/tiktok.svg';

const logos = [
  { src: deezer, alt: 'Deezer' },
  { src: amazon, alt: 'Amazon Music' },
  { src: tidal, alt: 'Tidal' },
  { src: appleMusic, alt: 'Apple Music' },
  { src: soundcloud, alt: 'SoundCloud' },
  { src: facebook, alt: 'Facebook' },
  { src: kwai, alt: 'Kwai' },
  { src: tiktok, alt: 'TikTok' },
];

export const LogoMarquee: React.FC = () => {
  const loop = [...logos, ...logos];
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)',
      }}
      aria-label="Plataformas suportadas"
    >
      <div
        className="flex items-center gap-12 w-max"
        style={{ animation: 'compuse-marquee 28s linear infinite' }}
      >
        {loop.map((l, i) => (
          <img
            key={i}
            src={l.src}
            alt={l.alt}
            style={{ height: 48, width: 'auto', opacity: 0.85 }}
            className="shrink-0"
            loading="lazy"
          />
        ))}
      </div>
      <style>{`
        @keyframes compuse-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default LogoMarquee;
