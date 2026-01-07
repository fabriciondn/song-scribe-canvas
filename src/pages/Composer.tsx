
import React from 'react';
import { Editor } from '../components/composer/Editor';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';
import { useMobileDetection } from '@/hooks/use-mobile';
import { MobileDrafts } from '@/components/mobile/MobileDrafts';
import '../App.css';

// Mobile-first responsive styles
const styles = `
  @media (max-width: 768px) {
    .composer-page {
      padding: 0;
      overflow-x: hidden;
      max-width: 100vw;
      background: hsl(var(--background));
    }
  }
  
  @media (min-width: 769px) {
    .composer-page {
      height: 100vh;
      overflow: hidden;
    }
  }
`;

const Composer: React.FC = () => {
  const { isMobile } = useMobileDetection();
  
  const handleToolsRequest = () => {
    console.log('Tools request received');
  };

  // No mobile, renderiza o MobileDrafts com tela de setup
  if (isMobile) {
    return (
      <ProOnlyWrapper featureName="Compor">
        <MobileDrafts />
      </ProOnlyWrapper>
    );
  }

  return (
    <ProOnlyWrapper featureName="Rascunho">
      <div className="composer-page">
        <style>{styles}</style>
        <Editor onToolsRequest={handleToolsRequest} />
      </div>
    </ProOnlyWrapper>
  );
};

export default Composer;
