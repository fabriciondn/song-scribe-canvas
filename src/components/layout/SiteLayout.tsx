
import React from 'react';

interface SiteLayoutProps {
  children: React.ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">MusiCifra</h1>
        </div>
      </nav>
      <main>
        {children}
      </main>
    </div>
  );
}
