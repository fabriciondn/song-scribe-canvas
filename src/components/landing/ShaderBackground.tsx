import React from 'react';

// Background leve e performático usando apenas CSS
// Substituímos o shader WebGL pesado por gradientes CSS animados
export const ShaderBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* Base escura */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Gradientes verdes animados com CSS - muito mais leve que WebGL */}
      <div 
        className="absolute inset-0 opacity-60 animate-gradient-shift"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(0, 200, 83, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 70%, rgba(30, 215, 96, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 100% 100% at 50% 50%, rgba(18, 168, 106, 0.15) 0%, transparent 70%)
          `
        }}
      />
      
      {/* Overlay com gradiente sutil */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, transparent 50%, rgba(30, 215, 96, 0.08) 100%)'
        }}
      />
      
      {/* Efeito de brilho suave animado */}
      <div 
        className="absolute inset-0 opacity-30 animate-pulse-slow"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 30% 40%, rgba(30, 215, 96, 0.15) 0%, transparent 70%)'
        }}
      />
    </div>
  );
};
