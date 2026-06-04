import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface LegalBadgeProps {
  text?: string;
  className?: string;
}

/**
 * Pill badge with animated gradient border, eyebrow label and main title.
 * Visual inspired by the Product Hunt "Golden Kitty" award badge.
 */
export const LegalBadge: React.FC<LegalBadgeProps> = ({
  text = 'Registro autoral com validade jurídica',
  className = '',
}) => {
  return (
    <>
      <style>{`
        @keyframes legalBadgeShimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .legal-badge-wrap {
          position: relative;
          display: inline-flex;
          padding: 1.5px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #00B18C 0%,
            #4DD9B8 25%,
            #f3e3ac 50%,
            #4DD9B8 75%,
            #00B18C 100%
          );
          background-size: 200% 100%;
          animation: legalBadgeShimmer 6s linear infinite;
          box-shadow:
            0 0 0 1px rgba(0,177,140,0.15),
            0 8px 24px -8px rgba(0,177,140,0.35);
        }
        .legal-badge-inner {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 1.1rem 0.55rem 0.85rem;
          border-radius: 999px;
          background: #0a0a0a;
          color: #FFFBEB;
          font-family: Inter, system-ui, sans-serif;
          font-weight: 500;
          font-size: 0.8rem;
          letter-spacing: 0.01em;
          line-height: 1;
          white-space: nowrap;
        }
        .legal-badge-eyebrow {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          background: linear-gradient(90deg, #00B18C, #4DD9B8, #f3e3ac);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1;
        }
        .legal-badge-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #FFFBEB;
          line-height: 1.1;
        }
        .legal-badge-icon {
          flex: none;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #00B18C, #4DD9B8);
          color: #0a0a0a;
        }
        .legal-badge-stack {
          display: inline-flex;
          flex-direction: column;
          gap: 0.15rem;
        }
      `}</style>

      <span className={`legal-badge-wrap ${className}`}>
        <span className="legal-badge-inner">
          <span className="legal-badge-icon">
            <ShieldCheck size={14} strokeWidth={2.5} />
          </span>
          <span className="legal-badge-stack">
            <span className="legal-badge-eyebrow">COMPUSE</span>
            <span className="legal-badge-title">{text}</span>
          </span>
        </span>
      </span>
    </>
  );
};

export default LegalBadge;
