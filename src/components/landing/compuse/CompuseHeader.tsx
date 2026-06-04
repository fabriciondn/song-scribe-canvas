import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface Props {
  onCTA: () => void;
}

export const CompuseHeader: React.FC<Props> = ({ onCTA }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Registro', href: '#registro' },
    { label: 'Como funciona', href: '#como-funciona' },
    { label: 'Pacotes', href: '#pacotes' },
    { label: 'Dúvidas', href: '#faq' },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all"
      style={{
        background: scrolled ? 'rgba(8,9,9,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--c-border)' : '1px solid transparent',
      }}
    >
      <div className="c-container flex items-center justify-between py-4">
        <a href="#top" className="flex items-center gap-2">
          <img src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" alt="Compuse" className="h-7" />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium"
              style={{ color: 'var(--c-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-muted)')}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex">
          <button onClick={onCTA} className="c-btn c-btn-primary">Começar agora</button>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-deep)' }}>
          <div className="c-container flex flex-col gap-4 py-6">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base" style={{ color: 'var(--c-text-muted)' }}>
                {l.label}
              </a>
            ))}
            <button onClick={() => { setOpen(false); onCTA(); }} className="c-btn c-btn-primary mt-2">Começar agora</button>
          </div>
        </div>
      )}
    </header>
  );
};
